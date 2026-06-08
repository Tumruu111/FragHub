export const baseTypeDefs = `#graphql
  type Query 
  type Mutation

  type PageInfo {
    total: Int!
    page: Int!
    limit: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
`;
