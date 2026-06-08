import { prisma } from '../../../lib/prisma';
import { GraphQLError } from 'graphql';
import { requireAdmin, requireAuth } from '../../guards';
import type { GraphQLContext } from '../../context';

export const queries = {
  users: async (_: any, __: any, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  },

  user: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    if (caller.id !== args.id && caller.role !== 'Admin')
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    const user = await prisma.user.findUnique({ where: { id: args.id } });
    if (!user) throw new GraphQLError('User not found');
    return user;
  },

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

  orders: async (_: any, __: any, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  },

  adminStats: async (_: any, __: any, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const [listings, orders] = await Promise.all([
      prisma.listing.findMany({ select: { status: true, stock: true, price: true } }),
      prisma.order.findMany({
        select: { status: true, listing: { select: { price: true } } },
      }),
    ]);

    const inStock = listings.filter(l => l.status === 'in_stock').length;
    const outOfStock = listings.filter(l => l.status === 'out_of_order').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.listing.price), 0);

    return {
      totalListings: listings.length,
      inStock,
      outOfStock,
      totalOrders: orders.length,
      pending,
      completed,
      cancelled,
      totalRevenue,
    };
  },

  order: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    if (!args.id) throw new GraphQLError('Invalid order ID');
    const order = await prisma.order.findUnique({ where: { id: args.id } });
    if (!order) throw new GraphQLError('Order not found');
    if (caller.id !== order.userId && caller.role !== 'Admin')
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    return order;
  },

  checkOrder: async (_: any, args: { userId: string; listingId: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    const { userId, listingId } = args;
    if (!userId || !listingId) throw new GraphQLError('Invalid userId or listingId');
    if (caller.id !== userId && caller.role !== 'Admin')
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    return prisma.order.findFirst({ where: { userId, listingId } });
  },
};
