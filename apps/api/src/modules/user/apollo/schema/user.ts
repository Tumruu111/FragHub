export const userTypeDefs = `
scalar DateTime
  type User {
  id: String!
  name: String!
  email: String!
  role: Roles!
  orders: [Order!]!

  createdAt: DateTime!
  updatedAt: DateTime!
}

extend type Query {
  users: [User!]!
  user(id: ID!): User
}

extend type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
}
`;
