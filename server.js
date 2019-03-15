const mongoose = require("mongoose");
const app = require("./app");

(async () => {
    try {
        const { PORT, MONGO_URL } = process.env;

        await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true
        });
        await app.listen(PORT || 4000);

        console.log(`Listening on port ${PORT}`);
    } catch (error) {
        console.error(err);
    }
})();