export const enumTypeDefs = `
scalar DateTime

enum Roles {
  Admin
  User
}

enum ListingStatus {
  in_stock
  out_of_order
}

enum OrderStatus {
  pending
  completed
  cancelled
}

`;
