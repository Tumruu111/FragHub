import { describe, expect, it } from 'vitest';
import { cartTotal, findShortage, groupUnits, type CartLine } from './cart';

const sauvage = {
  id: 'sauvage',
  title: 'Sauvage',
  status: 'in_stock',
  volumeMl: 12,
};
const line = (sizeMl: number, quantity: number, price = 1000): CartLine => ({
  listing: sauvage,
  sizeMl,
  price,
  quantity,
});

describe('groupUnits', () => {
  it('counts repeated units as quantity', () => {
    const { lines, distinct } = groupUnits(['a:5', 'b:2', 'a:5']);
    expect(distinct).toBe(2);
    expect(lines).toEqual([
      { listingId: 'a', sizeMl: 5, quantity: 2 },
      { listingId: 'b', sizeMl: 2, quantity: 1 },
    ]);
  });

  it('keeps sizes of the same listing as separate lines', () => {
    expect(groupUnits(['a:5', 'a:10']).lines).toHaveLength(2);
  });

  it('drops malformed units so callers can detect them', () => {
    const { lines, distinct } = groupUnits(['a:5', 'nonsense']);
    expect(lines).toHaveLength(1);
    expect(distinct).toBe(2);
  });
});

describe('findShortage', () => {
  it('allows sizes that fit in the bottle together', () => {
    // 1 × 10ml + 1 × 2ml = 12ml, exactly what is left
    expect(findShortage([line(10, 1), line(2, 1)])).toBeNull();
  });

  it('adds up every size of the same bottle', () => {
    // 10ml + 5ml = 15ml, but only 12ml left
    expect(findShortage([line(10, 1), line(5, 1)])).toBe(
      'Only 12ml of "Sauvage" left'
    );
  });

  it('counts quantity', () => {
    expect(findShortage([line(5, 3)])).toBe('Only 12ml of "Sauvage" left');
  });

  it('reports out of stock when not even the smallest size fits', () => {
    const empty = { ...sauvage, volumeMl: 1 };
    expect(
      findShortage([{ listing: empty, sizeMl: 2, price: 1, quantity: 1 }])
    ).toBe('"Sauvage" is out of stock');
  });

  it('reports out of stock when the listing is switched off', () => {
    const off = { ...sauvage, status: 'out_of_order' };
    expect(
      findShortage([{ listing: off, sizeMl: 2, price: 1, quantity: 1 }])
    ).toBe('"Sauvage" is out of stock');
  });

  it('checks each bottle separately', () => {
    const other = { ...sauvage, id: 'aventus', title: 'Aventus' };
    expect(
      findShortage([
        line(10, 1),
        { listing: other, sizeMl: 10, price: 1, quantity: 1 },
      ])
    ).toBeNull();
  });
});

describe('cartTotal', () => {
  it('charges each size its own price times quantity', () => {
    expect(
      cartTotal([
        { price: 8000, quantity: 2 },
        { price: 32000, quantity: 1 },
      ])
    ).toBe(48000);
  });

  it('is 0 for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });
});
