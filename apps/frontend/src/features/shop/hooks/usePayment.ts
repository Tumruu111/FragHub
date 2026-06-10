import { useState, useEffect, useRef } from 'react';
import { api } from '../../../shared/api';

export type PaymentStatus = 'idle' | 'creating' | 'pending' | 'paid' | 'error';

export interface PaymentData {
  paymentId: string;
  amount: number;
  qrImage: string;   // base64 PNG from QPay
  qrText: string;
  urls: { name: string; description: string; logo: string; link: string }[];
}

export const usePayment = () => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        const res = await api.get(`/payments/${paymentId}/check`);
        if (res.data.status === 'paid') {
          stopPolling();
          setStatus('paid');
          onPaid();
        } else if (res.data.status === 'cancelled') {
          stopPolling();
          setStatus('error');
          setError('Payment was cancelled.');
        }
      } catch {
        // silently retry
      }
    }, 3000); // poll every 3 seconds
  };

  const createPayment = async (listingIds: string[], onPaid: () => void) => {
    setStatus('creating');
    setError('');
    try {
      const res = await api.post('/payments/create', { listingIds });
      setPayment(res.data);
      setStatus('pending');
      startPolling(res.data.paymentId, onPaid);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create payment.');
      setStatus('error');
    }
  };

  const cancelPayment = async () => {
    stopPolling();
    if (payment?.paymentId) {
      await api.delete(`/payments/${payment.paymentId}`).catch(() => {/* best-effort */});
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

  return { status, payment, error, createPayment, cancelPayment, reset };
};
