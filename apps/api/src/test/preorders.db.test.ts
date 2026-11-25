// Full-bottle pre-orders against a real Postgres: placing one, paying the
// deposit, arrival, paying the rest, delivery and cancelling. See
// src/test/db.ts for how to run it.
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Client } from 'pg';
import { applyMigrations, connectToFreshSchema, schemaUrl } from './db';

const sendEmail = vi.fn(async (_: { to: string; subject: string }) => {
  /* not sent in tests */
});
vi.mock('../lib/email', () => ({ sendEmail }));

const SCHEMA = 'test_preorders';
const DELIVERY = {
  phone: '99112233',
  address: 'Khan-Uul, building 12, apt 34',
};

let db: Client;
let prisma: typeof import('../lib/prisma').prisma;
let service: typeof import('../modules/preorders/service');

beforeAll(async () => {
  db = await connectToFreshSchema(SCHEMA);
  await applyMigrations(db);
  process.env.DATABASE_URL = schemaUrl(SCHEMA);
  ({ prisma } = await import('../lib/prisma'));
  service = await import('../modules/preorders/service');
});

afterAll(async () => {
  await prisma?.$disconnect();
  await db?.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await db?.end();
});

beforeEach(async () => {
  sendEmail.mockClear();
  await db.query(
    `TRUNCATE "PreorderPayment", "PreorderItem", "Preorder", "Listing", "User" CASCADE`
  );
  await prisma.user.create({
    data: { id: 'bat', name: 'Bat', email: 'bat@example.com', password: 'x' },
  });
  await prisma.listing.createMany({
    data: [
      {
        id: 'aventus',
        title: 'Creed Aventus',
        picture: 'a.jpg',
        bottleMl: 100,
        bottlePrice: 1500000,
      },
      {
        id: 'asad',
        title: 'Lattafa Asad',
        picture: 'b.jpg',
        bottleMl: 100,
        bottlePrice: 150001,
      },
      // Used for boxes only, not sold as a bottle
      { id: 'sample', title: 'Sample', picture: 'c.jpg', bottleMl: 100 },
    ],
  });
});

const place = () =>
  service.createPreorder('bat', ['aventus', 'asad', 'asad'], DELIVERY);

const paymentOf = (preorderId: string, kind: 'deposit' | 'balance') =>
  prisma.preorderPayment.findUniqueOrThrow({
    where: { preorderId_kind: { preorderId, kind } },
  });

const statusOf = async (id: string) =>
  (await prisma.preorder.findUniqueOrThrow({ where: { id } })).status;

describe('placing a pre-order', () => {
  it('prices each bottle now and asks for half up front', async () => {
    const p = await place();
    expect(Number(p.total)).toBe(1800002);
    expect(Number(p.deposit)).toBe(900001);
    expect(p.items.map((i) => i.title).sort()).toEqual([
      'Creed Aventus',
      'Lattafa Asad',
      'Lattafa Asad',
    ]);
    expect(p.payments).toHaveLength(1);
    expect(p.payments[0]).toMatchObject({ kind: 'deposit', status: 'pending' });
    expect(Number(p.payments[0].amount)).toBe(900001);

    // A later price change doesn't touch what was agreed
    await prisma.listing.update({
      where: { id: 'aventus' },
      data: { bottlePrice: 1700000 },
    });
    const item = await prisma.preorderItem.findFirstOrThrow({
      where: { preorderId: p.id, listingId: 'aventus' },
    });
    expect(Number(item.price)).toBe(1500000);
  });

  it('refuses bottles that are not for sale', async () => {
    await expect(
      service.createPreorder('bat', ['sample'], DELIVERY)
    ).rejects.toThrow(/no longer be pre-ordered/);
    await expect(
      service.createPreorder('bat', ['gone'], DELIVERY)
    ).rejects.toThrow(/no longer be pre-ordered/);
    expect(await prisma.preorder.count()).toBe(0);
  });
});

describe('the pre-order steps', () => {
  it('counts the deposit once even when the callback and poll race', async () => {
    const p = await place();
    const deposit = await paymentOf(p.id, 'deposit');
    const results = await Promise.all([
      service.settlePreorderPayment(deposit.id),
      service.settlePreorderPayment(deposit.id),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await statusOf(p.id)).toBe('ordering');
  });

  it('goes deposit → ordering → arrived → paid → delivered', async () => {
    const p = await place();
    await service.settlePreorderPayment((await paymentOf(p.id, 'deposit')).id);
    expect(await statusOf(p.id)).toBe('ordering');

    // The rest can't be marked delivered before it is paid
    await expect(service.markDelivered(p.id)).rejects.toThrow(/fully paid/);

    await service.markArrived(p.id);
    expect(await statusOf(p.id)).toBe('arrived');
    const balance = await paymentOf(p.id, 'balance');
    expect(Number(balance.amount)).toBe(900001);
    // Marking it arrived twice doesn't ask for the rest twice
    await expect(service.markArrived(p.id)).rejects.toThrow(/deposit is paid/);

    await service.settlePreorderPayment(balance.id);
    expect(await statusOf(p.id)).toBe('paid');

    await service.markDelivered(p.id);
    expect(await statusOf(p.id)).toBe('delivered');
    await expect(service.cancelPreorder(p.id)).rejects.toThrow(/delivered/);
  });

  it('cannot be marked arrived before the deposit is paid', async () => {
    const p = await place();
    await expect(service.markArrived(p.id)).rejects.toThrow(/deposit is paid/);
    expect(await prisma.preorderPayment.count()).toBe(1);
  });

  it('alerts the admin when a cancelled pre-order is paid anyway', async () => {
    const p = await place();
    await service.cancelUnpaidPreorder('bat', p.id);
    expect(await statusOf(p.id)).toBe('cancelled');

    sendEmail.mockClear();
    await service.settlePreorderPayment((await paymentOf(p.id, 'deposit')).id);
    expect(await statusOf(p.id)).toBe('cancelled');
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/Refund needed/);
  });

  it('lets the customer cancel only before paying the deposit', async () => {
    const p = await place();
    await service.settlePreorderPayment((await paymentOf(p.id, 'deposit')).id);
    await expect(service.cancelUnpaidPreorder('bat', p.id)).rejects.toThrow(
      /Contact us/
    );
    // Someone else's pre-order can't be cancelled either
    const other = await place();
    await expect(
      service.cancelUnpaidPreorder('someone-else', other.id)
    ).rejects.toThrow();
    expect(await statusOf(other.id)).toBe('awaiting_deposit');
  });
});

describe('payableError', () => {
  it('only lets the payment that is due be paid', () => {
    expect(
      service.payableError('deposit', 'pending', 'awaiting_deposit')
    ).toBeNull();
    expect(service.payableError('balance', 'pending', 'arrived')).toBeNull();
    expect(service.payableError('balance', 'pending', 'ordering')).toMatch(
      /arrive/
    );
    expect(service.payableError('deposit', 'paid', 'ordering')).toMatch(
      /already paid/
    );
    expect(service.payableError('deposit', 'pending', 'cancelled')).toMatch(
      /cancelled/
    );
  });
});
