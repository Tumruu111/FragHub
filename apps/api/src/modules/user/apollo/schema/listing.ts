export const listingTypeDefs = `
scalar DateTime
  type Listing {
  id: String!
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

extend type Query {
  listings: [Listing!]!
  listing(id: ID!): Listing
}

extend type Mutation {
  createListing(input: CreateListingInput!): Listing!
  updateListing(id: ID!, input: UpdateListingInput!): Listing!
  deleteListing(id: ID!): Boolean!
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
}`;
