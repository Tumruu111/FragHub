import { describe, expect, it } from 'vitest';
import {
  canPayInvoice,
  firstBillingMonth,
  fitsSubscriber,
  monthAndDay,
  nextMonth,
  pickBoxes,
  type PickListing,
} from './subscriptions';

// Noon in Ulaanbaatar (UTC+8) on the given day
const ub = (date: string) => new Date(`${date}T12:00:00+08:00`);

describe('the monthly calendar', () => {
  it('uses Ulaanbaatar time, not UTC', () => {
    // 20:00 UTC on 30 Nov is already 1 Dec in Ulaanbaatar
    expect(monthAndDay(new Date('2026-11-30T20:00:00Z'))).toEqual({
      month: '2026-12',
      day: 1,
    });
  });

  it('rolls over the year', () => {
    expect(nextMonth('2026-12')).toBe('2027-01');
    expect(nextMonth('2026-09')).toBe('2026-10');
  });

  it('bills a new subscriber this month until the 20th, then next month', () => {
    expect(firstBillingMonth(ub('2026-12-20'))).toBe('2026-12');
    expect(firstBillingMonth(ub('2026-12-21'))).toBe('2027-01');
  });

  it('lets a month be paid until its 20th, and future months any time', () => {
    expect(canPayInvoice('2026-12', ub('2026-12-20'))).toBe(true);
    expect(canPayInvoice('2026-12', ub('2026-12-21'))).toBe(false);
    expect(canPayInvoice('2026-11', ub('2026-12-02'))).toBe(false);
    expect(canPayInvoice('2027-01', ub('2026-12-25'))).toBe(true);
  });
});

describe('fitsSubscriber', () => {
  it('matches masculine to him, feminine to her, and unisex to anyone', () => {
    expect(fitsSubscriber('him', 'masculine')).toBe(true);
    expect(fitsSubscriber('him', 'feminine')).toBe(false);
    expect(fitsSubscriber('her', 'feminine')).toBe(true);
    expect(fitsSubscriber('her', 'unisex')).toBe(true);
    expect(fitsSubscriber('either', 'feminine')).toBe(true);
  });
});

describe('pickBoxes', () => {
  const stock: PickListing[] = [
    { id: 'sauvage', tier: 'designer', scentFor: 'masculine', freeMl: 90 },
    { id: 'libre', tier: 'designer', scentFor: 'feminine', freeMl: 50 },
    { id: 'khamrah', tier: 'arabian', scentFor: 'unisex', freeMl: 100 },
    { id: 'yara', tier: 'arabian', scentFor: 'feminine', freeMl: 100 },
    { id: 'aventus', tier: 'niche', scentFor: 'masculine', freeMl: 88 },
  ];
  const base = { plan: 'base' as const, alreadySent: [] };

  it('gives a Base box one designer and one arabian decant', () => {
    const [box] = pickBoxes(
      [{ ...base, subscriptionId: 's1', forWhom: 'him' }],
      stock
    );
    expect(box.items).toEqual([
      { tier: 'designer', listingId: 'sauvage' },
      { tier: 'arabian', listingId: 'khamrah' },
    ]);
  });

  it('gives a Premium box one niche and one designer decant', () => {
    const [box] = pickBoxes(
      [{ ...base, plan: 'premium', subscriptionId: 's1', forWhom: 'him' }],
      stock
    );
    expect(box.items.map((i) => i.listingId)).toEqual(['aventus', 'sauvage']);
  });

  it('never sends a scent the subscriber has had before', () => {
    const [box] = pickBoxes(
      [
        {
          ...base,
          subscriptionId: 's1',
          forWhom: 'her',
          alreadySent: ['libre', 'yara'],
        },
      ],
      stock
    );
    expect(box.items).toEqual([
      { tier: 'designer', listingId: null },
      { tier: 'arabian', listingId: 'khamrah' },
    ]);
  });

  it('does not promise more ml than a bottle has across subscribers', () => {
    const lowStock: PickListing[] = [
      { id: 'sauvage', tier: 'designer', scentFor: 'unisex', freeMl: 7 },
      { id: 'khamrah', tier: 'arabian', scentFor: 'unisex', freeMl: 100 },
    ];
    const boxes = pickBoxes(
      ['s1', 's2'].map((id) => ({
        ...base,
        subscriptionId: id,
        forWhom: 'either' as const,
      })),
      lowStock
    );
    expect(boxes[0].items[0].listingId).toBe('sauvage');
    expect(boxes[1].items[0].listingId).toBeNull();
  });

  it('favours fuller bottles', () => {
    const two: PickListing[] = [
      { id: 'full', tier: 'arabian', scentFor: 'unisex', freeMl: 90 },
      { id: 'low', tier: 'arabian', scentFor: 'unisex', freeMl: 10 },
    ];
    const pick = (roll: number) =>
      pickBoxes(
        [{ ...base, subscriptionId: 's', forWhom: 'either' }],
        two,
        () => roll
      )[0].items[1].listingId;
    // 90 of the 100ml are in "full", so rolls below 0.9 pick it
    expect(pick(0.0)).toBe('full');
    expect(pick(0.89)).toBe('full');
    expect(pick(0.91)).toBe('low');
  });
});
