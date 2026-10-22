export const orderTypeDefs = `#graphql
type Order {
  id: ID!
  status: OrderStatus!
  userId: ID!
  listingId: ID!
  listing: Listing!
  buyerConfirmed: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
  cancelledAt: DateTime
}

type DayCount {
  day: String!
  count: Int!
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
  ordersByDay: [DayCount!]!
}

extend type Query {
  orders: [Order!]!
  myOrders: [Order!]!
  order(id: ID!): Order
  checkOrder(userId: ID!, listingId: ID!): Order
  adminStats: AdminStats!
}

extend type Mutation {
  cancelOrder(orderId: ID!): Order!
}
`;
