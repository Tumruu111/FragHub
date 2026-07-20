import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createInvoice, checkInvoicePaid, cancelInvoice } from '../../lib/qpay';
import { sendEmail } from '../../lib/email';
import { getUserFromRequest } from '../../lib/auth';
import { config } from '../../config';

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

// Payment was confirmed by QPay but fulfillment failed (stock ran out first).
// Mark the payment failed and alert the admin — the buyer needs a manual refund.
const handleFulfillmentFailure = async (
  payment: { id: string; userId: string; listingIds: string[]; amount: unknown },
  err: unknown
) => {
  logger.error('Paid but unfulfilled — refund needed', { paymentId: payment.id, err });

  await prisma.payment
    .update({ where: { id: payment.id }, data: { status: 'failed' } })
    .catch(e => logger.error('Failed to mark payment failed', e));

  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const listings = await prisma.listing.findMany({ where: { id: { in: payment.listingIds } } });

  await sendEmail({
    to: config.email.adminAlert,
    subject: `⚠ Refund needed — paid but unfulfilled order ${payment.id.slice(0, 8).toUpperCase()}`,
    template: 'fulfillment-alert',
    data: {
      paymentId: payment.id,
      shortId: payment.id.slice(0, 8).toUpperCase(),
      date: new Date().toLocaleString('en-US'),
      amount: Number(payment.amount).toLocaleString(),
      reason: err instanceof Error ? err.message : String(err),
      buyerName: user?.name ?? 'Unknown',
      buyerEmail: user?.email ?? payment.userId,
      items: listings.map(l => ({ title: l.title, size: l.size })),
    },
  });
};

// Fulfill a confirmed payment: decrement stock and create orders atomically.
// Throws if any listing is out of stock — the payment then stays pending
// instead of overselling.
const fulfillPayment = async (payment: { id: string; userId: string; listingIds: string[] }) => {
  await prisma.$transaction(async (tx) => {
    for (const listingId of payment.listingIds) {
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
};

// POST /api/payments/create
// Body: { listingIds: string[] }
// Creates a QPay invoice for the entire cart and returns QR data
export const createPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
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
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.userId !== user.id)
      return res.status(403).json({ message: 'Forbidden' });

    // Already confirmed
    if (payment.status === 'paid') return res.json({ status: 'paid' });
    if (payment.status === 'cancelled') return res.json({ status: 'cancelled' });
    if (payment.status === 'failed') return res.json({ status: 'failed' });

    // Ask QPay
    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ status: 'pending' });

    try {
      await fulfillPayment(payment);
    } catch (err) {
      await handleFulfillmentFailure(payment, err);
      return res.json({ status: 'failed' });
    }

    logger.info('Payment confirmed', { paymentId: payment.id, userId: user.id });
    sendOrderConfirmation(payment.userId, payment.listingIds, payment.id);
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
    if (!payment || payment.status === 'paid' || payment.status === 'failed')
      return res.json({ ok: true });

    const paid = await checkInvoicePaid(payment.qpayInvoiceId!);
    if (!paid) return res.json({ ok: false });

    try {
      await fulfillPayment(payment);
    } catch (err) {
      await handleFulfillmentFailure(payment, err);
      return res.json({ ok: true });
    }

    logger.info('Payment confirmed via callback', { paymentId });
    sendOrderConfirmation(payment.userId, payment.listingIds, payment.id);
    return res.json({ ok: true });
  } catch (err) {
    logger.error('paymentCallback failed', err);
    return res.status(502).json({ message: 'Callback processing failed' });
  }
};

// DELETE /api/payments/:id  — cancel a pending payment
export const cancelPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
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
