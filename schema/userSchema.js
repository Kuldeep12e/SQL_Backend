const { gql } = require('apollo-server');

// Defining GraphQL type definitions for User and authentication
const userTypeDefs = gql`
    type User {
        id: Int
        username: String!
        name: String!
        email: String!
        password: String!
        profilePicture: String
        city: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        findUserById(id: Int!): User
        allUsers: [User!]
        findUserByUsername(username: String!): User
        findUserByName(name: String!): User
        logout: String!
    }

    type Mutation {
        register(username: String!, name: String!, email: String!, password: String!, profilePicture: String, city: String!): User!
        login(username: String!, password: String!): AuthPayload!
        updateUser(id: Int!, username: String, name: String, email: String, password: String, profilePicture: String, city: String): User!
    }
`;

module.exports = userTypeDefs;
