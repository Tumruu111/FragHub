import { ApolloServer } from '@apollo/server';
import { baseTypeDefs } from './schema/baseSchema';
import { enumTypeDefs } from './schema/enum';
import { listingTypeDefs } from './schema/listing';
import { userTypeDefs } from './schema/user';
import { orderTypeDefs } from './schema/order';
import { queries } from './resolvers/queries/listingQueries';
import { mutations } from './resolvers/mutations/mutations';
import type { GraphQLContext } from './context';

export const apolloServer = new ApolloServer<GraphQLContext>({
  typeDefs: [baseTypeDefs, enumTypeDefs, listingTypeDefs, userTypeDefs, orderTypeDefs],
  resolvers: {
    Query: { ...queries },
    Mutation: { ...mutations },
  },
});
