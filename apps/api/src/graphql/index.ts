import { ApolloServer } from '@apollo/server';
import { baseTypeDefs } from './schema/baseSchema';
import { enumTypeDefs } from './schema/enum';
import { listingTypeDefs } from './schema/listing';
import { userTypeDefs } from './schema/user';
import { orderTypeDefs } from './schema/order';
import { subscriptionTypeDefs } from './schema/subscription';
import {
  subscriptionMutations,
  subscriptionQueries,
  subscriptionTypes,
} from './resolvers/subscriptions';
import { queries } from './resolvers/queries/listingQueries';
import { mutations } from './resolvers/mutations/mutations';
import { prisma } from '../lib/prisma';
import { availableUnits } from '../lib/decants';
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
  ],
  resolvers: {
    Query: { ...queries, ...subscriptionQueries },
    Mutation: { ...mutations, ...subscriptionMutations },
    ...subscriptionTypes,
    // Prisma batches same-tick findUnique calls (including fluent relation
    // reads like .sizes()) into one query — no N+1
    Listing: {
      sizes: async (parent: { id: string; volumeMl: number }) => {
        const sizes = await prisma.listing
          .findUnique({ where: { id: parent.id } })
          .sizes({ orderBy: { sizeMl: 'asc' } });
        return (sizes ?? []).map((s) => ({
          sizeMl: s.sizeMl,
          price: Number(s.price),
          available: availableUnits(parent.volumeMl, s.sizeMl),
        }));
      },
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
      delivery: async (parent: {
        paymentId: string | null;
        boxId: string | null;
      }) => {
        // A box decant goes to the subscription's address
        if (parent.boxId) {
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
        }
        if (!parent.paymentId) return null;
        const p = await prisma.payment.findUnique({
          where: { id: parent.paymentId },
        });
        return p?.deliveryPhone && p.deliveryAddress
          ? {
              phone: p.deliveryPhone,
              address: p.deliveryAddress,
              note: p.deliveryNote,
            }
          : null;
      },
    },
  },
  // Disable introspection in production — prevents schema mapping by attackers
  introspection: config.isDev,
});
