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
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease both',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          animation: 'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--text)' }}>
              QPAY CHECKOUT
            </span>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

            {/* Creating */}
            {status === 'creating' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <RefreshCw size={28} color="var(--gold)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>
                  GENERATING INVOICE...
                </p>
              </div>
            )}

            {/* Pending — show QR */}
            {status === 'pending' && payment && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--gold)', marginBottom: '0.5rem' }}>
                    SCAN TO PAY
                  </p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--text)' }}>
                    {payment.amount.toLocaleString()}₮
                  </p>
                </div>

                {/* QR Code */}
                <div style={{ padding: '12px', background: '#fff', display: 'inline-block' }}>
                  <img
                    src={`data:image/png;base64,${payment.qrImage}`}
                    alt="QPay QR Code"
                    style={{ width: 200, height: 200, display: 'block' }}
                  />
                </div>

                {/* Bank deep links */}
                {payment.urls.length > 0 && (
                  <div style={{ width: '100%' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '0.75rem' }}>
                      OR OPEN YOUR BANKING APP
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {payment.urls.slice(0, 6).map((u) => (
                        <a
                          key={u.name}
                          href={u.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            padding: '10px 6px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-elevated)',
                            textDecoration: 'none',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-border)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                          <img src={u.logo} alt={u.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {u.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={11} color="var(--text-dim)" style={{ animation: 'spin 2s linear infinite' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', letterSpacing: '0.15em', color: 'var(--text-dim)' }}>
                    Waiting for payment...
  </p>
                </div>
              </>
            )}

            {/* Paid */}
            {status === 'paid' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.3em', color: '#6ee7b7' }}>
                  PAYMENT CONFIRMED
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                  Your orders are being processed...
                </p>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.1em', color: '#f87171', marginBottom: '1rem' }}>
                  {error || 'Something went wrong.'}
                </p>
                <button onClick={onCancel} style={{
                  padding: '0.6rem 1.5rem', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
                  letterSpacing: '0.2em', cursor: 'pointer',
                }}>
                  CLOSE
                </button>
              </div>
            )}

            {/* Cancel button */}
            {(status === 'pending' || status === 'creating') && (
              <button onClick={onCancel} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.58rem',
                letterSpacing: '0.15em', color: 'var(--text-dim)',
                textDecoration: 'underline',
              }}>
                Cancel payment
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};
