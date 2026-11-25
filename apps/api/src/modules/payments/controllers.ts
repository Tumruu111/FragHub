import type { Request, Response } from 'express';
import { logger } from '../../lib/logger';
import { settlePreorderFromCallback } from '../preorders/controllers';
import { settleInvoiceFromCallback } from '../subscriptions/controllers';

// QPay calls this when an invoice is paid, with the id we gave the invoice:
// a pre-order payment's or a subscription month's. Each settles itself only
// after asking QPay, so a forged call can't mark anything paid.
export const paymentCallback = async (req: Request, res: Response) => {
  const paymentId = (req.query.paymentId ?? req.body?.paymentId) as string;
  if (!paymentId) return res.status(400).json({ message: 'Missing paymentId' });

  try {
    const found =
      (await settlePreorderFromCallback(paymentId)) ||
      (await settleInvoiceFromCallback(paymentId));
    if (!found) logger.warn('QPay callback for an unknown id', { paymentId });
    return res.json({ ok: true });
  } catch (err) {
    logger.error('paymentCallback failed', err);
    return res.status(502).json({ message: 'Callback processing failed' });
  }
};
