import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { requireAdmin, requireAuth } from '../../guards';
import type { GraphQLContext } from '../../context';
import { config } from '../../../config';

interface CreateUserInput { name: string; email: string; password: string; }

export const mutations = {
  createUser: async (_: any, args: { input: CreateUserInput }) => {
    const { name, email, password } = args.input;
    if (!name || !email || !password) throw new GraphQLError('All fields are required');
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new GraphQLError('Email already in use');
    const hashed = await bcrypt.hash(password, config.auth.bcryptRounds);
    return prisma.user.create({ data: { name, email, password: hashed } });
  },

  updateUser: async (_: any, args: { id: string; input: Partial<CreateUserInput> }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    if (caller.id !== args.id && caller.role !== 'Admin')
      throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    const user = await prisma.user.findUnique({ where: { id: args.id } });
    if (!user) throw new GraphQLError('User not found');
    const data: Partial<CreateUserInput> = { ...args.input };
    if (args.input.password) data.password = await bcrypt.hash(args.input.password, config.auth.bcryptRounds);
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

  placeOrder: async (_: any, args: { listingId: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    const listing = await prisma.listing.findUnique({ where: { id: args.listingId } });
    if (!listing) throw new GraphQLError('Listing not found');
    if (listing.status === 'out_of_order' || listing.stock < 1) throw new GraphQLError('This item is out of stock');
    const [order] = await prisma.$transaction([
      prisma.order.create({ data: { userId: caller.id, listingId: args.listingId } }),
      prisma.listing.update({
        where: { id: args.listingId },
        data: { stock: { decrement: 1 }, status: listing.stock - 1 === 0 ? 'out_of_order' : 'in_stock' },
      }),
    ]);
    return order;
  },

  cancelOrder: async (_: any, args: { orderId: string }, ctx: GraphQLContext) => {
    const caller = requireAuth(ctx);
    const order = await prisma.order.findUnique({ where: { id: args.orderId } });
    if (!order) throw new GraphQLError('Order not found');
    if (order.userId !== caller.id && caller.role !== 'Admin') throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
    if (order.status === 'cancelled') throw new GraphQLError('Order is already cancelled');
    if (order.status === 'completed') throw new GraphQLError('Completed orders cannot be cancelled');
    const [updated] = await prisma.$transaction([
      prisma.order.update({ where: { id: args.orderId }, data: { status: 'cancelled', cancelledAt: new Date() } }),
      prisma.listing.update({ where: { id: order.listingId }, data: { stock: { increment: 1 }, status: 'in_stock' } }),
    ]);
    return updated;
  },

  createListing: async (_: any, args: { input: any }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return prisma.listing.create({ data: args.input });
  },

  updateListing: async (_: any, args: { id: string; input: any }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const listing = await prisma.listing.findUnique({ where: { id: args.id } });
    if (!listing) throw new GraphQLError('Listing not found');
    return prisma.listing.update({ where: { id: args.id }, data: args.input });
  },

  deleteListing: async (_: any, args: { id: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    const listing = await prisma.listing.findUnique({ where: { id: args.id } });
    if (!listing) throw new GraphQLError('Listing not found');
    await prisma.listing.delete({ where: { id: args.id } });
    return true;
  },
};
