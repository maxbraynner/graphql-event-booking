require("dotenv").config();

const express = require("express");
const cors = require("cors");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");

const Event = require("./models/event");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
    "/graphql",
    graphqlHttp({
        schema: buildSchema(`
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput): Event
            }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: async () => {
                return await Event.find();
            },
            createEvent: async args => {
                const { eventInput } = args;
                const event = new Event({
                    title: eventInput.title,
                    description: eventInput.description,
                    price: eventInput.price,
                    date: new Date(eventInput.date)
                });

                try {
                    return await event.save();
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            }
        },
        graphiql: true
    })
);

(async () => {
    try {
        const { PORT } = process.env;

        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true
        });
        await app.listen(PORT || 4000);

        console.log(`Listening on port ${PORT}`);
    } catch (error) {
        console.error(err);
    }
})();
