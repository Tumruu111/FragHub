import { X, RefreshCw } from 'lucide-react';
import type { PaymentData, PaymentStatus } from '../hooks/usePayment';

interface Props {
  status: PaymentStatus;
  payment: PaymentData | null;
  error: string;
  onCancel: () => void;
}

export const PaymentModal = ({ status, payment, error, onCancel }: Props) => {
  if (status === 'idle') return null;

  return (
    <>
      <div className="qpay-backdrop" />

      <div className="qpay-wrap">
        <div className="qpay-modal">
          <span className="qpay-corner tl" />
          <span className="qpay-corner tr" />
          <span className="qpay-corner bl" />
          <span className="qpay-corner br" />

          <div className="qpay-header">
            <div className="qpay-header-title">
              QPAY CHECKOUT
              <span className="qpay-header-rule" />
            </div>
            <button className="qpay-close" onClick={onCancel} aria-label="Close">
              <X size={17} />
            </button>
          </div>

          <div className="qpay-body">

            {status === 'creating' && (
              <div className="qpay-creating">
                <RefreshCw size={26} className="qpay-spinner" />
                <p className="qpay-status-text">GENERATING INVOICE…</p>
              </div>
            )}

            {status === 'pending' && payment && (
              <>
                <div className="qpay-amount-block">
                  <div className="qpay-amount-eyebrow">
                    <span className="eyebrow-line" />
                    <span className="eyebrow-text">SCAN TO PAY</span>
                    <span className="eyebrow-line" />
                  </div>
                  <p className="qpay-amount">{payment.amount.toLocaleString()}₮</p>
                </div>

                <div className="qpay-qr-frame">
                  <span className="qpay-qr-tile">
                    <img
                      className="qpay-qr-img"
                      src={`data:image/png;base64,${payment.qrImage}`}
                      alt="QPay QR Code"
                    />
                  </span>
                </div>

                {payment.urls.length > 0 && (
                  <div className="qpay-banks">
                    <div className="qpay-banks-label">
                      <span>OR OPEN YOUR BANKING APP</span>
                    </div>
                    <div className="qpay-banks-grid">
                      {payment.urls.slice(0, 6).map((u) => (
                        <a
                          key={u.name}
                          className="qpay-bank-link"
                          href={u.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img className="qpay-bank-logo" src={u.logo} alt={u.name} />
                          <span className="qpay-bank-name">{u.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="qpay-waiting">
                  <RefreshCw size={11} className="qpay-spinner" />
                  <span>Awaiting payment…</span>
                </div>
              </>
            )}

            {status === 'paid' && (
              <div className="qpay-paid">
                <div className="qpay-paid-mark">✓</div>
                <p className="qpay-paid-title">Payment Confirmed</p>
                <p className="qpay-paid-sub">YOUR ORDERS ARE BEING PROCESSED</p>
              </div>
            )}

            {status === 'error' && (
              <div className="qpay-error">
                <p className="qpay-error-text">{error || 'Something went wrong.'}</p>
                <button className="qpay-error-btn" onClick={onCancel}>CLOSE</button>
              </div>
            )}

            {(status === 'pending' || status === 'creating') && (
              <button className="qpay-cancel-link" onClick={onCancel}>
                Cancel payment
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
