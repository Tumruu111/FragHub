import { describe, expect, it } from 'vitest';
import {
  availableUnits,
  parseUnit,
  statusForVolume,
  unitKey,
  validateSizePrices,
  validateVolume,
} from './decants';

describe('availableUnits', () => {
  it('splits a full 100ml bottle into each size', () => {
    expect(availableUnits(100, 2)).toBe(50);
    expect(availableUnits(100, 5)).toBe(20);
    expect(availableUnits(100, 10)).toBe(10);
  });

  it('rounds down when a size does not fit evenly', () => {
    expect(availableUnits(12, 5)).toBe(2);
    expect(availableUnits(9, 10)).toBe(0);
  });
});

describe('statusForVolume', () => {
  it('is in stock while the smallest size still fits', () => {
    expect(statusForVolume(2)).toBe('in_stock');
    expect(statusForVolume(1)).toBe('out_of_order');
    expect(statusForVolume(0)).toBe('out_of_order');
  });
});

describe('validateSizePrices', () => {
  const all = [
    { sizeMl: 2, price: 8000 },
    { sizeMl: 5, price: 18000 },
    { sizeMl: 10, price: 32000 },
  ];

  it('accepts a price for every fixed size, in any order', () => {
    expect(validateSizePrices(all)).toBeNull();
    expect(validateSizePrices([...all].reverse())).toBeNull();
  });

  it('rejects a missing, extra or duplicated size', () => {
    expect(validateSizePrices(all.slice(1))).toMatch(/each size/);
    expect(validateSizePrices([...all, { sizeMl: 20, price: 1 }])).toMatch(
      /each size/
    );
    expect(validateSizePrices([all[0], all[0], all[2]])).toMatch(/each size/);
  });

  it('rejects a price of 0 or below', () => {
    expect(
      validateSizePrices([{ ...all[0], price: 0 }, all[1], all[2]])
    ).toMatch(/above 0/);
  });
});

describe('validateVolume', () => {
  it('accepts ml left between 0 and the bottle size', () => {
    expect(validateVolume(100, 100)).toBeNull();
    expect(validateVolume(100, 0)).toBeNull();
  });

  it('rejects impossible bottles', () => {
    expect(validateVolume(0, 0)).toMatch(/Bottle size/);
    expect(validateVolume(100, -1)).toMatch(/negative/);
    expect(validateVolume(100, 101)).toMatch(/more than the bottle/);
    expect(validateVolume(100, 2.5)).toMatch(/negative/);
  });
});

describe('unitKey / parseUnit', () => {
  it('round-trips a listing id and size', () => {
    expect(parseUnit(unitKey('abc-123', 5))).toEqual({
      listingId: 'abc-123',
      sizeMl: 5,
    });
  });

  it('rejects malformed units', () => {
    expect(parseUnit('abc')).toBeNull();
    expect(parseUnit('abc:')).toBeNull();
    expect(parseUnit(':5')).toBeNull();
    expect(parseUnit('abc:5ml')).toBeNull();
  });
});
