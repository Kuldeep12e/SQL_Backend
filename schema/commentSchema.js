const { gql } = require('apollo-server');

// Define GraphQL type definitions for comment and related queries and mutations
const commentSchema = gql`
  type Comment {
    id: Int!
    description: String!
    createdAt: String!
    userId: Int!
    user: User!
  }

  type Query {
    comments(postId: Int!): [Comment!]!
  }

  type Mutation {
    addComment(description: String!, postId: Int!): Comment!
    deleteComment(commentId: Int!): String!
  }
`;

module.exports = commentSchema;
