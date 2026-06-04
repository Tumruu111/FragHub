export const orderTypeDefs = `#graphql
type Order {
  id: ID!
  status: OrderStatus!
  userId: ID!
  listingId: ID!
  buyerConfirmed: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
  cancelledAt: DateTime
}

extend type Query {
  orders: [Order!]!
  order(id: ID!): Order
  checkOrder(userId: ID!, listingId: ID!): Order
}

extend type Mutation {
  placeOrder(listingId: ID!): Order!
  cancelOrder(orderId: ID!): Order!
}
`;
