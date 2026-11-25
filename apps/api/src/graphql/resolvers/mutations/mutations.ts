import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { requireAdmin, requireAuth } from '../../guards';
import type { GraphQLContext } from '../../context';
import { config } from '../../../config';
import {
  listingDetailsSchema,
  validate,
  validateUserUpdate,
} from '../../../lib/validation';
import {
  statusForVolume,
  validateBottlePrice,
  validateVolume,
} from '../../../lib/listings';

interface UserFields {
  name: string;
  email: string;
  password: string;
}

// Why a pending-only order update matched nothing
const settledError = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  return new GraphQLError(
    order ? `Order is already ${order.status}` : 'Order not found'
  );
};

interface CreateListingInput {
  title: string;
  vibe: string[];
  picture: string;
  bottleMl: number;
  volumeMl?: number | null;
  bottlePrice?: number | null;
  tier?: 'arabian' | 'designer' | 'niche' | null;
  scentFor?: 'masculine' | 'feminine' | 'unisex' | null;
}

interface UpdateListingInput {
  title?: string;
  vibe?: string[];
  picture?: string;
  bottleMl?: number;
  volumeMl?: number | null;
  status?: 'in_stock' | 'out_of_order';
  bottlePrice?: number | null;
  tier?: 'arabian' | 'designer' | 'niche' | null;
  scentFor?: 'masculine' | 'feminine' | 'unisex' | null;
}

// Sign-up is REST only (POST /api/auth/register), which has the strict
// auth rate limit. There is intentionally no GraphQL mutation to create users.
export const mutations = {
  updateUser: async (
    _: any,
    args: { id: string; input: Partial<UserFields> },
    ctx: GraphQLContext
  ) => {
    const caller = requireAuth(ctx);
    if (caller.id !== args.id && caller.role !== 'Admin')
      throw new GraphQLError('Forbidden', {
        extensions: { code: 'FORBIDDEN' },
      });
    const validationError = validateUserUpdate(args.input);
    if (validationError) throw new GraphQLError(validationError);
    const user = await prisma.user.findUnique({ where: { id: args.id } });
    if (!user) throw new GraphQLError('User not found');
    const data: Partial<UserFields> = { ...args.input };
    if (args.input.name) data.name = args.input.name.trim();
    if (args.input.password)
      data.password = await bcrypt.hash(
        args.input.password,
        config.auth.bcryptRounds
      );
    return prisma.user.update({ where: { id: args.id }, data });
  },

  deleteUser: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const user = await prisma.user.findUnique({ where: { id: args.id } });
    if (!user) throw new GraphQLError('User not found');
    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId: args.id } }),
      prisma.preorder.deleteMany({ where: { userId: args.id } }),
      prisma.subscription.deleteMany({ where: { userId: args.id } }),
      prisma.user.delete({ where: { id: args.id } }),
    ]);
    return true;
  },

  // Orders are the decants sent in subscription boxes, created when the admin
  // confirms a box. Only an admin settles them.

  completeOrder: async (
    _: any,
    args: { orderId: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const done = await prisma.order.updateMany({
      where: { id: args.orderId, status: 'pending' },
      data: { status: 'completed', completedAt: new Date() },
    });
    if (done.count === 0) throw await settledError(args.orderId);
    return prisma.order.findUnique({ where: { id: args.orderId } });
  },

  cancelOrder: async (
    _: any,
    args: { orderId: string },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    return prisma.$transaction(async (tx) => {
      // Only a pending order can be cancelled. Doing it as a conditional
      // update means two admins clicking at once can't return the ml twice.
      const cancelled = await tx.order.updateMany({
        where: { id: args.orderId, status: 'pending' },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      if (cancelled.count === 0) throw await settledError(args.orderId);

      // Put the decant's ml back in the bottle
      const order = await tx.order.findUniqueOrThrow({
        where: { id: args.orderId },
      });
      const listing = await tx.listing.update({
        where: { id: order.listingId },
        data: { volumeMl: { increment: order.sizeMl } },
      });
      await tx.listing.update({
        where: { id: order.listingId },
        data: { status: statusForVolume(listing.volumeMl) },
      });
      return order;
    });
  },

  createListing: async (
    _: any,
    args: { input: CreateListingInput },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const { bottlePrice, volumeMl, bottleMl, tier, scentFor, ...rest } =
      args.input;
    const details = validate(listingDetailsSchema, rest);
    const ml = volumeMl ?? bottleMl;
    const error =
      details.error ??
      validateVolume(bottleMl, ml) ??
      validateBottlePrice(bottlePrice);
    if (error || !details.data) throw new GraphQLError(error ?? 'Invalid');
    return prisma.listing.create({
      data: {
        ...details.data,
        bottleMl,
        volumeMl: ml,
        tier: tier ?? undefined,
        scentFor: scentFor ?? undefined,
        bottlePrice: bottlePrice ?? null,
        status: statusForVolume(ml),
      },
    });
  },

  updateListing: async (
    _: any,
    args: { id: string; input: UpdateListingInput },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const listing = await prisma.listing.findUnique({ where: { id: args.id } });
    if (!listing) throw new GraphQLError('Listing not found');

    const { bottlePrice, title, picture, vibe, tier, scentFor, ...input } =
      args.input;
    // Only the fields that were sent; GraphQL passes omitted ones as null
    const details = validate(
      listingDetailsSchema.partial(),
      Object.fromEntries(
        Object.entries({ title, picture, vibe }).filter(([, v]) => v != null)
      )
    );
    const bottleMl = input.bottleMl ?? listing.bottleMl;
    const volumeMl = input.volumeMl ?? listing.volumeMl;
    const error =
      details.error ??
      validateVolume(bottleMl, volumeMl) ??
      validateBottlePrice(bottlePrice);
    if (error) throw new GraphQLError(error);

    return prisma.listing.update({
      where: { id: args.id },
      data: {
        ...input,
        ...details.data,
        bottleMl,
        volumeMl,
        tier: tier ?? undefined,
        scentFor: scentFor ?? undefined,
        // Keep the sold-out flag in step with the ml left unless set explicitly
        status:
          input.status ??
          (input.volumeMl != null ? statusForVolume(volumeMl) : undefined),
        // Sent as null stops selling the bottle; left out keeps the price
        ...('bottlePrice' in args.input && { bottlePrice }),
      },
    });
  },

  deleteListing: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const listing = await prisma.listing.findUnique({ where: { id: args.id } });
    if (!listing) throw new GraphQLError('Listing not found');
    await prisma.listing.delete({ where: { id: args.id } });
    return true;
  },
};
