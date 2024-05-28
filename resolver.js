// Import individual resolver modules
const { mergeResolvers } = require('@graphql-tools/merge');
const userResolvers = require('./resolver/userResolvers');
const postResolvers = require('./resolver/postResolvers');
const followResolver = require('./resolver/followResolver')
const commentResolver = require('./resolver/commentResolver')
const likeResolver = require('./resolver/likeResolver')

/**
 * Merge the resolver objects from various modules into a single resolver object.
 * This approach allows modularization of resolvers, improving maintainability and organization.
 */
const resolvers = mergeResolvers([userResolvers, postResolvers , followResolver , commentResolver , likeResolver]);

module.exports = resolvers;

