import { describe, expect, it } from 'vitest';
import {
  createPreorderSchema,
  deliverySchema,
  listingDetailsSchema,
  loginSchema,
  registerSchema,
  validate,
  validateUserUpdate,
} from './validation';
import { MAX_BOTTLES_PER_ORDER } from './preorders';

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

describe('createPreorderSchema', () => {
  const delivery = {
    phone: '99112233',
    address: 'Khan-Uul, 15th khoroo, building 12, apt 34',
  };

  it('accepts bottles, repeated for quantity, with delivery details', () => {
    expect(
      validate(createPreorderSchema, {
        listingIds: ['a', 'a', 'b'],
        delivery,
      }).error
    ).toBeUndefined();
  });

  it('requires delivery details', () => {
    expect(validate(createPreorderSchema, { listingIds: ['a'] }).error).toBe(
      'Delivery details are required'
    );
  });

  it('rejects an empty, malformed or oversized order', () => {
    expect(
      validate(createPreorderSchema, { listingIds: [], delivery }).error
    ).toBe('No bottles chosen');
    expect(validate(createPreorderSchema, { delivery }).error).toBe(
      'No bottles chosen'
    );
    expect(
      validate(createPreorderSchema, { listingIds: [''], delivery }).error
    ).toBeDefined();
    const tooMany = Array.from(
      { length: MAX_BOTTLES_PER_ORDER + 1 },
      () => 'a'
    );
    expect(
      validate(createPreorderSchema, { listingIds: tooMany, delivery }).error
    ).toMatch(/at most/);
  });
});

describe('deliverySchema', () => {
  const address = 'Khan-Uul, 15th khoroo, building 12, apt 34';

  it('stores a phone number as its 8 digits', () => {
    for (const phone of ['99112233', '9911 2233', '9911-2233', '+976 99112233'])
      expect(validate(deliverySchema, { phone, address }).data?.phone).toBe(
        '99112233'
      );
  });

  it('rejects phone numbers that are not 8 digits', () => {
    for (const phone of ['9911223', '991122334', 'call me', ''])
      expect(validate(deliverySchema, { phone, address }).error).toBe(
        'Enter an 8-digit phone number'
      );
  });

  it('trims the address and needs enough of it to find the place', () => {
    expect(
      validate(deliverySchema, { phone: '99112233', address: `  ${address} ` })
        .data?.address
    ).toBe(address);
    expect(
      validate(deliverySchema, { phone: '99112233', address: 'Zaisan' }).error
    ).toBe('Enter the full delivery address');
  });

  it('keeps a note only when there is one', () => {
    const base = { phone: '99112233', address };
    expect(validate(deliverySchema, base).data?.note).toBeUndefined();
    expect(
      validate(deliverySchema, { ...base, note: '   ' }).data?.note
    ).toBeUndefined();
    expect(
      validate(deliverySchema, { ...base, note: ' Call before ' }).data?.note
    ).toBe('Call before');
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
