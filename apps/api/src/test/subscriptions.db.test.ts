// The monthly subscription flow against a real Postgres: invoices, paying,
// picking boxes and confirming them. See src/test/db.ts for how to run it.
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

vi.mock('../lib/email', () => ({ sendEmail: vi.fn(async () => undefined) }));

const SCHEMA = 'test_subscriptions';
const MONTH = '2026-12';

let db: Client;
let prisma: typeof import('../lib/prisma').prisma;
let service: typeof import('../modules/subscriptions/service');

beforeAll(async () => {
  db = await connectToFreshSchema(SCHEMA);
  await applyMigrations(db);
  process.env.DATABASE_URL = schemaUrl(SCHEMA);
  ({ prisma } = await import('../lib/prisma'));
  service = await import('../modules/subscriptions/service');
});

afterAll(async () => {
  await prisma?.$disconnect();
  await db?.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await db?.end();
});

beforeEach(async () => {
  await db.query(
    `TRUNCATE "Order", "BoxItem", "Box", "SubscriptionInvoice",
       "Subscription", "ListingSize", "Listing", "User" CASCADE`
  );
});

const listing = (
  id: string,
  tier: 'arabian' | 'designer' | 'niche',
  scentFor: 'masculine' | 'feminine' | 'unisex',
  volumeMl = 100
) =>
  prisma.listing.create({
    data: {
      id,
      title: id,
      picture: 'p.jpg',
      bottleMl: 100,
      volumeMl,
      tier,
      scentFor,
    },
  });

// An active subscriber, with this month paid unless said otherwise
const subscriber = async (id: string, forWhom: 'him' | 'her', paid = true) => {
  await prisma.user.create({
    data: { id, name: id, email: `${id}@example.com`, password: 'x' },
  });
  const s = await prisma.subscription.create({
    data: {
      id: `sub-${id}`,
      userId: id,
      plan: 'base',
      forWhom,
      status: 'active',
      deliveryPhone: '99112233',
      deliveryAddress: 'Khan-Uul, building 12, apt 34',
    },
  });
  if (paid)
    await prisma.subscriptionInvoice.create({
      data: {
        subscriptionId: s.id,
        month: MONTH,
        amount: 99000,
        status: 'paid',
        paidAt: new Date(),
      },
    });
  return s;
};

const boxOf = (subscriptionId: string) =>
  prisma.box.findUniqueOrThrow({
    where: { subscriptionId_month: { subscriptionId, month: MONTH } },
    include: { items: true },
  });

describe('subscription months on a real database', () => {
  it('invoices active subscribers once, however often it runs', async () => {
    await subscriber('bat', 'him', false);
    expect(await service.createMonthInvoices(MONTH)).toBe(1);
    expect(await service.createMonthInvoices(MONTH)).toBe(0);
    expect(await prisma.subscriptionInvoice.count()).toBe(1);
  });

  it('counts a payment once and starts a pending subscription', async () => {
    const s = await subscriber('bat', 'him', false);
    await prisma.subscription.update({
      where: { id: s.id },
      data: { status: 'pending' },
    });
    const invoice = await prisma.subscriptionInvoice.create({
      data: { subscriptionId: s.id, month: MONTH, amount: 99000 },
    });

    const results = await Promise.all([
      service.settleInvoice(invoice.id),
      service.settleInvoice(invoice.id),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { id: s.id } }))
        .status
    ).toBe('active');
  });

  it('picks a box only for paid subscribers, with scents that suit them', async () => {
    await listing('sauvage', 'designer', 'masculine');
    await listing('libre', 'designer', 'feminine');
    await listing('khamrah', 'arabian', 'unisex');
    const him = await subscriber('bat', 'him');
    await subscriber('saraa', 'her', false);

    expect(await service.proposeBoxes(MONTH)).toBe(1);
    expect(await service.proposeBoxes(MONTH)).toBe(0);

    const box = await boxOf(him.id);
    expect(box.items.map((i) => i.listingId).sort()).toEqual([
      'khamrah',
      'sauvage',
    ]);
    expect(await prisma.box.count()).toBe(1);
  });

  it('keeps ml claimed by unconfirmed boxes for them', async () => {
    // 7ml is enough for one 5ml decant, not two
    await listing('sauvage', 'designer', 'unisex', 7);
    await listing('khamrah', 'arabian', 'unisex');
    const first = await subscriber('bat', 'him');
    await service.proposeBoxes(MONTH);
    const late = await subscriber('saraa', 'her');
    await service.proposeBoxes(MONTH);

    expect((await boxOf(first.id)).items.map((i) => i.listingId)).toContain(
      'sauvage'
    );
    const lateDesigner = (await boxOf(late.id)).items.find(
      (i) => i.tier === 'designer'
    );
    expect(lateDesigner?.listingId).toBeNull();
  });

  it('confirming takes the ml once and creates orders at the box price', async () => {
    await listing('sauvage', 'designer', 'masculine');
    await listing('khamrah', 'arabian', 'unisex');
    const s = await subscriber('bat', 'him');
    await service.proposeBoxes(MONTH);
    const box = await boxOf(s.id);

    const results = await Promise.allSettled([
      service.confirmBox(box.id),
      service.confirmBox(box.id),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

    const orders = await prisma.order.findMany({ where: { boxId: box.id } });
    expect(orders).toHaveLength(2);
    expect(orders.every((o) => Number(o.price) === 49500)).toBe(true);
    const left = await prisma.listing.findMany({ orderBy: { id: 'asc' } });
    expect(left.map((l) => l.volumeMl)).toEqual([95, 95]);
  });

  it('will not confirm a box with an empty slot', async () => {
    await listing('khamrah', 'arabian', 'unisex');
    const s = await subscriber('bat', 'him');
    await service.proposeBoxes(MONTH);
    const box = await boxOf(s.id);

    await expect(service.confirmBox(box.id)).rejects.toThrow(/every slot/);
    expect((await boxOf(s.id)).status).toBe('proposed');
  });

  it('never repeats a scent from an earlier month', async () => {
    await listing('sauvage', 'designer', 'masculine');
    await listing('homme', 'designer', 'masculine');
    await listing('khamrah', 'arabian', 'unisex');
    await listing('asad', 'arabian', 'masculine');
    const s = await subscriber('bat', 'him');
    await prisma.box.create({
      data: {
        subscriptionId: s.id,
        month: '2026-11',
        status: 'confirmed',
        items: {
          create: [
            { tier: 'designer', sizeMl: 5, listingId: 'sauvage' },
            { tier: 'arabian', sizeMl: 5, listingId: 'khamrah' },
          ],
        },
      },
    });

    await service.proposeBoxes(MONTH);

    expect((await boxOf(s.id)).items.map((i) => i.listingId).sort()).toEqual([
      'asad',
      'homme',
    ]);
  });
});
