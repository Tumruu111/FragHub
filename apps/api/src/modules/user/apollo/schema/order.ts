export const orderTypeDefs = `
scalar DateTime
 type Order {
  id: String!
  status: OrderStatus!
  userId: String!
  user: User!
  listingId: String!
  listing: Listing!
  buyerConfirmed: Boolean!

  createdAt: DateTime!
  updatedAt: DateTime!
}

extend type Query {
  orders: [Order!]!
  order(id: ID!): Order
}

extend type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  confirmOrder(id: ID!): Order!
  cancelOrder(id: ID!): Order!
}

input CreateOrderInput {
  userId: String!
  listingId: String!
} 
`;
