import { prisma } from '../../../../../lib/prisma';
import { GraphQLError } from 'graphql';

export const userQueries = {
  user: async (_: any, args: { id: string }) => {
    const { id } = args;

    if (!id || typeof id !== 'string') {
      throw new GraphQLError('Invalid user ID');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new GraphQLError('User not found');
    }

    return user;
  },

  users: async (_: any, args: { skip?: number; take?: number }) => {
    const skip = Math.max(args.skip ?? 0, 0);
    const take = Math.min(args.take ?? 10, 50);

    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  checkOrder: async (_: any, args: { userId: string; listingId: string }) => {
    const { userId, listingId } = args;

    if (!userId || !listingId) {
      throw new GraphQLError('Invalid userId or listingId');
    }

    const order = await prisma.order.findFirst({
      where: { userId, listingId },
    });

    return !!order;
  },
};
