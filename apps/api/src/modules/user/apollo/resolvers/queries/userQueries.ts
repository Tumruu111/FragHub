import { prisma } from '../../../../../lib/prisma';
import { GraphQLError } from 'graphql';

export const userQueries = {
  user: async (_root: any, args: { id: string }) => {
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

  checkOrder: async (
    _root: any,
    args: { userId: string; listingId: string }
  ) => {
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
