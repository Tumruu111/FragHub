import { ApolloServer } from '@apollo/server';

export const userApolloServer = new ApolloServer({
  typeDefs: `
  

    type Query {
      
    }
    
    type Mutation {
     
    }
  `,

  resolvers: {
    Query: {},

    Mutation: {},
  },
});
