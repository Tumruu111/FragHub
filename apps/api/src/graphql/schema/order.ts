export const orderTypeDefs = `#graphql
type Order {
  id: ID!
  status: OrderStatus!
  userId: ID!
  listingId: ID!
  listing: Listing!
  user: User!
  "Decant size, in ml"
  sizeMl: Int!
  "Its share of the month's subscription price"
  price: Float!
  buyerConfirmed: Boolean!
  "Where to deliver it: the subscription's address"
  delivery: Delivery
  "The subscription box month it was sent in, e.g. 2026-12"
  boxMonth: String
  createdAt: DateTime!
  updatedAt: DateTime!
  completedAt: DateTime
  cancelledAt: DateTime
}

type Delivery {
  phone: String!
  address: String!
  note: String
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
  "Admin only: the box decant was delivered"
  completeOrder(orderId: ID!): Order!
  "Admin only: puts the ml back in the bottle"
  cancelOrder(orderId: ID!): Order!
}
`;
