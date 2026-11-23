// Fulfils payments against a real Postgres, including several requests for
// the same payment or the same last ml at once, the way the frontend poll and
// the QPay callback can arrive together. See src/test/db.ts for how to run it.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { applyMigrations, connectToFreshSchema, schemaUrl } from './db';

const SCHEMA = 'test_fulfill';

let db: Client;
// Loaded after DATABASE_URL points at the test schema
let prisma: typeof import('../lib/prisma').prisma;
let fulfillPayment: typeof import('../modules/payments/fulfill').fulfillPayment;

beforeAll(async () => {
  db = await connectToFreshSchema(SCHEMA);
  await applyMigrations(db);
  process.env.DATABASE_URL = schemaUrl(SCHEMA);
  ({ prisma } = await import('../lib/prisma'));
  ({ fulfillPayment } = await import('../modules/payments/fulfill'));
});

afterAll(async () => {
  await prisma?.$disconnect();
  await db?.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await db?.end();
});

beforeEach(async () => {
  await db.query(
    'TRUNCATE "Order", "Payment", "ListingSize", "Listing", "User" CASCADE'
  );
  await prisma.user.create({
    data: { id: 'buyer', name: 'Buyer', email: 'b@example.com', password: 'x' },
  });
});

// A bottle with the given ml left, selling 2, 5 and 10ml decants
const bottle = (id: string, volumeMl: number) =>
  prisma.listing.create({
    data: {
      id,
      title: id,
      picture: 'p.jpg',
      bottleMl: 100,
      volumeMl,
      sizes: {
        create: [
          { sizeMl: 2, price: 8000 },
          { sizeMl: 5, price: 18000 },
          { sizeMl: 10, price: 32000 },
        ],
      },
    },
  });

const payment = (
  id: string,
  units: string[],
  status: 'pending' | 'cancelled' | 'paid' | 'failed' = 'pending'
) =>
  prisma.payment.create({
    data: { id, userId: 'buyer', amount: 0, listingIds: units, status },
  });

const listingState = (id: string) =>
  prisma.listing.findUniqueOrThrow({
    where: { id },
    select: { volumeMl: true, status: true },
  });

const paymentStatus = async (id: string) =>
  (await prisma.payment.findUniqueOrThrow({ where: { id } })).status;

describe('fulfillPayment on a real database', () => {
  it('creates one order per decant and takes their ml from the bottle', async () => {
    await bottle('sauvage', 100);
    const p = await payment('p1', ['sauvage:5', 'sauvage:5', 'sauvage:10']);

    expect(await fulfillPayment(p)).toBe(true);

    expect(await listingState('sauvage')).toEqual({
      volumeMl: 80,
      status: 'in_stock',
    });
    const orders = await prisma.order.findMany({ orderBy: { sizeMl: 'asc' } });
    expect(orders.map((o) => [o.sizeMl, Number(o.price)])).toEqual([
      [5, 18000],
      [5, 18000],
      [10, 32000],
    ]);
    expect(await paymentStatus('p1')).toBe('paid');
  });

  it('fulfils a payment once when several requests settle it at the same time', async () => {
    await bottle('sauvage', 100);
    const p = await payment('p1', ['sauvage:5', 'sauvage:5', 'sauvage:10']);

    const results = await Promise.all(
      Array.from({ length: 6 }, () => fulfillPayment(p))
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await prisma.order.count()).toBe(3);
    expect((await listingState('sauvage')).volumeMl).toBe(80);
  });

  it('lets only one of two payments have the last ml of a bottle', async () => {
    await bottle('sauvage', 10);
    const a = await payment('a', ['sauvage:10']);
    const b = await payment('b', ['sauvage:5', 'sauvage:5']);

    const results = await Promise.allSettled([
      fulfillPayment(a),
      fulfillPayment(b),
    ]);

    const won = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    );
    const lost = results.filter((r) => r.status === 'rejected');
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);

    expect(await listingState('sauvage')).toEqual({
      volumeMl: 0,
      status: 'out_of_order',
    });
    // The loser's transaction rolled back: no orders and still unsettled, so
    // the controller can mark it failed and alert the admin for a refund.
    const winner = results[0] === won[0] ? 'a' : 'b';
    const loser = winner === 'a' ? 'b' : 'a';
    expect(await paymentStatus(loser)).toBe('pending');
    expect(await prisma.order.count()).toBe(winner === 'a' ? 1 : 2);
  });

  it('rolls back the whole payment when one decant no longer fits', async () => {
    await bottle('sauvage', 100);
    await bottle('aventus', 4);
    const p = await payment('p1', ['sauvage:10', 'aventus:5']);

    await expect(fulfillPayment(p)).rejects.toThrow(/less than 5ml/);

    expect((await listingState('sauvage')).volumeMl).toBe(100);
    expect(await prisma.order.count()).toBe(0);
    expect(await paymentStatus('p1')).toBe('pending');
  });

  it('marks a bottle out of stock once less than 2ml is left', async () => {
    await bottle('sauvage', 6);
    const p = await payment('p1', ['sauvage:5']);

    await fulfillPayment(p);

    expect(await listingState('sauvage')).toEqual({
      volumeMl: 1,
      status: 'out_of_order',
    });
  });

  it('still fulfils a payment whose QR was closed, but not a settled one', async () => {
    await bottle('sauvage', 100);
    const closed = await payment('closed', ['sauvage:2'], 'cancelled');
    const paid = await payment('paid', ['sauvage:2'], 'paid');
    const failed = await payment('failed', ['sauvage:2'], 'failed');

    expect(await fulfillPayment(closed)).toBe(true);
    expect(await fulfillPayment(paid)).toBe(false);
    expect(await fulfillPayment(failed)).toBe(false);
    expect(await prisma.order.count()).toBe(1);
  });
});
