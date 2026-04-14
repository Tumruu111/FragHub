import { GraphQLError } from 'graphql';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcrypt';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}
export const userMutations = {
  cancelOrder: async (_: any, args: { userId: string; orderId: string }) => {
    const { userId, orderId } = args;

    if (!userId || !orderId) {
      throw new GraphQLError('Invalid userId or orderId');
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new GraphQLError('Order not found');
    if (order.userId !== userId) throw new GraphQLError('Permission denied');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    return true;
  },

  createUser: async (_: any, args: { input: CreateUserInput }) => {
    const { name, email, password } = args.input;

    if (!name || !email || !password) {
      throw new GraphQLError('All fields are required');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new GraphQLError('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    return user;
  },

  deleteUser: async (_: any, args: { id: string }) => {
    const { id } = args;

    if (!id) throw new GraphQLError('Invalid user ID');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new GraphQLError('User not found');

    await prisma.order.deleteMany({ where: { userId: id } });

    await prisma.user.delete({ where: { id } });
    return true;
  },
};
