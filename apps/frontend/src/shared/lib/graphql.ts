import { GraphQLClient } from 'graphql-request';
import { getToken } from './auth';

export const graphQLClient = new GraphQLClient(
  import.meta.env.VITE_GRAPHQL_URL,
  {
    headers: () => {
      const token = getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  }
);
