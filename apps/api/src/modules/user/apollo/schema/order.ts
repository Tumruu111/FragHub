export const orderTypeDefs = `#graphql
type Order {
  id: ID!
  status: OrderStatus!
  total: Float!
  userId: ID!
  listingId: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
}

extend type Query {
  orders: [Order!]!
  order(id: ID!): Order
  checkOrder(userId: ID!, listingId: ID!): Order
}

extend type Mutation {
  cancelOrder(userId: ID!, orderId: ID!): Order!
}
`;
