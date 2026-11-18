import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { requireAdmin, requireAuth } from '../../guards';
import type { GraphQLContext } from '../../context';
import { config } from '../../../config';
import {
  validateRegistration,
  validateUserUpdate,
} from '../../../lib/validation';
import {
  SMALLEST_SIZE_ML,
  statusForVolume,
  validateSizePrices,
  validateVolume,
  type SizePrice,
} from '../../../lib/decants';

interface CreateUserInput {
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
  sizes: SizePrice[];
}

interface UpdateListingInput {
  title?: string;
  vibe?: string[];
  picture?: string;
  bottleMl?: number;
  volumeMl?: number | null;
  status?: 'in_stock' | 'out_of_order';
  sizes?: SizePrice[];
}

export const mutations = {
  createUser: async (_: any, args: { input: CreateUserInput }) => {
    const { name, email, password } = args.input;
    const validationError = validateRegistration({ name, email, password });
    if (validationError) throw new GraphQLError(validationError);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new GraphQLError('Email already in use');
    const hashed = await bcrypt.hash(password, config.auth.bcryptRounds);
    return prisma.user.create({
      data: { name: name.trim(), email, password: hashed },
    });
  },

  updateUser: async (
    _: any,
    args: { id: string; input: Partial<CreateUserInput> },
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
    const data: Partial<CreateUserInput> = { ...args.input };
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
    await prisma.order.deleteMany({ where: { userId: args.id } });
    await prisma.user.delete({ where: { id: args.id } });
    return true;
  },

  // Orders are only created by the QPay flow (modules/payments), after the
  // payment is confirmed. There is intentionally no mutation to place one.

  // Orders are paid for, so only an admin settles them. Customers ask to
  // cancel by contacting the shop, and the admin refunds them in QPay.

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
      await tx.listing.update({
        where: { id: order.listingId },
        data: { volumeMl: { increment: order.sizeMl } },
      });
      await tx.listing.updateMany({
        where: { id: order.listingId, volumeMl: { gte: SMALLEST_SIZE_ML } },
        data: { status: 'in_stock' },
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
    const { sizes, volumeMl, ...rest } = args.input;
    const ml = volumeMl ?? rest.bottleMl;
    const error =
      validateVolume(rest.bottleMl, ml) ?? validateSizePrices(sizes);
    if (error) throw new GraphQLError(error);
    return prisma.listing.create({
      data: {
        ...rest,
        volumeMl: ml,
        status: statusForVolume(ml),
        sizes: { create: sizes },
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

    const { sizes, ...input } = args.input;
    const bottleMl = input.bottleMl ?? listing.bottleMl;
    const volumeMl = input.volumeMl ?? listing.volumeMl;
    const error =
      validateVolume(bottleMl, volumeMl) ??
      (sizes ? validateSizePrices(sizes) : null);
    if (error) throw new GraphQLError(error);

    return prisma.listing.update({
      where: { id: args.id },
      data: {
        ...input,
        bottleMl,
        volumeMl,
        // Keep the sold-out flag in step with the ml left unless set explicitly
        status:
          input.status ??
          (input.volumeMl != null ? statusForVolume(volumeMl) : undefined),
        ...(sizes && { sizes: { deleteMany: {}, create: sizes } }),
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
