import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../lib/auth';
import { createInvoice, checkInvoicePaid } from '../../lib/qpay';
import { subscribeSchema, validate } from '../../lib/validation';
import {
  PLANS,
  canPayInvoice,
  firstBillingMonth,
} from '../../lib/subscriptions';
import { monthName, settleInvoice } from './service';

// POST /api/subscriptions
// Body: { plan, forWhom, delivery }. Signs the buyer up and returns the first
// month's invoice to pay, or { waitlist: true } for a plan that isn't open.
// Signing up again updates the details instead of making a second one.
export const subscribe = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const body = validate(subscribeSchema, req.body);
    if (!body.ok) return res.status(400).json({ message: body.error });
    const { plan, forWhom, delivery } = body.data;

    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    if (existing?.status === 'active')
      return res
        .status(400)
        .json({ message: 'You already have an active subscription' });

    const status = PLANS[plan].open ? 'pending' : 'waitlist';
    const details = {
      plan,
      forWhom,
      status,
      deliveryPhone: delivery.phone,
      deliveryAddress: delivery.address,
      deliveryNote: delivery.note ?? null,
      cancelledAt: null,
    } as const;
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...details },
      update: details,
    });

    if (status === 'waitlist') return res.status(201).json({ waitlist: true });

    const month = firstBillingMonth(new Date());
    const invoice = await prisma.subscriptionInvoice.upsert({
      where: {
        subscriptionId_month: { subscriptionId: subscription.id, month },
      },
      create: {
        subscriptionId: subscription.id,
        month,
        amount: PLANS[plan].price,
      },
      update: {},
    });
    return res.status(201).json({ invoiceId: invoice.id, month });
  } catch (err) {
    logger.error('subscribe failed', err);
    return res.status(500).json({ message: 'Failed to subscribe' });
  }
};

const ownInvoice = async (req: Request, res: Response) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: req.params.id },
    include: { subscription: true },
  });
  if (!invoice || invoice.subscription.userId !== user.id) {
    res.status(404).json({ message: 'Invoice not found' });
    return null;
  }
  return invoice;
};

// POST /api/subscriptions/invoices/:id/pay
// Returns QPay QR data for a month's invoice, the same shape as a checkout
export const payInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await ownInvoice(req, res);
    if (!invoice) return;
    if (invoice.status === 'paid')
      return res.status(400).json({ message: 'This month is already paid' });
    if (invoice.subscription.status === 'cancelled')
      return res
        .status(400)
        .json({ message: 'This subscription is cancelled' });
    if (!canPayInvoice(invoice.month, new Date()))
      return res.status(400).json({
        message: `${monthName(
          invoice.month
        )} boxes have shipped. Next month's invoice comes on the 1st.`,
      });

    const amount = Number(invoice.amount);
    let qpay = invoice.qpayInvoiceId
      ? {
          qrText: invoice.qpayQrText,
          qrImage: invoice.qpayQrImage,
          urls: invoice.qpayUrls,
        }
      : null;
    if (!qpay) {
      const created = await createInvoice({
        paymentId: invoice.id,
        amount,
        description: `Veritas Parfums box — ${monthName(invoice.month)}`,
      });
      await prisma.subscriptionInvoice.update({
        where: { id: invoice.id },
        data: {
          qpayInvoiceId: created.invoiceId,
          qpayQrText: created.qrText,
          qpayQrImage: created.qrImage,
          qpayUrls: created.urls,
        },
      });
      qpay = created;
    }

    return res.json({ paymentId: invoice.id, amount, ...qpay });
  } catch (err) {
    logger.error('payInvoice failed', err);
    return res.status(500).json({ message: 'Failed to create payment' });
  }
};

// GET /api/subscriptions/invoices/:id/check
// The frontend polls this while the QR is open
export const checkSubscriptionInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await ownInvoice(req, res);
    if (!invoice) return;
    if (invoice.status === 'paid') return res.json({ status: 'paid' });
    if (!invoice.qpayInvoiceId) return res.json({ status: 'pending' });

    const paid = await checkInvoicePaid(invoice.qpayInvoiceId);
    if (!paid) return res.json({ status: 'pending' });
    if (await settleInvoice(invoice.id))
      logger.info('Subscription month paid', { invoiceId: invoice.id });
    return res.json({ status: 'paid' });
  } catch (err) {
    logger.error('checkSubscriptionInvoice failed', err);
    return res.status(500).json({ message: 'Payment check failed' });
  }
};

// Called from the QPay callback when its id isn't a checkout's
export const settleInvoiceFromCallback = async (
  invoiceId: string
): Promise<boolean> => {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) return false;
  if (invoice.status !== 'paid' && invoice.qpayInvoiceId) {
    if (await checkInvoicePaid(invoice.qpayInvoiceId)) {
      await settleInvoice(invoice.id);
      logger.info('Subscription month paid via callback', { invoiceId });
    }
  }
  return true;
};
