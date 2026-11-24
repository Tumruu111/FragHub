import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import { requireAdmin, requireAuth } from '../guards';
import type { GraphQLContext } from '../context';
import {
  PLANS,
  canPayInvoice,
  monthAndDay,
  type Plan,
} from '../../lib/subscriptions';
import {
  confirmBox,
  createMonthInvoices,
  proposeBoxes,
  swapBoxItem,
} from '../../modules/subscriptions/service';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const checkMonth = (month: string) => {
  if (!MONTH.test(month))
    throw new GraphQLError('Month must look like 2026-12');
  return month;
};

// Service errors are written for the admin to read
const asGraphQLError = async <T>(run: () => Promise<T>) => {
  try {
    return await run();
  } catch (err) {
    throw new GraphQLError(err instanceof Error ? err.message : String(err));
  }
};

const boxWithItems = (id: string) =>
  prisma.box.findUniqueOrThrow({ where: { id } });

export const subscriptionQueries = {
  subscriptionPlans: () =>
    (Object.keys(PLANS) as Plan[]).map((plan) => ({ plan, ...PLANS[plan] })),

  mySubscription: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    return prisma.subscription.findUnique({ where: { userId: caller.id } });
  },

  adminSubscriptions: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
  },

  adminSubscriptionMonth: async (
    _: unknown,
    args: { month?: string | null },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const now = monthAndDay(new Date());
    const month = args.month ? checkMonth(args.month) : now.month;
    const [invoices, paid, boxes] = await Promise.all([
      prisma.subscriptionInvoice.count({ where: { month } }),
      prisma.subscriptionInvoice.count({ where: { month, status: 'paid' } }),
      prisma.box.findMany({ where: { month }, orderBy: { createdAt: 'asc' } }),
    ]);
    return {
      month,
      today: month === now.month ? now.day : null,
      invoices,
      paid,
      boxes,
    };
  },
};

export const subscriptionMutations = {
  cancelSubscription: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    const subscription = await prisma.subscription.findUnique({
      where: { userId: caller.id },
    });
    if (!subscription || subscription.status === 'cancelled')
      throw new GraphQLError('You have no subscription to cancel');
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
  },

  sendSubscriptionInvoices: (
    _: unknown,
    args: { month: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return createMonthInvoices(checkMonth(args.month));
  },

  proposeBoxes: (_: unknown, args: { month: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return proposeBoxes(checkMonth(args.month));
  },

  swapBoxItem: async (
    _: unknown,
    args: { itemId: string; listingId: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const boxId = await asGraphQLError(() =>
      swapBoxItem(args.itemId, args.listingId)
    );
    return boxWithItems(boxId);
  },

  confirmBox: async (
    _: unknown,
    args: { boxId: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    await asGraphQLError(() => confirmBox(args.boxId));
    return boxWithItems(args.boxId);
  },
};

// Field resolvers. Prisma batches the same-tick findUnique calls.
export const subscriptionTypes = {
  Subscription: {
    delivery: (s: {
      deliveryPhone: string;
      deliveryAddress: string;
      deliveryNote: string | null;
    }) => ({
      phone: s.deliveryPhone,
      address: s.deliveryAddress,
      note: s.deliveryNote,
    }),
    user: (s: { userId: string }) =>
      prisma.user.findUnique({ where: { id: s.userId } }),
    invoices: (s: { id: string }) =>
      prisma.subscriptionInvoice.findMany({
        where: { subscriptionId: s.id },
        orderBy: { month: 'desc' },
      }),
    boxes: (s: { id: string }) =>
      prisma.box.findMany({
        where: { subscriptionId: s.id },
        orderBy: { month: 'desc' },
      }),
  },
  SubscriptionInvoice: {
    amount: (i: { amount: unknown }) => Number(i.amount),
    paid: (i: { status: string }) => i.status === 'paid',
    canPay: (i: { status: string; month: string }) =>
      i.status !== 'paid' && canPayInvoice(i.month, new Date()),
  },
  Box: {
    items: (b: { id: string }) =>
      prisma.boxItem.findMany({
        where: { boxId: b.id },
        orderBy: { tier: 'asc' },
      }),
    subscription: (b: { subscriptionId: string }) =>
      prisma.subscription.findUnique({ where: { id: b.subscriptionId } }),
  },
  BoxItem: {
    listing: (i: { listingId: string | null }) =>
      i.listingId
        ? prisma.listing.findUnique({ where: { id: i.listingId } })
        : null,
  },
};
