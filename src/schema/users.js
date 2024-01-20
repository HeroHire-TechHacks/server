const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		userToken: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		verified: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('User', userSchema);
