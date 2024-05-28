const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/connect'); 
const cookie = require('cookie-parser')

const userResolvers = {
  Query: {
    /**
     * Fetches a user by its ID.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the query.
     * @param {number} args.id - The ID of the user to fetch.
     * @returns {Object|null} - The user object if found, otherwise throw error.
     */
    findUserById: async (_, { id }) => {
      const [userRow] = await db.query("SELECT * FROM user WHERE id = ?", [id]);
      if(userRow.length === 0) {
        throw new Error("User does not exits");
      }
      const { password: userPassword, ...userWithoutPassword } = userRow[0];
      return userWithoutPassword;
    },
    /**
     * Fetches all users.
     * 
     * @returns {Array} - List of all users.
     */
    allUsers: async () => {
      const [rows] = await db.query("SELECT * FROM user");
      return rows;
    },

        /**
     * Fetches a user by its username.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the query.
     * @param {number} args.username - The username of the user to fetch.
     * @returns {Object|null} - The user object if found, otherwise throw error.
     */
    findUserByUsername: async(_, {username}) => {
        const[userRow] = await db.query("SELECT * FROM user WHERE username = ?", [username]);
        if(userRow.length === 0) {
          throw new Error("User does not exits");
        }
        const { password: userPassword, ...userWithoutPassword } = userRow[0];
        return userWithoutPassword;
    },
    findUserByName : async(_, {name}) => {
      const[userRow] = await db.query("SELECT * FROM user WHERE name = ?", [name]);
      if(userRow.length === 0) {
        throw new Error("User does not exits");
      }
      const { password: userPassword, ...userWithoutPassword } = userRow[0];
      return userWithoutPassword;
  },
    /**
     * Logs out the user by clearing the token cookie.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} __ - Unused arguments.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.res - The response object used to clear the cookie.
     * @returns {string} - A message indicating successful logout.
     * @throws {Error} - Throws an error if there is a problem clearing the cookie.
     */
    logout: async (_, __, { res }) => {
        try {
          res.clearCookie("token", {
            secure: true,
            sameSite: "none"
          });
          return "User has been logged out";
        } catch (error) {
          throw new Error(error.message);
        }
      },
    
  },
  Mutation: {
     /**
     * Registers a new user.
     * 
     * @param {Object} root - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {string} args.username - The username of the new user.
     * @param {string} args.name - The name of the new user.
     * @param {string} args.email - The email of the new user.
     * @param {string} args.password - The password of the new user.
     * @param {string} args.profilePicture - The profile picture URL of the new user.
     * @param {string} args.city - The city of the new user.
     * @returns {Object} - The newly created user object.
     * @throws {Error} - Throws an error if the user already exists or there is a problem with the database query.
     */
    async register(root, { username, name, email, password, profilePicture, city }) {
                    try {
                        // Check if user already exists
                        const userExistsQuery = "SELECT * FROM user WHERE username = ?";
                        const [existingUsers] = await db.query(userExistsQuery, [username]);
        
                        if (existingUsers.length) {
                            throw new Error("User already exists!");
                        }
        
                        // Hash the password
                        const salt = bcrypt.genSaltSync(10);
                        const hashedPassword = bcrypt.hashSync(password, salt);
        
                        // Create a new user
                        const insertUserQuery = "INSERT INTO user (username, name, email, password, profilePicture, city) VALUES (?, ?, ?, ?, ?, ?)";
                        const values = [username, name, email, hashedPassword, profilePicture, city];
                        const [result] = await db.query(insertUserQuery, values);
        
                        const userId = result.insertId; // Assuming this gets the ID of the newly created user
        
                        return {
                            id: userId,
                            username,
                            name,
                            email,
                            profilePicture,
                            city
                        };
                    } catch (error) {
                        throw new Error(error.message);
                    }
     },
     /**
     * Logs in a user.
     * 
     * @param {Object} _ - Unused parent argument.
     * @param {Object} args - The arguments provided to the mutation.
     * @param {string} args.username - The username of the user.
     * @param {string} args.password - The password of the user.
     * @param {Object} context - The context provided to the resolver.
     * @param {Object} context.res - The response object used to set the token cookie.
     * @returns {Object} - The JWT token and user object upon successful login.
     * @throws {Error} - Throws an error if the user is not found, the password is incorrect, or there is a problem with the database query.
     */
     login: async (_, { username, password }, { res }) => { 
      try {
        const userQuery = "SELECT * FROM user WHERE username = ?";
        const [users] = await db.query(userQuery, [username]);

        if (users.length === 0) {
          throw new Error('USER not found with this username');
        }

        const user = users[0];
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
          throw new Error('wrong password or username');
        }

        const token = jwt.sign({ id: user.id }, 'secretkey');

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none"
          });

        const { password: userPassword, ...userWithoutPassword } = user;

        return {
          token,
          user: userWithoutPassword,
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    updateUser: async (_, { id, username, name, email, password, profilePicture, city }) => {
      try {
        const [existingUser] = await db.query("SELECT * FROM user WHERE id = ?", [id]);
        if (existingUser.length === 0) {
          throw new Error("User does not exist");
        }

        const updatedFields = {};
        if (username) updatedFields.username = username;
        if (name) updatedFields.name = name;
        if (email) updatedFields.email = email;
        if (password) {
          const salt = bcrypt.genSaltSync(10);
          updatedFields.password = bcrypt.hashSync(password, salt);
        }
        if (profilePicture) updatedFields.profilePicture = profilePicture;
        if (city) updatedFields.city = city;

        const setString = Object.keys(updatedFields).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(updatedFields), id];

        const updateUserQuery = `UPDATE user SET ${setString} WHERE id = ?`;
        await db.query(updateUserQuery, values);

        const [updatedUserRow] = await db.query("SELECT * FROM user WHERE id = ?", [id]);
        const { password: userPassword, ...userWithoutPassword } = updatedUserRow[0];

        return userWithoutPassword;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  
    
  },

};

module.exports = userResolvers;
