import { ClientError, GraphQLClient } from 'graphql-request';
import { endExpiredSession, getToken } from '../auth/token';
import { config } from '../../config';

export const graphQLClient = new GraphQLClient(config.graphqlUrl, {
  headers: (): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  // The API answers UNAUTHENTICATED when our token is no longer accepted
  responseMiddleware: (response) => {
    if (
      response instanceof ClientError &&
      response.response.errors?.some(
        (e) => e.extensions?.code === 'UNAUTHENTICATED'
      )
    )
      endExpiredSession();
  },
});
