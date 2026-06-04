import { GraphQLClient } from 'graphql-request';
import { getToken } from '../auth/token';
import { config } from '../../config';

export const graphQLClient = new GraphQLClient(config.graphqlUrl, {
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
