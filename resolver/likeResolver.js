// likeResolver.js

const jwt = require('jsonwebtoken');
const db = require('../config/connect');

const likeResolver = {
  Query: {
    /**
     * Fetches the users who liked a specific post.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the query.
     * @param {number} args.postId - The ID of the post to fetch likes for.
     * @returns {Array} - List of user IDs who liked the post.
     * @throws {Error} - Throws an error if there is a problem with the database query.
     */
    likes: async (_, { postId }) => {
      try {
        const q = `SELECT userId FROM likes WHERE postId = ?`;
        const [data] = await db.query(q, [postId]);
        return data.map(like => like.userId);
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    /**
     * Adds a like to a specific post.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {number} args.postId - The ID of the post to like.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {string} - A success message indicating the like has been created.
     * @throws {Error} - Throws an error if the user is not logged in, has already liked the post, or there is a problem with the database query.
     */
    addLike: async (_, { postId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");

        const checkQuery = "SELECT * FROM likes WHERE userId = ? AND postId = ?";
        const checkValues = [userInfo.id, postId];

        const [checkData] = await db.query(checkQuery, checkValues);
        if (checkData.length > 0) {
          throw new Error("You have already liked this post");
        }

        const insertQuery = "INSERT INTO likes (`userId`, `postId`) VALUES (?, ?)";
        const insertValues = [userInfo.id, postId];

        await db.query(insertQuery, insertValues);

        return "Like has been created";
      } catch (err) {
        throw new Error(err);
      }
    },
    /**
     * Removes a like from a specific post.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {number} args.postId - The ID of the post to remove the like from.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {string} - A success message indicating the like has been deleted.
     * @throws {Error} - Throws an error if the user is not logged in, the like is not found, or there is a problem with the database query.
     */
    deleteLike: async (_, { postId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");

        const q = "DELETE FROM likes WHERE `userId` = ? AND `postId` = ?";
        const values = [userInfo.id, postId];

        const [result] = await db.query(q, values);

        if (result.affectedRows === 0) {
          throw new Error("Like not found");
        }

        return "Like has been deleted";
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};

module.exports = likeResolver;
