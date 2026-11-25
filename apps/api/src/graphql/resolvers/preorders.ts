import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import { requireAdmin, requireAuth } from '../guards';
import type { GraphQLContext } from '../context';
import { balanceDueBy, isOverdue, type PaymentKind } from '../../lib/preorders';
import {
  PreorderError,
  cancelPreorder,
  cancelUnpaidPreorder,
  markArrived,
  markDelivered,
} from '../../modules/preorders/service';

// Service errors are written for the person who caused them to read
const run = async <T>(action: () => Promise<T>) => {
  try {
    return await action();
  } catch (err) {
    if (err instanceof PreorderError) throw new GraphQLError(err.message);
    throw err;
  }
};

interface PreorderRow {
  id: string;
  userId: string;
  status: string;
  total: unknown;
  deposit: unknown;
  arrivedAt: Date | null;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryNote: string | null;
}

// Which payment the customer should pay in each status that waits on them
const DUE: Record<string, PaymentKind | undefined> = {
  awaiting_deposit: 'deposit',
  arrived: 'balance',
};

const paymentsOf = (id: string) =>
  prisma.preorder
    .findUnique({ where: { id } })
    .payments({ orderBy: { createdAt: 'asc' } });

export const preorderQueries = {
  myPreorders: (_: unknown, __: unknown, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    return prisma.preorder.findMany({
      where: { userId: caller.id },
      orderBy: { createdAt: 'desc' },
    });
  },

  adminPreorders: (
    _: unknown,
    args: { includeUnpaid?: boolean | null },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return prisma.preorder.findMany({
      where: args.includeUnpaid
        ? undefined
        : { status: { not: 'awaiting_deposit' } },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export const preorderMutations = {
  cancelMyPreorder: (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    return run(() => cancelUnpaidPreorder(caller.id, args.id));
  },
  markPreorderArrived: (
    _: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return run(() => markArrived(args.id));
  },
  markPreorderDelivered: (
    _: unknown,
    args: { id: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return run(() => markDelivered(args.id));
  },
  cancelPreorder: (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return run(() => cancelPreorder(args.id));
  },
};

export const preorderTypes = {
  Preorder: {
    total: (p: PreorderRow) => Number(p.total),
    deposit: (p: PreorderRow) => Number(p.deposit),
    balance: (p: PreorderRow) => Number(p.total) - Number(p.deposit),
    items: (p: PreorderRow) =>
      prisma.preorder.findUnique({ where: { id: p.id } }).items(),
    payments: async (p: PreorderRow) => (await paymentsOf(p.id)) ?? [],
    due: async (p: PreorderRow) => {
      const kind = DUE[p.status];
      if (!kind) return null;
      const payments = (await paymentsOf(p.id)) ?? [];
      return (
        payments.find((x) => x.kind === kind && x.status !== 'paid') ?? null
      );
    },
    balanceDueBy: (p: PreorderRow) =>
      p.arrivedAt ? balanceDueBy(p.arrivedAt) : null,
    overdue: (p: PreorderRow) =>
      p.status === 'arrived' && isOverdue(p.arrivedAt, new Date()),
    delivery: (p: PreorderRow) => ({
      phone: p.deliveryPhone,
      address: p.deliveryAddress,
      note: p.deliveryNote,
    }),
    user: (p: PreorderRow) =>
      prisma.user.findUnique({ where: { id: p.userId } }),
  },
  PreorderItem: {
    price: (i: { price: unknown }) => Number(i.price),
    picture: async (i: { listingId: string | null }) =>
      i.listingId
        ? (await prisma.listing.findUnique({ where: { id: i.listingId } }))
            ?.picture ?? null
        : null,
  },
  PreorderPayment: {
    amount: (x: { amount: unknown }) => Number(x.amount),
    paid: (x: { status: string }) => x.status === 'paid',
  },
};
