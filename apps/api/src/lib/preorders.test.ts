import { describe, expect, it } from 'vitest';
import {
  AFTER_PAYMENT,
  balanceDueBy,
  canCancel,
  isOverdue,
  splitPayment,
} from './preorders';

describe('splitPayment', () => {
  it('takes half up front', () => {
    expect(splitPayment(500000)).toEqual({ deposit: 250000, balance: 250000 });
  });

  it('rounds the deposit up so the halves add up to the total', () => {
    expect(splitPayment(450001)).toEqual({ deposit: 225001, balance: 225000 });
  });
});

describe('AFTER_PAYMENT', () => {
  it('starts the order on the deposit and readies delivery on the rest', () => {
    expect(AFTER_PAYMENT.deposit).toEqual({
      from: 'awaiting_deposit',
      to: 'ordering',
    });
    expect(AFTER_PAYMENT.balance).toEqual({ from: 'arrived', to: 'paid' });
  });
});

describe('balance deadline', () => {
  const arrived = new Date('2026-12-01T10:00:00Z');

  it('gives the customer 7 days after arrival', () => {
    expect(balanceDueBy(arrived).toISOString()).toBe(
      '2026-12-08T10:00:00.000Z'
    );
  });

  it('is overdue only after the deadline', () => {
    expect(isOverdue(arrived, new Date('2026-12-08T09:59:00Z'))).toBe(false);
    expect(isOverdue(arrived, new Date('2026-12-08T10:01:00Z'))).toBe(true);
    expect(isOverdue(null, new Date('2027-01-01'))).toBe(false);
  });
});

describe('canCancel', () => {
  it('is allowed until the bottles are delivered', () => {
    expect(canCancel('ordering')).toBe(true);
    expect(canCancel('paid')).toBe(true);
    expect(canCancel('delivered')).toBe(false);
    expect(canCancel('cancelled')).toBe(false);
  });
});
