import { prisma } from '../../../../../lib/prisma';
import { GraphQLError } from 'graphql';
import { requireAdmin, requireAuth } from '../../guards';
import type { GraphQLContext } from '../../context';

export const userQueries = {
  // ── Users (admin only) ───────────────────────────────────────────────────
  users: async (_: any, __: any, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  },

  user: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);

    // Users can only fetch themselves; admins can fetch anyone
    if (caller.id !== args.id && caller.role !== 'Admin') {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    }

    const user = await prisma.user.findUnique({ where: { id: args.id } });
    if (!user) throw new GraphQLError('User not found');
    return user;
  },

  // ── Listings (public) ────────────────────────────────────────────────────
  listings: async () => {
    const data = await prisma.listing.findMany({ orderBy: { createdAt: 'desc' } });
    return { data };
  },

  listing: async (_: any, args: { id: string }) => {
    if (!args.id) throw new GraphQLError('Invalid listing ID');
    const listing = await prisma.listing.findUnique({ where: { id: args.id } });
    if (!listing) throw new GraphQLError('Listing not found');
    return listing;
  },

  // ── Orders (auth required) ───────────────────────────────────────────────
  orders: async (_: any, __: any, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  },

  order: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    if (!args.id) throw new GraphQLError('Invalid order ID');

    const order = await prisma.order.findUnique({ where: { id: args.id } });
    if (!order) throw new GraphQLError('Order not found');

    if (caller.id !== order.userId && caller.role !== 'Admin') {
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    }

    return order;
  },

  checkOrder: async (_: any, args: { userId: string; listingId: string }, ctx: GraphQLContext) => {
    requireAuth(ctx);
    const { userId, listingId } = args;
    if (!userId || !listingId) throw new GraphQLError('Invalid userId or listingId');
    return prisma.order.findFirst({ where: { userId, listingId } });
  },
};
