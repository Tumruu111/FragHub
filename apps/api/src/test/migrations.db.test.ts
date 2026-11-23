// Runs every migration against a real Postgres, with listings and orders in
// the shape they had before the decant migration, then checks what it made of
// them. See src/test/db.ts for how to run it.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { applyMigrations, connectToFreshSchema } from './db';

const DECANT_MIGRATION = '20261113120000_decant_sizes';

// Listings as the old schema stored them: one size per listing, a price and a
// stock count of bottles
const OLD_LISTINGS = [
  { id: 'five', size: '5ml', price: 18000, stock: 4 },
  { id: 'two-empty', size: '2ml', price: 9000, stock: 0 },
  { id: 'ten-spaced', size: '10 ml', price: 30000, stock: 1 },
  { id: 'thirty', size: '30ml', price: 70000, stock: 2 },
  { id: 'travel', size: 'travel', price: 25000, stock: 3 },
];

let db: Client;

const listing = async (id: string) =>
  (
    await db.query(
      `SELECT "status", "bottleMl", "volumeMl" FROM "Listing" WHERE "id" = $1`,
      [id]
    )
  ).rows[0];

const sizes = async (id: string) =>
  (
    await db.query(
      `SELECT "sizeMl", "price"::float AS "price" FROM "ListingSize"
       WHERE "listingId" = $1 ORDER BY "sizeMl"`,
      [id]
    )
  ).rows;

const order = async (id: string) =>
  (
    await db.query(
      `SELECT "sizeMl", "price"::float AS "price" FROM "Order" WHERE "id" = $1`,
      [id]
    )
  ).rows[0];

beforeAll(async () => {
  db = await connectToFreshSchema('test_migrations');
  await applyMigrations(db, async (name) => {
    if (name !== DECANT_MIGRATION) return;
    await db.query(
      `INSERT INTO "User" ("id", "name", "email", "password", "updatedAt")
       VALUES ('buyer', 'Buyer', 'buyer@example.com', 'x', now())`
    );
    for (const l of OLD_LISTINGS)
      await db.query(
        `INSERT INTO "Listing"
           ("id", "title", "size", "vibe", "picture", "price", "stock", "updatedAt")
         VALUES ($1, $1, $2, '{}', 'p.jpg', $3, $4, now())`,
        [l.id, l.size, l.price, l.stock]
      );
    await db.query(
      `INSERT INTO "Order" ("id", "userId", "listingId", "updatedAt") VALUES
         ('order-five', 'buyer', 'five', now()),
         ('order-travel', 'buyer', 'travel', now())`
    );
  });
});

afterAll(async () => {
  await db?.query('DROP SCHEMA IF EXISTS "test_migrations" CASCADE');
  await db?.end();
});

describe('decant migration', () => {
  it('turns stock × size into ml left in the bottle', async () => {
    expect(await listing('five')).toEqual({
      status: 'in_stock',
      bottleMl: 20,
      volumeMl: 20,
    });
    expect(await listing('ten-spaced')).toMatchObject({ volumeMl: 10 });
    expect(await listing('thirty')).toMatchObject({ volumeMl: 60 });
  });

  it('keeps the old price as the price of a matching decant size', async () => {
    expect(await sizes('five')).toEqual([{ sizeMl: 5, price: 18000 }]);
    expect(await sizes('ten-spaced')).toEqual([{ sizeMl: 10, price: 30000 }]);
    expect(await sizes('two-empty')).toEqual([{ sizeMl: 2, price: 9000 }]);
  });

  it('sets no prices for sizes outside 2, 5 and 10ml', async () => {
    expect(await sizes('thirty')).toEqual([]);
    expect(await sizes('travel')).toEqual([]);
  });

  it('marks listings with less than 2ml left out of stock', async () => {
    expect(await listing('two-empty')).toMatchObject({
      status: 'out_of_order',
      volumeMl: 0,
    });
    expect(await listing('travel')).toEqual({
      status: 'out_of_order',
      bottleMl: 0,
      volumeMl: 0,
    });
  });

  it('records the size and price on existing orders', async () => {
    expect(await order('order-five')).toEqual({ sizeMl: 5, price: 18000 });
    expect(await order('order-travel')).toEqual({ sizeMl: 0, price: 25000 });
  });

  it('drops the old columns', async () => {
    const { rows } = await db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'test_migrations' AND table_name = 'Listing'`
    );
    const columns = rows.map((r) => r.column_name);
    expect(columns).not.toContain('size');
    expect(columns).not.toContain('stock');
    expect(columns).not.toContain('price');
  });
});
