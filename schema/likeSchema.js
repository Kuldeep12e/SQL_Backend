const { gql } = require('apollo-server');

// Define GraphQL type definitions for Like and related queries and mutations
const likeSchema = gql`
  type Query {
    likes(postId: Int!): [Int!]!
  }

  type Mutation {
    addLike(postId: Int!): String!
    deleteLike(postId: Int!): String!
  }
`;

module.exports = likeSchema;
