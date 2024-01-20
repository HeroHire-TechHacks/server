const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetSchema = new Schema(
	{
		userId: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		meetCode: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		startTimeEpoch: {
			type: Number,
			default: null,
		},
		endTimeEpoch: {
			type: Number,
			default: null,
		},
		meetEndReason: {
			type: String,
			default: null,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Meet', meetSchema);
