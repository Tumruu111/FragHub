import { useState } from 'react';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePayment } from '../hooks/usePayment';
import { PaymentModal } from './PaymentModal';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../../shared/auth/token';
import { useQueryClient } from '@tanstack/react-query';
import { QuantityStepper } from '../../../shared/components/QuantityStepper';
import { splitPayment } from '../../../types/listing';
import type { Delivery } from '../../../types/order';
import {
  DeliveryForm,
  deliveryErrors,
  loadSavedDelivery,
  saveDelivery,
} from './DeliveryForm';

export const CartDrawer = () => {
  const {
    items,
    setQuantity,
    removeItem,
    clearCart,
    roomLeft,
    total,
    isOpen,
    closeCart,
    itemCount,
  } = useCart();
  const { status, payment, error, saved, placePreorder, reset } = usePayment();
  const navigate = useNavigate();
  const qc = useQueryClient();
  // Checkout is two steps: the cart, then where to deliver it
  const [step, setStep] = useState<'cart' | 'delivery'>('cart');
  const [delivery, setDelivery] = useState<Delivery>(loadSavedDelivery);
  const [errors, setErrors] = useState<Partial<Delivery>>({});
  const { deposit, balance } = splitPayment(total);

  const showOrders = () => {
    reset();
    closeCart();
    setStep('cart');
    navigate('/orders');
  };

  const goToDelivery = () => {
    if (!isAuthenticated()) {
      closeCart();
      navigate('/login');
      return;
    }
    setStep('delivery');
  };

  const handlePay = () => {
    const found = deliveryErrors(delivery);
    setErrors(found);
    if (Object.keys(found).length) return;
    saveDelivery(delivery);
    // The API takes one listing id per bottle: 2 × a is ['a', 'a']
    const listingIds = items.flatMap(({ listing, quantity }) =>
      Array.from({ length: quantity }, () => listing.id)
    );
    placePreorder(listingIds, delivery, () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ['preorders'] });
      setTimeout(showOrders, 2000);
    });
  };

  // The pre-order is placed once the QR shows (or saved when only the QR
  // failed), so closing it leaves an unpaid pre-order the customer can pay
  // from their orders page
  const closePayment = () => {
    if (status === 'pending' || saved) {
      clearCart();
      qc.invalidateQueries({ queryKey: ['preorders'] });
      showOrders();
    } else reset();
  };

  const busy = status === 'creating' || status === 'pending';

  return (
    <>
      <PaymentModal
        status={status}
        payment={payment}
        error={error}
        onCancel={closePayment}
      />

      {isOpen && <div className="drawer-backdrop" onClick={closeCart} />}

      <div className={`cart-drawer ${isOpen ? 'open' : 'closed'}`}>
        <div className="drawer-header">
          <div className="drawer-title-row">
            <ShoppingBag size={15} color="var(--gold)" strokeWidth={1.5} />
            <span className="drawer-title">YOUR PRE-ORDER</span>
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
          {step === 'delivery' && items.length > 0 ? (
            <DeliveryForm
              id="delivery-form"
              value={delivery}
              errors={errors}
              onChange={setDelivery}
              onSubmit={handlePay}
            />
          ) : items.length === 0 ? (
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
            items.map(({ listing, quantity }, i) => (
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
                  <p className="drawer-item-size">
                    {listing.bottleMl}ml full bottle
                  </p>
                  <QuantityStepper
                    size="sm"
                    value={quantity}
                    max={quantity + roomLeft}
                    onChange={(q) => setQuantity(listing.id, q)}
                  />
                  <p className="drawer-item-price">
                    {((listing.bottlePrice ?? 0) * quantity).toLocaleString()}₮
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
            <div className="drawer-total-row">
              <span className="drawer-total-label">PAY NOW (50%)</span>
              <span className="drawer-total-value">
                {deposit.toLocaleString()}₮
              </span>
            </div>
            <div className="drawer-total-row">
              <span className="drawer-total-label">WHEN IT ARRIVES IN UB</span>
              <span className="drawer-total-label">
                {balance.toLocaleString()}₮
              </span>
            </div>
            <p className="drawer-note">
              We import every bottle to order, usually in 1–2 weeks. Once it
              lands in UB you pay the rest within 7 days and we deliver. The
              deposit can&apos;t be refunded once we&apos;ve ordered, unless we
              can&apos;t get the bottle.
            </p>

            {/* The keys stop React reusing the CHECKOUT button as the submit
                button mid-click, which would submit the empty form at once */}
            {step === 'cart' ? (
              <>
                <button
                  key="checkout"
                  type="button"
                  className="drawer-checkout-btn"
                  onClick={goToDelivery}
                >
                  CHECKOUT
                </button>
                <button
                  key="history"
                  type="button"
                  className="drawer-link-btn"
                  onClick={() => {
                    closeCart();
                    navigate('/orders');
                  }}
                >
                  View your orders
                </button>
              </>
            ) : (
              <>
                <button
                  key="pay"
                  type="submit"
                  form="delivery-form"
                  className="drawer-checkout-btn"
                  disabled={busy}
                >
                  PAY {deposit.toLocaleString()}₮ WITH QPAY
                </button>
                <button
                  key="back"
                  type="button"
                  className="drawer-link-btn"
                  onClick={() => setStep('cart')}
                  disabled={busy}
                >
                  Back to cart
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};
