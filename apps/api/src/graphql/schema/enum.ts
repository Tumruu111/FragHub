export const enumTypeDefs = `
scalar DateTime

enum Role {
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
