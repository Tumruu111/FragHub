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

// Where to ask whether a payment has gone through. Closing the QR never
// cancels anything: the customer can pay later from their orders page, or in
// their bank app after closing it.
type CheckUrl = (id: string) => string;

const PREORDER: CheckUrl = (id) => `/preorders/payments/${id}/check`;
const SUBSCRIPTION: CheckUrl = (id) => `/subscriptions/invoices/${id}/check`;

export const usePayment = () => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (url: string, onPaid: () => void) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(url);
        if (res.data.status === 'paid') {
          stopPolling();
          setStatus('paid');
          onPaid();
        }
      } catch {
        // Transient network error; try again on the next tick.
      }
    }, 3000);
  };

  // Gets QR data from `create`, shows it and waits for the payment
  const start = async (
    create: () => Promise<PaymentData>,
    check: CheckUrl,
    onPaid: () => void
  ) => {
    setStatus('creating');
    setError('');
    setSaved(false);
    try {
      const data = await create();
      setPayment(data);
      setStatus('pending');
      startPolling(check(data.paymentId), onPaid);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create payment.');
      // The order was placed even though the QR couldn't be made
      setSaved(e?.response?.data?.saved === true);
      setStatus('error');
    }
  };

  // Places a pre-order (one listing id per bottle) and pays its 50% deposit
  const placePreorder = (
    listingIds: string[],
    delivery: Delivery,
    onPaid: () => void
  ) =>
    start(
      async () => (await api.post('/preorders', { listingIds, delivery })).data,
      PREORDER,
      onPaid
    );

  // The deposit, if it wasn't paid at checkout, or the rest once it arrives
  const payPreorder = (paymentId: string, onPaid: () => void) =>
    start(
      async () => (await api.post(`/preorders/payments/${paymentId}/pay`)).data,
      PREORDER,
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

  // Closes the QR. Nothing is cancelled; the payment stays payable.
  const reset = () => {
    stopPolling();
    setStatus('idle');
    setPayment(null);
    setError('');
    setSaved(false);
  };

  return {
    status,
    payment,
    error,
    // Set when placing a pre-order saved it but its QR failed
    saved,
    placePreorder,
    payPreorder,
    payInvoice,
    cancelPayment: reset,
    reset,
  };
};
