import { ApolloServer } from '@apollo/server';
import { baseTypeDefs } from './schema/baseSchema';
import { enumTypeDefs } from './schema/enum';
import { listingTypeDefs } from './schema/listing';
import { userTypeDefs } from './schema/user';
import { orderTypeDefs } from './schema/order';
import { subscriptionTypeDefs } from './schema/subscription';
import { preorderTypeDefs } from './schema/preorder';
import {
  preorderMutations,
  preorderQueries,
  preorderTypes,
} from './resolvers/preorders';
import {
  subscriptionMutations,
  subscriptionQueries,
  subscriptionTypes,
} from './resolvers/subscriptions';
import { queries } from './resolvers/queries/listingQueries';
import { mutations } from './resolvers/mutations/mutations';
import { prisma } from '../lib/prisma';
import type { GraphQLContext } from './context';
import { config } from '../config';

export const apolloServer = new ApolloServer<GraphQLContext>({
  typeDefs: [
    baseTypeDefs,
    enumTypeDefs,
    listingTypeDefs,
    userTypeDefs,
    orderTypeDefs,
    subscriptionTypeDefs,
    preorderTypeDefs,
  ],
  resolvers: {
    Query: { ...queries, ...subscriptionQueries, ...preorderQueries },
    Mutation: { ...mutations, ...subscriptionMutations, ...preorderMutations },
    ...subscriptionTypes,
    ...preorderTypes,
    Listing: {
      bottlePrice: (parent: { bottlePrice: unknown }) =>
        parent.bottlePrice == null ? null : Number(parent.bottlePrice),
    },
    Order: {
      listing: (parent: { listingId: string }) =>
        prisma.listing.findUnique({ where: { id: parent.listingId } }),
      user: (parent: { userId: string }) =>
        prisma.user.findUnique({ where: { id: parent.userId } }),
      price: (parent: { price: unknown }) => Number(parent.price),
      boxMonth: async (parent: { boxId: string | null }) =>
        parent.boxId
          ? (await prisma.box.findUnique({ where: { id: parent.boxId } }))
              ?.month ?? null
          : null,
      // A box decant goes to the subscription's address. Prisma batches
      // same-tick findUnique calls, so a list of orders is not N+1.
      delivery: async (parent: { boxId: string | null }) => {
        if (!parent.boxId) return null;
        const s = await prisma.box
          .findUnique({ where: { id: parent.boxId } })
          .subscription();
        return s
          ? {
              phone: s.deliveryPhone,
              address: s.deliveryAddress,
              note: s.deliveryNote,
            }
          : null;
      },
    },
  },
  // Disable introspection in production — prevents schema mapping by attackers
  introspection: config.isDev,
});
