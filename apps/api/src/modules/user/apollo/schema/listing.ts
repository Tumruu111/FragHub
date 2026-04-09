export const listingTypeDefs = `
type Listing {
  id: ID!
  status: ListingStatus!
  title: String!
  size: String!
  vibe: [Vibe!]!
  picture: String!
  price: Float!
  stock: Int!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ListingResponse {
  data: [Listing!]!
  pageInfo: PageInfo
}

input ListingFilter {
  name: String
  location: String
  category: String
}

extend type Query {
  listings(filter: ListingFilter): ListingResponse!
  listing(id: ID!): Listing
}

input CreateListingInput {
  title: String!
  size: String!
  vibe: [Vibe!]!
  picture: String!
  price: Float!
  stock: Int!
}

input UpdateListingInput {
  title: String
  size: String
  vibe: [Vibe!]
  picture: String
  price: Float
  stock: Int
  status: ListingStatus
}

extend type Mutation {
  createListing(input: CreateListingInput!): Listing!
  updateListing(id: ID!, input: UpdateListingInput!): Listing!
  deleteListing(id: ID!): Boolean!
}
`;
