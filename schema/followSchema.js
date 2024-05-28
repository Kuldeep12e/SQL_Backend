const { gql } = require('apollo-server');

// Define GraphQL type definitions for Relationship and related queries and mutations
const relationshipSchema = gql`
  type Follower {
    followerUserId: Int!
  }

  type Query {
    followers(userId: Int!): [Follower!]!
  }

  type Mutation {
    addFollower(userId: Int!): String!
    removeFollower(userId: Int!): String!
  }
`;

module.exports = relationshipSchema;
