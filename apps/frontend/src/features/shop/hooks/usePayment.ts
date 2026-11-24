import { useState, useEffect, useRef } from 'react';
import { api } from '../../../shared/api';
import type { Delivery } from '../../../types/order';

export type PaymentStatus = 'idle' | 'creating' | 'pending' | 'paid' | 'error';

export interface PaymentData {
  paymentId: string;
  amount: number;
  qrImage: string;
  qrText: string;
  urls: { name: string; description: string; logo: string; link: string }[];
}

// Where to ask whether a payment has gone through, and how to call it off
interface PaymentEndpoints {
  check: (id: string) => string;
  // Leave out when closing the QR shouldn't cancel anything
  cancel?: (id: string) => string;
}

const CHECKOUT: PaymentEndpoints = {
  check: (id) => `/payments/${id}/check`,
  cancel: (id) => `/payments/${id}`,
};

// A month's invoice stays payable after the QR is closed, until the 20th
const SUBSCRIPTION: PaymentEndpoints = {
  check: (id) => `/subscriptions/invoices/${id}/check`,
};

export const usePayment = () => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endpointsRef = useRef<PaymentEndpoints>(CHECKOUT);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (paymentId: string, onPaid: () => void) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(endpointsRef.current.check(paymentId));
        if (res.data.status === 'paid') {
          stopPolling();
          setStatus('paid');
          onPaid();
        } else if (res.data.status === 'cancelled') {
          stopPolling();
          setStatus('error');
          setError('Payment was cancelled.');
        } else if (res.data.status === 'failed') {
          // Paid, but an item sold out before we could fulfil it.
          stopPolling();
          setStatus('error');
          setError(
            'Payment received, but an item sold out first. We will refund you.'
          );
        }
      } catch {
        // Transient network error; try again on the next tick.
      }
    }, 3000);
  };

  // Gets QR data from `create`, shows it and waits for the payment
  const start = async (
    create: () => Promise<PaymentData>,
    endpoints: PaymentEndpoints,
    onPaid: () => void
  ) => {
    endpointsRef.current = endpoints;
    setStatus('creating');
    setError('');
    try {
      const data = await create();
      setPayment(data);
      setStatus('pending');
      startPolling(data.paymentId, onPaid);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create payment.');
      setStatus('error');
    }
  };

  // units: one "listingId:sizeMl" per decant
  const createPayment = (
    units: string[],
    delivery: Delivery,
    onPaid: () => void
  ) =>
    start(
      async () =>
        (await api.post('/payments/create', { units, delivery })).data,
      CHECKOUT,
      onPaid
    );

  // One month of a subscription
  const payInvoice = (invoiceId: string, onPaid: () => void) =>
    start(
      async () =>
        (await api.post(`/subscriptions/invoices/${invoiceId}/pay`)).data,
      SUBSCRIPTION,
      onPaid
    );

  const cancelPayment = async () => {
    stopPolling();
    const cancel = endpointsRef.current.cancel;
    if (payment?.paymentId && cancel) {
      await api.delete(cancel(payment.paymentId)).catch(() => {
        /* best-effort */
      });
    }
    setStatus('idle');
    setPayment(null);
    setError('');
  };

  const reset = () => {
    stopPolling();
    setStatus('idle');
    setPayment(null);
    setError('');
  };

  return {
    status,
    payment,
    error,
    createPayment,
    payInvoice,
    cancelPayment,
    reset,
  };
};
