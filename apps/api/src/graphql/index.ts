import { ApolloServer } from '@apollo/server';
import { baseTypeDefs } from './schema/baseSchema';
import { enumTypeDefs } from './schema/enum';
import { listingTypeDefs } from './schema/listing';
import { userTypeDefs } from './schema/user';
import { orderTypeDefs } from './schema/order';
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
  ],
  resolvers: {
    Query: { ...queries },
    Mutation: { ...mutations },
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
      price: (parent: { price: unknown }) => Number(parent.price),
    },
  },
  // Disable introspection in production — prevents schema mapping by attackers
  introspection: config.isDev,
});
