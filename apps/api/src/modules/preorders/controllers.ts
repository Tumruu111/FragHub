import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../lib/auth';
import { createInvoice, checkInvoicePaid } from '../../lib/qpay';
import { createPreorderSchema, validate } from '../../lib/validation';
import {
  PreorderError,
  createPreorder,
  payableError,
  settlePreorderPayment,
  shortId,
} from './service';

type PaymentWithPreorder = NonNullable<Awaited<ReturnType<typeof findPayment>>>;

const findPayment = (id: string) =>
  prisma.preorderPayment.findUnique({
    where: { id },
    include: { preorder: true },
  });

// QR data for a payment, creating its QPay invoice the first time
const qrFor = async (payment: PaymentWithPreorder) => {
  const amount = Number(payment.amount);
  if (payment.qpayInvoiceId)
    return {
      paymentId: payment.id,
      amount,
      qrText: payment.qpayQrText,
      qrImage: payment.qpayQrImage,
      urls: payment.qpayUrls,
    };

  const invoice = await createInvoice({
    paymentId: payment.id,
    amount,
    description: `Veritas Parfums pre-order ${shortId(payment.preorderId)} — ${
      payment.kind === 'deposit' ? '50% deposit' : 'the rest'
    }`,
  });
  await prisma.preorderPayment.update({
    where: { id: payment.id },
    data: {
      qpayInvoiceId: invoice.invoiceId,
      qpayQrText: invoice.qrText,
      qpayQrImage: invoice.qrImage,
      qpayUrls: invoice.urls,
    },
  });
  return {
    paymentId: payment.id,
    amount,
    qrText: invoice.qrText,
    qrImage: invoice.qrImage,
    urls: invoice.urls,
  };
};

// POST /api/preorders
// Body: { listingIds, delivery }, one listing id per bottle. Places the
// pre-order and returns the QR for its 50% deposit.
export const placePreorder = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const body = validate(createPreorderSchema, req.body);
    if (!body.ok) return res.status(400).json({ message: body.error });
    const { listingIds, delivery } = body.data;

    const preorder = await createPreorder(user.id, listingIds, delivery);
    const deposit = await findPayment(preorder.payments[0].id);
    try {
      if (!deposit) throw new Error('Deposit payment missing');
      return res.status(201).json(await qrFor(deposit));
    } catch (err) {
      // The pre-order is saved; only the QR failed. `saved` tells the shop
      // to empty the cart so the customer doesn't order it twice.
      logger.error('placePreorder: QPay invoice failed', err);
      return res.status(502).json({
        saved: true,
        message:
          "Your pre-order is saved, but QPay didn't respond. Pay the deposit from your Orders page.",
      });
    }
  } catch (err) {
    if (err instanceof PreorderError)
      return res.status(400).json({ message: err.message });
    logger.error('placePreorder failed', err);
    return res.status(500).json({ message: 'Failed to place the pre-order' });
  }
};

const ownPayment = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const payment = await findPayment(req.params.id);
  if (!payment || payment.preorder.userId !== user.id) {
    res.status(404).json({ message: 'Payment not found' });
    return null;
  }
  return payment;
};

// POST /api/preorders/payments/:id/pay
// QR for the deposit (if it wasn't paid at checkout) or for the rest
export const payPreorderPayment = async (req: Request, res: Response) => {
  try {
    const payment = await ownPayment(req, res);
    if (!payment) return;
    const error = payableError(
      payment.kind,
      payment.status,
      payment.preorder.status
    );
    if (error) return res.status(400).json({ message: error });
    return res.json(await qrFor(payment));
  } catch (err) {
    logger.error('payPreorderPayment failed', err);
    return res.status(500).json({ message: 'Failed to create payment' });
  }
};

// GET /api/preorders/payments/:id/check
// The frontend polls this while the QR is open
export const checkPreorderPayment = async (req: Request, res: Response) => {
  try {
    const payment = await ownPayment(req, res);
    if (!payment) return;
    if (payment.status === 'paid') return res.json({ status: 'paid' });
    if (!payment.qpayInvoiceId) return res.json({ status: 'pending' });

    if (!(await checkInvoicePaid(payment.qpayInvoiceId)))
      return res.json({ status: 'pending' });
    if (await settlePreorderPayment(payment.id))
      logger.info('Pre-order payment paid', { paymentId: payment.id });
    return res.json({ status: 'paid' });
  } catch (err) {
    logger.error('checkPreorderPayment failed', err);
    return res.status(500).json({ message: 'Payment check failed' });
  }
};

// Called from the QPay callback. Returns false when the id isn't a
// pre-order payment.
export const settlePreorderFromCallback = async (
  paymentId: string
): Promise<boolean> => {
  const payment = await prisma.preorderPayment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) return false;
  if (
    payment.status !== 'paid' &&
    payment.qpayInvoiceId &&
    (await checkInvoicePaid(payment.qpayInvoiceId)) &&
    (await settlePreorderPayment(payment.id))
  )
    logger.info('Pre-order payment paid via callback', { paymentId });
  return true;
};
