const { gql } = require('apollo-server');

// Define GraphQL type definitions for Post and related queries and mutations
const postSchema = gql`
  type Post {
    id: Int!
    description: String
    image: String!
    createdAt: String!
    userId: Int!
    scheduledAt: String!
    isPublished: Boolean!
    user: User!
    commentDisabled: Boolean!
  }

  extend type Query {
    getposts(userId: Int): [Post!]!
  }

  extend type Mutation {
    addPost(description: String, image: String, scheduledAt: String, commentDisabled: Boolean = false): Post!
    deletePost(id: Int!): Boolean!
  }
`;

module.exports = postSchema;
