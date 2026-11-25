export const listingTypeDefs = `
type Listing {
  id: ID!
  status: ListingStatus!
  title: String!
  vibe: [String!]!
  picture: String!
  "Full bottle size in ml"
  bottleMl: Int!
  "Ml left in our opened bottle, for subscription box decants"
  volumeMl: Int!
  "Price of a full sealed bottle by pre-order. Not sold as a bottle when null."
  bottlePrice: Float
  "Which subscription box slot it can fill"
  tier: ListingTier!
  "Who it suits, for matching boxes to subscribers"
  scentFor: ScentFor!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ListingResponse {
  data: [Listing!]!
  pageInfo: PageInfo!
}

extend type Query {
  "Bottles customers can pre-order"
  listings(page: Int, limit: Int): ListingResponse!
  listing(id: ID!): Listing
  adminListings: [Listing!]!
}

input CreateListingInput {
  title: String!
  vibe: [String!]!
  picture: String!
  bottleMl: Int!
  "Defaults to the full bottle; 0 when we haven't opened one"
  volumeMl: Int
  bottlePrice: Float
  tier: ListingTier
  scentFor: ScentFor
}

input UpdateListingInput {
  title: String
  vibe: [String!]
  picture: String
  bottleMl: Int
  volumeMl: Int
  status: ListingStatus
  "Send null to stop selling the full bottle"
  bottlePrice: Float
  tier: ListingTier
  scentFor: ScentFor
}

extend type Mutation {
  createListing(input: CreateListingInput!): Listing!
  updateListing(id: ID!, input: UpdateListingInput!): Listing!
  deleteListing(id: ID!): Boolean!
}
`;
