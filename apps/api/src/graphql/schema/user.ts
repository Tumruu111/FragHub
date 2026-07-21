export const userTypeDefs = `
type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  orders: [Order!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
}

input UpdateUserInput {
  name: String
  email: String
  password: String
}

extend type Query {
  users: [User!]!
  user(id: ID!): User
}

extend type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
`;
