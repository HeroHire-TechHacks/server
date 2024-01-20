const mongoose = require('mongoose');
const { errorLogger } = require('./logErrors');

const { MONGO_URI } = process.env;

const connectDB = async () => {
	try {
		await mongoose.connect(MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB connected');
	} catch (err) {
		errorLogger(err);
		process.exit(1);
	}
};

module.exports = {
	connectDB,
};
