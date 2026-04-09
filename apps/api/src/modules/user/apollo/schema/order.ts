export const orderTypeDefs = `
type Order {
  id: ID!
  status: OrderStatus!
  total: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
}

extend type Query {
  orders: [Order!]!
  order(id: ID!): Order
}
`;
