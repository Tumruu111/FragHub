export const subscriptionTypeDefs = `#graphql
enum ListingTier {
  arabian
  designer
  niche
}

enum ScentFor {
  masculine
  feminine
  unisex
}

enum SubscriptionPlan {
  base
  premium
}

enum SubscriberFor {
  him
  her
  either
}

enum SubscriptionStatus {
  pending
  active
  cancelled
  waitlist
}

enum BoxStatus {
  proposed
  confirmed
}

type SubscriptionPlanInfo {
  plan: SubscriptionPlan!
  price: Float!
  "The tiers of the two decants in each box"
  tiers: [ListingTier!]!
  "False while the plan only takes waitlist sign-ups"
  open: Boolean!
}

type SubscriptionInvoice {
  id: ID!
  "e.g. 2026-12"
  month: String!
  amount: Float!
  paid: Boolean!
  "Whether it can still be paid (until the 20th of its month)"
  canPay: Boolean!
}

type BoxItem {
  id: ID!
  tier: ListingTier!
  sizeMl: Int!
  "Empty when nothing in stock fitted; the admin picks one"
  listing: Listing
}

type Box {
  id: ID!
  month: String!
  status: BoxStatus!
  items: [BoxItem!]!
  subscription: Subscription!
  confirmedAt: DateTime
}

type Subscription {
  id: ID!
  plan: SubscriptionPlan!
  forWhom: SubscriberFor!
  status: SubscriptionStatus!
  delivery: Delivery!
  user: User!
  invoices: [SubscriptionInvoice!]!
  "Newest first"
  boxes: [Box!]!
  createdAt: DateTime!
  cancelledAt: DateTime
}

type SubscriptionMonth {
  month: String!
  "Today's day of the month in Ulaanbaatar, when month is the current one"
  today: Int
  invoices: Int!
  paid: Int!
  boxes: [Box!]!
}

extend type Query {
  subscriptionPlans: [SubscriptionPlanInfo!]!
  mySubscription: Subscription
  "Admin only"
  adminSubscriptions: [Subscription!]!
  "Admin only: a month's invoices and boxes, the current month by default"
  adminSubscriptionMonth(month: String): SubscriptionMonth!
}

extend type Mutation {
  "Stops future invoices. Boxes already paid for still arrive."
  cancelSubscription: Subscription!
  "Admin only: emails the month's invoices now instead of waiting for the 1st"
  sendSubscriptionInvoices(month: String!): Int!
  "Admin only: picks boxes for everyone who has paid and has none yet"
  proposeBoxes(month: String!): Int!
  "Admin only: changes the scent in one slot of an unconfirmed box"
  swapBoxItem(itemId: ID!, listingId: ID!): Box!
  "Admin only: takes the ml from the bottles and creates the orders"
  confirmBox(boxId: ID!): Box!
}
`;
