import { describe, expect, it } from 'vitest';
import {
  createPaymentSchema,
  listingDetailsSchema,
  loginSchema,
  MAX_UNITS_PER_ORDER,
  registerSchema,
  validate,
  validateUserUpdate,
} from './validation';

describe('registerSchema', () => {
  it('accepts a valid sign-up and trims the name', () => {
    expect(
      validate(registerSchema, {
        name: '  Bat  ',
        email: 'bat@example.com',
        password: 'longenough',
      }).data
    ).toEqual({
      name: 'Bat',
      email: 'bat@example.com',
      password: 'longenough',
    });
  });

  it('gives a readable first error', () => {
    const base = {
      name: 'Bat',
      email: 'bat@example.com',
      password: '12345678',
    };
    expect(validate(registerSchema, { ...base, name: ' B ' }).error).toBe(
      'Name must be at least 2 characters'
    );
    expect(validate(registerSchema, { ...base, email: 'nope' }).error).toBe(
      'Invalid email address'
    );
    expect(validate(registerSchema, { ...base, password: 'short' }).error).toBe(
      'Password must be at least 8 characters'
    );
  });

  it('rejects non-string fields instead of passing them to the database', () => {
    expect(
      validate(registerSchema, {
        name: 'Bat',
        email: { $ne: '' },
        password: '12345678',
      }).error
    ).toBeDefined();
  });
});

describe('loginSchema', () => {
  it('requires both fields as strings', () => {
    expect(
      validate(loginSchema, { email: 'a@b.c', password: 'x' }).error
    ).toBeUndefined();
    expect(validate(loginSchema, { email: 'a@b.c' }).error).toBeDefined();
    expect(
      validate(loginSchema, { email: ['a'], password: 'x' }).error
    ).toBeDefined();
    expect(validate(loginSchema, undefined).error).toBeDefined();
  });
});

describe('validateUserUpdate', () => {
  it('needs at least one field', () => {
    expect(validateUserUpdate({})).toBe('No fields to update');
    expect(validateUserUpdate({ name: 'Saraa' })).toBeNull();
  });
});

describe('createPaymentSchema', () => {
  it('accepts listingId:sizeMl units', () => {
    expect(
      validate(createPaymentSchema, { units: ['a:5', 'a:5', 'b:10'] }).error
    ).toBeUndefined();
  });

  it('rejects an empty, malformed or oversized cart', () => {
    expect(validate(createPaymentSchema, { units: [] }).error).toBe(
      'No items provided'
    );
    expect(validate(createPaymentSchema, {}).error).toBe('No items provided');
    expect(
      validate(createPaymentSchema, { units: ['a:5ml'] }).error
    ).toBeDefined();
    const tooMany = Array.from(
      { length: MAX_UNITS_PER_ORDER + 1 },
      () => 'a:2'
    );
    expect(validate(createPaymentSchema, { units: tooMany }).error).toMatch(
      /at most/
    );
  });
});

describe('listingDetailsSchema', () => {
  const valid = {
    title: ' Dior Sauvage ',
    picture: 'https://example.com/sauvage.jpg',
    vibe: ['fresh', 'spicy'],
  };

  it('accepts and trims a listing', () => {
    expect(validate(listingDetailsSchema, valid).data?.title).toBe(
      'Dior Sauvage'
    );
  });

  it('rejects an empty title or a non-URL picture', () => {
    expect(
      validate(listingDetailsSchema, { ...valid, title: '  ' }).error
    ).toBe('Title is required');
    expect(
      validate(listingDetailsSchema, { ...valid, picture: 'sauvage.jpg' }).error
    ).toBe('Picture must be a URL');
  });

  it('allows updating just one field', () => {
    expect(
      validate(listingDetailsSchema.partial(), { title: 'New name' }).error
    ).toBeUndefined();
  });
});
