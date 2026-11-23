import { z } from 'zod';

// Input rules for everything users and admins send us. Each schema both
// checks and cleans (trims) the data, so handlers use the parsed result.

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(2, { error: 'Name must be at least 2 characters' })
  .max(100, { error: 'Name is too long' });
const email = z
  .email({ error: 'Invalid email address' })
  .max(254, { error: 'Email is too long' });
const password = z
  .string({ error: 'Password is required' })
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(128, { error: 'Password is too long' });

export const registerSchema = z.object({ name, email, password });

export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).min(1, {
    error: 'Email and password are required',
  }),
  password: z.string({ error: 'Password is required' }).min(1, {
    error: 'Email and password are required',
  }),
});

export const userUpdateSchema = z
  .object({ name, email, password })
  .partial()
  .refine((u) => Object.values(u).some((v) => v !== undefined), {
    error: 'No fields to update',
  });

export const MAX_UNITS_PER_ORDER = 50;

// Where to deliver an order. Phone numbers are Mongolian: 8 digits, written
// with or without +976, spaces or dashes, and stored as just the 8 digits.
export const deliverySchema = z.object(
  {
    phone: z
      .string({ error: 'Phone number is required' })
      .transform((p) => p.replace(/[\s\-()]/g, '').replace(/^\+?976/, ''))
      .pipe(
        z.string().regex(/^\d{8}$/, { error: 'Enter an 8-digit phone number' })
      ),
    address: z
      .string({ error: 'Delivery address is required' })
      .trim()
      .min(10, { error: 'Enter the full delivery address' })
      .max(500, { error: 'Delivery address is too long' }),
    note: z
      .string()
      .trim()
      .max(300, { error: 'Delivery note is too long' })
      .optional()
      .transform((n) => n || undefined),
  },
  { error: 'Delivery details are required' }
);

// Checkout: one "listingId:sizeMl" per decant, repeated for quantity, and
// where to deliver them
export const createPaymentSchema = z.object({
  units: z
    .array(z.string().regex(/^.+:\d+$/), { error: 'No items provided' })
    .min(1, { error: 'No items provided' })
    .max(MAX_UNITS_PER_ORDER, {
      error: `You can order at most ${MAX_UNITS_PER_ORDER} items at once`,
    }),
  delivery: deliverySchema,
});

// The descriptive fields of a listing (ml and prices are checked in decants)
export const listingDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'Title is required' })
    .max(200, { error: 'Title is too long' }),
  picture: z.url({ error: 'Picture must be a URL' }),
  vibe: z
    .array(z.string().trim().min(1).max(40))
    .max(20, { error: 'At most 20 notes' }),
});

// Runs a schema and returns the cleaned data, or the first error message.
// Check `ok` to narrow: if (!body.ok) return …body.error; then use body.data.
export const validate = <T>(
  schema: z.ZodType<T>,
  input: unknown
):
  | { ok: true; data: T; error?: undefined }
  | { ok: false; data?: undefined; error: string } => {
  const result = schema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        error: result.error.issues[0]?.message ?? 'Invalid input',
      };
};

export const validateRegistration = (input: unknown): string | null =>
  validate(registerSchema, input).error ?? null;

export const validateUserUpdate = (input: unknown): string | null =>
  validate(userUpdateSchema, input).error ?? null;
