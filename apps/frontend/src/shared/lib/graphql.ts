import { GraphQLClient } from 'graphql-request';

export const graphQLClient = new GraphQLClient(
  import.meta.env.VITE_GRAPHQL_URL,
  {
    headers: {},
  }
);
