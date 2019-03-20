const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");
const Booking = require("../../models/booking");

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

const findSingleEvent = async eventId => {
    const event = await Event.findById(eventId);
    return {
        ...event._doc,
        date: new Date(event.date).toISOString(),
        creator: findUser.bind(this, event.creator)
    };
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
    bookings: async () => {
        const userId = "5c89b4604562c03d55d8bb67";

        const bookings = await Booking.find();

        return bookings.map(booking => ({
            ...booking._doc,
            user: findUser.bind(this, userId),
            event: findSingleEvent.bind(this, booking.event),
            createdAt: new Date(booking.createdAt).toISOString(),
            updatedAt: new Date(booking.updatedAt).toISOString()
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
    },
    bookEvent: async args => {
        const { eventId } = args;
        const userId = "5c89b4604562c03d55d8bb67";

        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        const booking = new Booking({
            event: eventId,
            user: userId
        });

        const result = await booking.save();
        return {
            ...result._doc,
            user: findUser.bind(this, userId),
            event: findSingleEvent.bind(this, eventId),
            createdAt: new Date(result.createdAt).toISOString(),
            updatedAt: new Date(result.updatedAt).toISOString()
        };
    },
    cancelBooking: async args => {
        const { bookingId } = args;

        const booking = await Booking.findById(bookingId).populate("event");
        
        if (!booking) {
            throw new Error("Booking not found");
        }

        await Booking.deleteOne({ _id: booking.id });

        const event = booking.event;
        return {
            ...event._doc,
            date: new Date(event.date).toISOString(),
            creator: findUser.bind(this, event.creator)
        };
    }
};
