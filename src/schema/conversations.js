const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
	{
		meetId: {
			type: Schema.Types.ObjectId,
			ref: 'Meet',
			required: true,
		},
		userType: {
			type: String,
			enum: ['user', 'bot'],
			required: true,
		},
		conversationText: {
			type: String,
			required: true,
			trim: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Conversation', conversationSchema);
