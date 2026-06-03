import { ApolloServer } from '@apollo/server';
import { baseTypeDefs } from './apollo/schema/baseSchema';
import { enumTypeDefs } from './apollo/schema/enum';
import { listingTypeDefs } from './apollo/schema/listing';
import { userTypeDefs } from './apollo/schema/user';
import { orderTypeDefs } from './apollo/schema/order';
import { userQueries } from './apollo/resolvers/queries/userQueries';
import { userMutations } from './apollo/resolvers/mutations/userMutations';
import type { GraphQLContext } from './apollo/context';

export const userApolloServer = new ApolloServer<GraphQLContext>({
  typeDefs: [baseTypeDefs, enumTypeDefs, listingTypeDefs, userTypeDefs, orderTypeDefs],
  resolvers: {
    Query: { ...userQueries },
    Mutation: { ...userMutations },
  },
});
