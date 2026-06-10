import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createInvoice, checkInvoicePaid, cancelInvoice } from '../../lib/qpay';
import { sendEmail } from '../../lib/email';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { Role } from '../../../generated/prisma/enums';

interface JwtPayload { id: string; role: Role; }

// Send order confirmation email after payment
const sendOrderConfirmation = async (userId: string, listingIds: string[], paymentId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const listings = await prisma.listing.findMany({ where: { id: { in: listingIds } } });
  const total = listings.reduce((sum, l) => sum + Number(l.price), 0);

  await sendEmail({
    to: user.email,
    subject: 'Your Veritas Parfums order is confirmed ✓',
    template: 'order',
    data: {
      name: user.name,
      orderId: paymentId.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      total: total.toLocaleString(),
      items: listings.map(l => ({
        title: l.title,
        size: l.size,
        picture: l.picture,
        price: Number(l.price).toLocaleString(),
      })),
    },
  });
};

const getUserFromRequest = (req: Request): JwtPayload | null => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};

// POST /api/payments/create
// Body: { listingIds: string[] }
// Creates a QPay invoice for the entire cart and returns QR data
export const createPayment = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { listingIds } = req.body as { listingIds: string[] };
    if (!listingIds?.length) return res.status(400).json({ message: 'No items provided' });

    // Fetch listings and validate stock
    const listings = await prisma.listing.findMany({ where: { id: { in: listingIds } } });
    if (listings.length !== listingIds.length)
      return res.status(400).json({ message: 'One or more listings not found' });

    const outOfStock = listings.find(l => l.status === 'out_of_order' || l.stock < 1);
    if (outOfStock)
      return res.status(400).json({ message: `"${outOfStock.title}" is out of stock` });

    const amount = listings.reduce((sum, l) => sum + Number(l.price), 0);

    // Create payment record first so we have an ID for the callback
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        listingIds,
        status: 'pending',
      },
    });

    // Create QPay invoice
    const invoice = await createInvoice({
      paymentId: payment.id,
      amount,
      description: `Veritas Parfums — ${listings.map(l => l.title).join(', ')}`,
    });

    // Store QPay data on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        qpayInvoiceId: invoice.invoiceId,
        qpayQrText: invoice.qrText,
        qpayQrImage: invoice.qrImage,
        qpayUrls: invoice.urls,
      },
    });

    return res.status(201).json({
      paymentId: payment.id,
      amount,
      qrText: invoice.qrText,
      qrImage: invoice.qrImage,
      urls: invoice.urls,
    });
  } catch (err) {
    logger.error('createPayment failed', err);
    return res.status(500).json({ message: 'Failed to create payment' });
  }
};

// GET /api/payments/:id/check
// Frontend polls this to see if the user has paid
export const checkPayment = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId !== user.id)
      return res.status(403).json({ message: 'Forbidden' });

    // Already confirmed
    if (payment.status === 'paid') return res.json({ status: 'paid' });
    if (payment.status === 'cancelled') return res.json({ status: 'cancelled' });

    // Ask QPay
    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ status: 'pending' });

    // Payment confirmed — place orders and decrement stock atomically
    const listingIds = payment.listingIds as string[];

    await prisma.$transaction(async (tx) => {
      for (const listingId of listingIds) {
        const updated = await tx.listing.updateMany({
          where: { id: listingId, stock: { gt: 0 } },
          data: { stock: { decrement: 1 } },
        });
        if (updated.count === 0) throw new Error(`${listingId} went out of stock`);

        await tx.listing.updateMany({
          where: { id: listingId, stock: 0 },
          data: { status: 'out_of_order' },
        });

        await tx.order.create({
          data: { userId: payment.userId, listingId },
        });
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'paid' },
      });
    });

    logger.info('Payment confirmed', { paymentId: payment.id, userId: user.id });
    sendOrderConfirmation(payment.userId, listingIds, payment.id);
    return res.json({ status: 'paid' });
  } catch (err: any) {
    logger.error('checkPayment failed', err);
    return res.status(500).json({ message: err?.message ?? 'Payment check failed' });
  }
};

// POST /api/payments/callback  (called by QPay webhook)
export const paymentCallback = async (req: Request, res: Response) => {
  const paymentId = (req.query.paymentId ?? req.body?.paymentId) as string;
  if (!paymentId) return res.status(400).json({ message: 'Missing paymentId' });

  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'paid') return res.json({ ok: true });

    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ ok: false });

    const listingIds = payment.listingIds as string[];
    await prisma.$transaction(async (tx) => {
      for (const listingId of listingIds) {
        await tx.listing.updateMany({
          where: { id: listingId, stock: { gt: 0 } },
          data: { stock: { decrement: 1 } },
        });
        await tx.listing.updateMany({
          where: { id: listingId, stock: 0 },
          data: { status: 'out_of_order' },
        });
        await tx.order.create({
          data: { userId: payment.userId, listingId },
        });
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'paid' },
      });
    });

    logger.info('Payment confirmed via callback', { paymentId });
    sendOrderConfirmation(payment.userId, listingIds, payment.id);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('paymentCallback failed', err);
    return res.status(502).json({ message: 'Callback processing failed' });
  }
};

// DELETE /api/payments/:id  — cancel a pending payment
export const cancelPayment = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId !== user.id) return res.status(403).json({ message: 'Forbidden' });
    if (payment.status === 'paid') return res.status(400).json({ message: 'Payment already completed' });

    if (payment.qpayInvoiceId) {
      await cancelInvoice(payment.qpayInvoiceId).catch(() => {/* best-effort */});
    }

    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'cancelled' } });
    return res.json({ message: 'Payment cancelled' });
  } catch (err) {
    logger.error('cancelPayment failed', err);
    return res.status(500).json({ message: 'Failed to cancel payment' });
  }
};
