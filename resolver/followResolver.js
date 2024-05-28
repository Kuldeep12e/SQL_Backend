// relationshipResolver.js

const jwt = require('jsonwebtoken');
const db = require('../config/connect');

const relationshipResolver = {
  Query: {
    /**
     * Fetches the followers of a specific user.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the query.
     * @param {number} args.userId - The ID of the user to fetch followers for.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {Array} - List of followers.
     * @throws {Error} - Throws an error if the user is not logged in or the token is not valid.
     */
    followers: async (_, { userId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");

        const q = `SELECT followerUserId from relationship WHERE followedUserId = ?`;

        const [data] = await db.query(q, [userId]);
        return data;
      } catch (err) {
        throw new Error("Token is not valid");
      }
    }
  },
  /**
     * Adds a follower to a specific user.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {number} args.userId - The ID of the user to follow.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {string} - A success message indicating the user is now following.
     * @throws {Error} - Throws an error if the user is not logged in or the token is not valid.
     */
  Mutation: {
     addFollower: async (_, { userId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }
    
      try {
        const userInfo = jwt.verify(token, "secretkey");
    
        const checkQuery = "SELECT * FROM relationship WHERE followerUserId = ? AND followedUserId = ?";
        const checkValues = [userInfo.id, userId];
    
        const [existingRelationship] = await db.query(checkQuery, checkValues);
    
        if (existingRelationship.length > 0) {
          // Relationship already exists
          return "Already following";
        } else {
          // Insert new relationship
          const insertQuery = "INSERT INTO relationship (`followerUserId`, `followedUserId`) VALUES (?, ?)";
          const insertValues = [userInfo.id, userId];
    
          await db.query(insertQuery, insertValues);
          return "Following now";
        }
      } catch (err) {
        throw new Error("Token is not valid");
      }
    },
    
     /**
     * Removes a follower from a specific user.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {number} args.userId - The ID of the user to unfollow.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {string} - A success message indicating the user has unfollowed.
     * @throws {Error} - Throws an error if the user is not logged in, the follower is not found, or the token is not valid.
     */
    removeFollower: async (_, { userId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");

        const q = "DELETE FROM relationship WHERE `followerUserId` = ? AND `followedUserId` = ?";
        const values = [userInfo.id, userId];

        const data = await db.query(q, values);
        if (data.affectedRows === 0) {
          throw new Error("Follower not found");
        }
        return "Unfollowed";
      } catch (err) {
        throw new Error("Token is not valid");
      }
    }
  }
};

module.exports = relationshipResolver;
