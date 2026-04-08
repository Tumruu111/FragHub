import { makeExecutableSchema } from '@graphql-tools/schema';

import { enumTypeDefs } from './schema/enum';
import { userTypeDefs } from './schema/user';
import { listingTypeDefs } from './schema/listing';
import { orderTypeDefs } from './schema/order';

// import { resolvers } from './resolver';

export const schema = makeExecutableSchema({
  typeDefs: [enumTypeDefs, userTypeDefs, listingTypeDefs, orderTypeDefs],
  //   resolvers,
});
