export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL as string,
} as const;

export const TOKEN_KEY = 'frag-token';
