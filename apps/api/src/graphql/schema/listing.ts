export const listingTypeDefs = `
type ListingSize {
  sizeMl: Int!
  price: Float!
  "How many of this size the ml left in the bottle can fill"
  available: Int!
}

type Listing {
  id: ID!
  status: ListingStatus!
  title: String!
  vibe: [String!]!
  picture: String!
  "Full bottle size in ml"
  bottleMl: Int!
  "Ml left in the bottle, shared by every size"
  volumeMl: Int!
  sizes: [ListingSize!]!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ListingResponse {
  data: [Listing!]!
  pageInfo: PageInfo!
}

extend type Query {
  listings(page: Int, limit: Int): ListingResponse!
  listing(id: ID!): Listing
  adminListings: [Listing!]!
  "The fixed decant sizes every listing is priced in"
  decantSizes: [Int!]!
}

input SizePriceInput {
  sizeMl: Int!
  price: Float!
}

input CreateListingInput {
  title: String!
  vibe: [String!]!
  picture: String!
  bottleMl: Int!
  "Defaults to the full bottle"
  volumeMl: Int
  sizes: [SizePriceInput!]!
}

input UpdateListingInput {
  title: String
  vibe: [String!]
  picture: String
  bottleMl: Int
  volumeMl: Int
  status: ListingStatus
  sizes: [SizePriceInput!]
}

extend type Mutation {
  createListing(input: CreateListingInput!): Listing!
  updateListing(id: ID!, input: UpdateListingInput!): Listing!
  deleteListing(id: ID!): Boolean!
}
`;
