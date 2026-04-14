export const orderTypeDefs = `
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
}
`;
