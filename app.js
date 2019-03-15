require("dotenv").config();

const express = require("express");
const cors = require("cors");
const graphqlHttp = require("express-graphql");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const graphqlSchema = require("./graphql/schemas");
const graphqlResolvers = require("./graphql/resolvers");

app.use(
    "/graphql",
    graphqlHttp({
        schema: graphqlSchema,
        rootValue: graphqlResolvers,
        graphiql: true
    })
);

module.exports = app;
