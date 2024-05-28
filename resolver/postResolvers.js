const jwt = require('jsonwebtoken');
const moment = require('moment');
const db = require('../config/connect');
const schedule = require('node-schedule');

const postResolver = {
    Query: {
        /**
         * Fetches posts based on the provided user ID or the logged-in user's ID.
         * 
         * @param {Object} _ - Unused parent argument.
         * @param {Object} args - The arguments provided to the query.
         * @param {number} args.userId - The ID of the user whose posts are to be fetched.
         * @param {Object} context - The context provided to the resolver.
         * @param {Object} context.req - The request object containing cookies.
         * @returns {Array} - List of posts.
         * @throws {Error} - Throws an error if the user is not logged in or the token is not valid.
         */
        getposts: async (_, { userId }, { req }) => {
            const token = req.cookies.token;
            if (!token) {
                throw new Error("Not logged in");
            }
            try {
                const userInfo = jwt.verify(token, "secretkey");
                let q;
                let params;
                if (userId) {
                    q = `SELECT p.*, u.id AS userId, u.name, u.profilepicture
               FROM posts AS p
               JOIN user AS u ON (u.id = p.userId)
               WHERE p.userId = ?`;
                    params = [userId];
                } else {
                    q = `SELECT p.*, u.id AS userId, u.name, u.profilepicture
               FROM posts AS p
               JOIN user AS u ON (u.id = p.userId)
               WHERE p.userId = ? OR p.userId IN (
                   SELECT followedUserId FROM relationship WHERE followerUserId = ?
               )
               ORDER BY p.createdAt DESC`;
                    params = [userInfo.id, userInfo.id];
                }
                const [data] = await db.query(q, params);
                
                return data;
            } catch (err) {
                throw new Error("Token is not valid");
            }
        }
    },
    Mutation: {
        /**
         * Adds a new post with an optional scheduled publishing time.
         * 
         * @param {Object} _ - Unused parent argument.
         * @param {Object} args - The arguments provided to the mutation.
         * @param {string} args.description - The description of the post.
         * @param {string} args.image - The image URL of the post.
         * @param {string} args.scheduledAt - The scheduled publishing time of the post (optional).
         * @param {Object} context - The context provided to the resolver.
         * @param {Object} context.req - The request object containing cookies.
         * @returns {Object} - The newly created post.
         * @throws {Error} - Throws an error if the user is not logged in, the token is not valid,
         *                   the post is already liked, or there is a problem with the database query.
         */
        addPost: async (_, { description, image, scheduledAt, commentDisabled }, { req }) => {
            const token = req.cookies.token;
            if (!token) {
                throw new Error("Not logged in");
            }

            try {
                const userInfo = jwt.verify(token, "secretkey");
                let q;
                let values;
                const currentTime = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        

                //To shedule the post if User want to shedule it

                if (scheduledAt) {
                    const formattedScheduledAt = moment(scheduledAt).format("YYYY-MM-DD HH:mm:ss");
                    q = "INSERT INTO posts (`description`, `image`, `createdAt`, `userId`, `scheduledAt`, `isPublished`, `commentDisabled`) VALUES (?)";
                    values = [
                        description,
                        image,
                        currentTime,
                        userInfo.id,
                        formattedScheduledAt,
                        false,
                        commentDisabled
                    ];


                    const scheduleTime = moment(scheduledAt, 'YYYY-MM-DD HH:mm:ss').toDate();
                    
                    schedule.scheduleJob(scheduleTime, async () => {
                        const updateQuery = "UPDATE posts SET isPublished = true WHERE id = ?";
                        await db.query(updateQuery, [result.insertId]);
                        console.log(`Post with ID ${result.insertId} has been published`);
                    });
                } else {
                    q = "INSERT INTO posts (`description`, `image`, `createdAt`, `userId`, `isPublished`, `commentDisabled`) VALUES (?)";
                    values = [
                        description,
                        image,
                        currentTime,
                        userInfo.id,
                        true, 
                        commentDisabled
                    ];
                   
                }
                

                const [result] = await db.query(q, [values]);
               
                const postId = result.insertId;

                return {
                    id: postId,
                    description,
                    image,
                    createdAt: currentTime,
                    userId: userInfo.id,
                    scheduledAt: scheduledAt ? moment(scheduledAt).format("YYYY-MM-DD HH:mm:ss") : null,
                    isPublished: !scheduledAt,
                    commentDisabled: commentDisabled
                };
            } catch (err) {
                if (err instanceof jwt.JsonWebTokenError) {
                    throw new Error("Token is not valid");
                } else {
                    throw new Error("An unexpected error occurred");
                }
            }
        }, //to delete Post
        deletePost: async (_, { id }, { req }) => {
            const token = req.cookies.token;
            if (!token) {
                throw new Error("Not logged in");
            }

            try {
                const userInfo = jwt.verify(token, "secretkey");
                const [postRow] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
                if (postRow.length === 0) {
                    throw new Error("Post does not exist");
                }

                const post = postRow[0];
                if (post.userId !== userInfo.id) {
                    throw new Error("Not authorized to delete this post");
                }

                await db.query("DELETE FROM posts WHERE id = ?", [id]);
                return true;
            } catch (err) {
                if (err instanceof jwt.JsonWebTokenError) {
                    throw new Error("Token is not valid");
                } else {
                    throw new Error("An unexpected error occurred");
                }
            }
        }
    }
}
module.exports = postResolver;
