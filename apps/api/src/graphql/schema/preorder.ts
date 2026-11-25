export const preorderTypeDefs = `#graphql
enum PreorderStatus {
  "Placed; the 50% deposit isn't paid yet"
  awaiting_deposit
  "Deposit paid: we order the bottles from our supplier"
  ordering
  "In UB: waiting for the rest to be paid"
  arrived
  "Fully paid: ready to deliver"
  paid
  delivered
  cancelled
}

enum PreorderPaymentKind {
  deposit
  balance
}

type PreorderItem {
  id: ID!
  listingId: ID
  title: String!
  bottleMl: Int!
  price: Float!
  "The listing's picture, if it still exists"
  picture: String
}

type PreorderPayment {
  id: ID!
  kind: PreorderPaymentKind!
  amount: Float!
  paid: Boolean!
  paidAt: DateTime
}

type Preorder {
  id: ID!
  status: PreorderStatus!
  total: Float!
  "Paid up front"
  deposit: Float!
  "Paid once the bottles arrive"
  balance: Float!
  items: [PreorderItem!]!
  payments: [PreorderPayment!]!
  "The unpaid payment the customer should pay now, if any"
  due: PreorderPayment
  "When the rest must be paid by, once the bottles have arrived"
  balanceDueBy: DateTime
  "The rest is due and the deadline has passed"
  overdue: Boolean!
  delivery: Delivery!
  user: User!
  createdAt: DateTime!
  depositPaidAt: DateTime
  arrivedAt: DateTime
  paidAt: DateTime
  deliveredAt: DateTime
  cancelledAt: DateTime
}

extend type Query {
  myPreorders: [Preorder!]!
  "Admin only. Leaves out pre-orders whose deposit was never paid unless asked."
  adminPreorders(includeUnpaid: Boolean): [Preorder!]!
}

extend type Mutation {
  "Drops your own pre-order while its deposit is unpaid"
  cancelMyPreorder(id: ID!): Preorder!
  "Admin only: the bottles are in UB. Asks the customer to pay the rest."
  markPreorderArrived(id: ID!): Preorder!
  "Admin only: handed over to the customer"
  markPreorderDelivered(id: ID!): Preorder!
  "Admin only: any refund is done by hand in QPay"
  cancelPreorder(id: ID!): Preorder!
}
`;
