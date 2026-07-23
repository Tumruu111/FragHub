import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePayment } from '../hooks/usePayment';
import { PaymentModal } from './PaymentModal';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../../shared/auth/token';
import { useQueryClient } from '@tanstack/react-query';

export const CartDrawer = () => {
  const { items, removeItem, clearCart, total, isOpen, closeCart, itemCount } =
    useCart();
  const { status, payment, error, createPayment, cancelPayment, reset } =
    usePayment();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      closeCart();
      navigate('/login');
      return;
    }
    const listingIds = items.map((i) => i.listing.id);
    createPayment(listingIds, () => {
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

  const busy = status === 'creating' || status === 'pending';

  return (
    <>
      <PaymentModal
        status={status}
        payment={payment}
        error={error}
        onCancel={handleCancelPayment}
      />

      {isOpen && <div className="drawer-backdrop" onClick={closeCart} />}

      <div className={`cart-drawer ${isOpen ? 'open' : 'closed'}`}>
        <div className="drawer-header">
          <div className="drawer-title-row">
            <ShoppingBag size={15} color="var(--gold)" strokeWidth={1.5} />
            <span className="drawer-title">YOUR CART</span>
            {itemCount > 0 && <span className="drawer-count">{itemCount}</span>}
          </div>
          <button
            className="drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <ShoppingBag
                size={42}
                strokeWidth={0.8}
                className="drawer-empty-icon"
              />
              <p className="drawer-empty-text">YOUR CART IS EMPTY</p>
              <button className="drawer-empty-btn" onClick={closeCart}>
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            items.map(({ listing }, i) => (
              <div
                key={listing.id}
                className="drawer-item"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="drawer-item-img-wrap">
                  <img
                    className="drawer-item-img"
                    src={listing.picture}
                    alt={listing.title}
                  />
                </div>
                <div className="drawer-item-info">
                  <p className="drawer-item-title">{listing.title}</p>
                  <p className="drawer-item-size">{listing.size}</p>
                  <p className="drawer-item-price">
                    {Number(listing.price).toLocaleString()}₮
                  </p>
                </div>
                <button
                  className="drawer-item-remove"
                  onClick={() => removeItem(listing.id)}
                  aria-label={`Remove ${listing.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total-row">
              <span className="drawer-total-label">TOTAL</span>
              <span className="drawer-total-value">
                {total.toLocaleString()}₮
              </span>
            </div>

            <button
              className="drawer-checkout-btn"
              onClick={handleCheckout}
              disabled={busy}
            >
              CHECKOUT — PAY WITH QPAY
            </button>

            <button
              className="drawer-link-btn"
              onClick={() => {
                closeCart();
                navigate('/cart');
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
