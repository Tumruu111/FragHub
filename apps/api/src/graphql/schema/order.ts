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

type AdminStats {
  totalListings: Int!
  inStock: Int!
  outOfStock: Int!
  totalOrders: Int!
  pending: Int!
  completed: Int!
  cancelled: Int!
  totalRevenue: Float!
}

extend type Query {
  orders: [Order!]!
  order(id: ID!): Order
  checkOrder(userId: ID!, listingId: ID!): Order
  adminStats: AdminStats!
}

extend type Mutation {
  placeOrder(listingId: ID!): Order!
  cancelOrder(orderId: ID!): Order!
}
`;
