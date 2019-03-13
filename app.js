const express = require("express");
const cors = require("cors");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const events =  [];

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
            events: () => events,
            createEvent: (args) => {
                const eventInput = args.eventInput;
                const event = {
                    _id: Math.random().toString(),
                    title: eventInput.title,
                    description: eventInput.description,
                    price: eventInput.price,
                    date: eventInput.date,
                }
                events.push(event);
                return event;
            }
        },
        graphiql: true
    })
);

app.listen(process.env.PORT || 4000);
