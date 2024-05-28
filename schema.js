const { gql } = require('apollo-server');

// Import individual schema type definitions
const { mergeTypeDefs } = require('@graphql-tools/merge');
const userTypeDefs = require('./schema/userSchema');
const postTypeDefs = require('./schema//postSchema');
const followTypeDefs = require('./schema/followSchema')
const commentSchema = require('./schema/commentSchema')
const likeSchema = require('./schema/likeSchema')

/**
 * Merge the type definitions from various schemas into a single schema.
 * This approach allows modularization of GraphQL schemas, improving maintainability and organization.
 */
const typeDefs = mergeTypeDefs([userTypeDefs, postTypeDefs,followTypeDefs,commentSchema,likeSchema]);

module.exports = typeDefs;


