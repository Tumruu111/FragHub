export const baseTypeDefs = `#graphql
  type Query 
  type Mutation

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
`;
