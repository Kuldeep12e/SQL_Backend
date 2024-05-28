const jwt = require('jsonwebtoken');
const moment = require('moment');
const db = require('../config/connect');

const commentResolver = {
  Query: {
    /**
     * Fetches all comments for a specific post.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the query.
     * @param {number} args.postId - The ID of the post to fetch comments for.
     * @returns {Array} - List of comments with user information.
     * @throws {Error} - Throws an error if there is a problem with the database query.
     */
    comments: async (_, { postId }) => {
      try {
        const q = `SELECT c.*, u.id AS userId, u.name, u.profilepicture
                   FROM comments AS c
                   JOIN user AS u ON (u.id = c.userId)
                   WHERE c.postId = ?
                   ORDER BY c.createdAt DESC`;
        const [data] = await db.query(q, [postId]);
        return data;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    /**
     * Adds a new comment to a specific post.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {string} args.description - The description of the comment.
     * @param {number} args.postId - The ID of the post to add the comment to.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {Object} - The newly created comment.
     * @throws {Error} - Throws an error if the user is not logged in or there is a problem with the database query.
     */
    addComment: async (_, { description, postId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");
        const commentDisabledQuery = "SELECT commentDisabled FROM posts WHERE id = ?";
        const [commentStatusRows] = await db.query(commentDisabledQuery, [postId]);
        const commentStatus = commentStatusRows.length > 0 && !!commentStatusRows[0].commentDisabled;

        console.log(commentStatus)

        typeof(commentStatus)
        // Check if comments are disabled
        if (commentStatus) {
          throw new Error("Comments are disabled for this post.");
        }
       

        const q = "INSERT INTO comments (`description`, `createdAt`, `userId`, `postId`) VALUES ?";
        const values = [
          [
            description,
            moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
            userInfo.id,
            postId
          ]
        ];

        const [result] = await db.query(q, [values]);
        const commentId = result.insertId;

        return {
          id: commentId,
          description,
          createdAt: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
          userId: userInfo.id
        };
      } catch (err) {
        throw new Error(err);
      }
    },
     /**
     * Deletes a specific comment.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {number} args.commentId - The ID of the comment to delete.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.req - The request object containing cookies.
     * @returns {string} - A success message if the comment is deleted.
     * @throws {Error} - Throws an error if the user is not logged in, the comment is not found, or there is a problem with the database query.
     */
    deleteComment: async (_, { commentId }, { req }) => {
      const token = req.cookies.token;
      if (!token) {
        throw new Error("Not logged in");
      }

      try {
        const userInfo = jwt.verify(token, "secretkey");

        const q = "DELETE FROM comments WHERE id = ? AND userId = ?";
        const [result] = await db.query(q, [commentId, userInfo.id]);

        if (result.affectedRows === 0) {
          throw new Error("Comment not found or you don't have permission to delete");
        }

        return "Comment deleted successfully";
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};

module.exports = commentResolver;
