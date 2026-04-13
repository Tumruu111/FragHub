import { ApolloServer } from '@apollo/server';
import { enumTypeDefs } from './apollo/schema/enum';
import { listingTypeDefs } from './apollo/schema/listing';
import { userTypeDefs } from './apollo/schema/user';
import { orderTypeDefs } from './apollo/schema/order';
import { userQueries } from './apollo/resolvers/queries/userQueries';

export const server = new ApolloServer({
  typeDefs: [enumTypeDefs, listingTypeDefs, userTypeDefs, orderTypeDefs],
  resolvers: {
    Query: { ...userQueries },
    Mutation: {},
  },
});
