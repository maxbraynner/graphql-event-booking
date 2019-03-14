require("dotenv").config();

const express = require("express");
const cors = require("cors");
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

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

            type User {
                _id: ID!
                email: String!
                password: String
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            input UserInput {
                email: String!
                password: String!
            }

            type RootQuery {
                events: [Event!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput): Event
                createUser(userInput: UserInput): User
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
                const userId = "5c89b4604562c03d55d8bb67";

                try {
                    const { eventInput } = args;

                    const user = await User.findById(userId);

                    if (!user) {
                        throw new Error("User do not exists");
                    }

                    const event = new Event({
                        title: eventInput.title,
                        description: eventInput.description,
                        price: eventInput.price,
                        date: new Date(eventInput.date),
                        creator: user._id
                    });

                    const result = await event.save();

                    user.createdEvents.push(event);
                    await user.save();

                    return result;
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            },
            createUser: async args => {
                try {
                    const { userInput } = args;

                    const hasUser = await User.findOne({
                        email: userInput.email
                    });

                    if (hasUser) {
                        throw new Error("User exists already!");
                    }

                    const hash = await bcrypt.hash(userInput.password, 8);
                    const user = new User({
                        email: userInput.email,
                        password: hash
                    });

                    const result = await user.save();
                    return { email: result.email, _id: result._id };
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
