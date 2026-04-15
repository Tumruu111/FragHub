import { ApolloServer } from '@apollo/server';
import { enumTypeDefs } from './apollo/schema/enum';
import { listingTypeDefs } from './apollo/schema/listing';
import { userTypeDefs } from './apollo/schema/user';
import { orderTypeDefs } from './apollo/schema/order';
import { userQueries } from './apollo/resolvers/queries/userQueries';
import { userMutations } from './apollo/resolvers/mutations/userMutations';
import { baseTypeDefs } from './apollo/schema/baseSchema';

export const userApolloServer = new ApolloServer({
  typeDefs: [
    enumTypeDefs,
    listingTypeDefs,
    userTypeDefs,
    orderTypeDefs,
    baseTypeDefs,
  ],
  resolvers: {
    Query: { ...userQueries },
    Mutation: { ...userMutations },
  },
});
