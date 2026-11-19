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

input UpdateUserInput {
  name: String
  email: String
  password: String
}

extend type Query {
  users: [User!]!
  user(id: ID!): User
}

# Sign-up is REST only: POST /api/auth/register
extend type Mutation {
  deleteUser(id: ID!): Boolean!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
`;
