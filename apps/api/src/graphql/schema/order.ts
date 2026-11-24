export const orderTypeDefs = `#graphql
type Order {
  id: ID!
  status: OrderStatus!
  userId: ID!
  listingId: ID!
  listing: Listing!
  user: User!
  "Decant size bought, in ml"
  sizeMl: Int!
  "Price paid for this decant"
  price: Float!
  buyerConfirmed: Boolean!
  "The checkout this order came from. Orders from one checkout ship together."
  paymentId: ID
  "Where to deliver it. Orders from before delivery was added have none."
  delivery: Delivery
  "Set when the order is a decant from a subscription box, e.g. 2026-12"
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
  "Admin only: the decant was handed over or delivered"
  completeOrder(orderId: ID!): Order!
  "Admin only: puts the ml back; the refund itself is done in QPay"
  cancelOrder(orderId: ID!): Order!
}
`;
