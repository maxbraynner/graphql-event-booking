const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");

const findUser = async userId => {
    const user = await User.findById(userId);

    return {
        ...user._doc,
        password: null,
        createdEvents: findEvents.bind(this, user.createdEvents)
    };
};

const findEvents = async eventsId => {
    const events = await Event.find({
        _id: {
            $in: eventsId
        }
    });

    return events.map(event => ({
        ...event._doc,
        date: new Date(event.date).toISOString(),
        creator: findUser.bind(this, event.creator)
    }));
};

module.exports = {
    events: async () => {
        const events = await Event.find();
        return events.map(event => ({
            ...event._doc,
            date: new Date(event.date).toISOString(),
            creator: findUser.bind(this, event.creator)
        }));
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

            return {
                ...result._doc,
                creator: {
                    ...user._doc,
                    password: null,
                    createdEvents: findEvents.bind(this, user.createdEvents)
                }
            };
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
};
