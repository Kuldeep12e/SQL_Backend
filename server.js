// Importing necessary modules
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolver');
const cookieParser = require('cookie-parser')

// The port number which the server will listen on
const PORT = 4000;

// creates an express application
const app = express();

// Cookie-parser middleware to parse cookies in requests
app.use(cookieParser());

/**
 * Initializes ApolloServer with GraphQL type definitions and resolvers
 * The context function provides access to the request and response objects
 */
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }), 
});

//cloudinary Connect


/**
 * Function to start the ApolloServer
 * It starts the server and applies the middleware to the Express app
 */
async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });
}

// Start the ApolloServer and listen on the defined port
startApolloServer().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
})
.catch(error => {
  // Log any errors that occur during server startup
  console.error('Error starting server:', error);
});
