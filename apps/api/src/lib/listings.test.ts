import { describe, expect, it } from 'vitest';
import {
  statusForVolume,
  validateBottlePrice,
  validateVolume,
} from './listings';

describe('statusForVolume', () => {
  it('is in stock while a 5ml box decant still fits', () => {
    expect(statusForVolume(5)).toBe('in_stock');
    expect(statusForVolume(4)).toBe('out_of_order');
    expect(statusForVolume(0)).toBe('out_of_order');
  });
});

describe('validateVolume', () => {
  it('accepts ml left between 0 and the bottle size', () => {
    expect(validateVolume(100, 100)).toBeNull();
    expect(validateVolume(100, 0)).toBeNull();
  });

  it('rejects impossible amounts', () => {
    expect(validateVolume(0, 0)).toMatch(/Bottle size/);
    expect(validateVolume(100, -1)).toMatch(/negative/);
    expect(validateVolume(100, 101)).toMatch(/more than/);
    expect(validateVolume(100, 2.5)).toMatch(/negative|whole/);
  });
});

describe('validateBottlePrice', () => {
  it('allows no price, which means the bottle is not sold', () => {
    expect(validateBottlePrice(null)).toBeNull();
    expect(validateBottlePrice(undefined)).toBeNull();
  });

  it('needs a positive price otherwise', () => {
    expect(validateBottlePrice(450000)).toBeNull();
    expect(validateBottlePrice(0)).toMatch(/above 0/);
    expect(validateBottlePrice(-5)).toMatch(/above 0/);
  });
});
