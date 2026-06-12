import axios from 'axios';
import { config } from '../config';

const BASE = config.qpay.baseUrl;

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const credentials = Buffer.from(
    `${config.qpay.username}:${config.qpay.password}`
  ).toString('base64');

  const res = await axios.post(
    `${BASE}/auth/token`,
    {},
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  cachedToken = res.data.access_token;

  tokenExpiresAt = Date.now() + (res.data.expires_in - 300) * 1000;
  return cachedToken!;
};

export interface QPayInvoice {
  invoiceId: string;
  qrText: string;
  qrImage: string;
  urls: { name: string; description: string; logo: string; link: string }[];
}

export const createInvoice = async (params: {
  paymentId: string;
  amount: number;
  description: string;
}): Promise<QPayInvoice> => {
  const token = await getAccessToken();

  const res = await axios.post(
    `${BASE}/invoice`,
    {
      invoice_code: config.qpay.invoiceCode,
      sender_invoice_no: params.paymentId,
      invoice_receiver_code: 'terminal',
      invoice_description: params.description,
      amount: params.amount,
      callback_url: `${config.qpay.callbackUrl}?paymentId=${params.paymentId}`,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    invoiceId: res.data.invoice_id,
    qrText: res.data.qr_text,
    qrImage: res.data.qr_image,
    urls: res.data.urls ?? [],
  };
};

export const checkInvoicePaid = async (invoiceId: string): Promise<boolean> => {
  const token = await getAccessToken();

  const res = await axios.post(
    `${BASE}/payment/check`,
    {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data.count > 0 && res.data.paid_amount > 0;
};

export const cancelInvoice = async (invoiceId: string): Promise<void> => {
  const token = await getAccessToken();
  await axios.delete(`${BASE}/invoice/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
