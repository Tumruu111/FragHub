import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePayment } from '../hooks/usePayment';
import { PaymentModal } from './PaymentModal';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../../shared/auth/token';
import { useQueryClient } from '@tanstack/react-query';

export const CartDrawer = () => {
  const { items, removeItem, clearCart, total, isOpen, closeCart, itemCount } = useCart();
  const { status, payment, error, createPayment, cancelPayment, reset } = usePayment();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      closeCart();
      navigate('/login');
      return;
    }
    const listingIds = items.map(i => i.listing.id);
    createPayment(listingIds, () => {
      // Called when payment confirmed
      clearCart();
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setTimeout(() => {
        reset();
        closeCart();
        navigate('/cart');
      }, 2000);
    });
  };

  const handleCancelPayment = () => {
    cancelPayment();
  };

  return (
    <>
      <PaymentModal status={status} payment={payment} error={error} onCancel={handleCancelPayment} />

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease both',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShoppingBag size={16} color="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--text)' }}>
              YOUR CART
            </span>
            {itemCount > 0 && (
              <span style={{
                background: 'var(--gold)', color: '#0a0a0a',
                fontSize: '0.6rem', fontWeight: 600,
                width: '18px', height: '18px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.75rem' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', paddingTop: '4rem' }}>
              <ShoppingBag size={40} color="var(--border2)" strokeWidth={1} />
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>
                YOUR CART IS EMPTY
              </p>
              <button
                onClick={closeCart}
                style={{
                  marginTop: '0.5rem', padding: '0.6rem 1.5rem',
                  border: '1px solid var(--border2)', background: 'transparent',
                  color: 'var(--text-muted)', fontSize: '0.62rem',
                  letterSpacing: '0.2em', cursor: 'pointer',
                }}
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {items.map(({ listing }) => (
                <div key={listing.id} style={{
                  display: 'flex', gap: '1rem', padding: '1rem 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <img
                    src={listing.picture}
                    alt={listing.title}
                    style={{ width: 64, height: 80, objectFit: 'cover', flexShrink: 0, background: 'var(--bg-elevated)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--text)', lineHeight: 1.2 }}>
                      {listing.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--text-dim)' }}>
                      {listing.size}
                    </p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--gold)', marginTop: 'auto' }}>
                      {Number(listing.price).toLocaleString()}₮
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(listing.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', alignSelf: 'flex-start', padding: '4px', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.5rem 1.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--text-muted)' }}>TOTAL</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>
                {total.toLocaleString()}₮
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={status === 'creating' || status === 'pending'}
              style={{
                width: '100%', padding: '1rem',
                background: (status === 'creating' || status === 'pending')
                  ? 'rgba(201,168,76,0.4)'
                  : 'linear-gradient(135deg, #7a6128, #C9A84C 45%, #E8C97A 80%, #C9A84C)',
                border: 'none',
                cursor: (status === 'creating' || status === 'pending') ? 'default' : 'pointer',
                color: '#0a0a0a', fontFamily: 'var(--font-sans)',
                fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.28em',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={e => { if (status === 'idle') (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
            >
              CHECKOUT — PAY WITH QPAY
            </button>

            <button
              onClick={() => { closeCart(); navigate('/cart'); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.6rem',
                letterSpacing: '0.2em', color: 'var(--text-dim)',
                textAlign: 'center', textDecoration: 'underline',
              }}
            >
              View order history
            </button>
          </div>
        )}
      </div>
    </>
  );
};
