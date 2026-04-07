export const usersTypeDef = `
  type User {
    id:      String    
  name:      String
  email:     String    
  password:  String
  role:      Roles    
  order:     [Order]

  createdAt: DateTime  
  updatedAt: DateTime  
}

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  input CreateUserInput {
    name: String!
    email: String!
  }         
`;
