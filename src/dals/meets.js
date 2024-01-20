const Meet = require('../schema/meets');
const { errorLogger } = require('../utils/logErrors');
const { generateRandomString } = require('../utils/randomStringGenerator');

const createMeet = async (userId) => {
	try {
		const meetCode = await generateRandomString(9);

		const meet = await Meet.create({
			userId,
			meetCode,
		});

		if (!meet) {
			return {
				error: true,
				message: 'Error creating meet.',
				data: null,
			};
		}

		return {
			error: false,
			message: 'Meet created successfully.',
			data: meet,
		};
	} catch (err) {
		errorLogger(err);
		return {
			error: true,
			message: 'Something went wrong.',
			data: null,
		};
	}
};

const endMeet = async (userId, meetCode, meetEndReason) => {
	try {
		const meet = await Meet.findOneAndUpdate(
			{
				userId,
				meetCode: meetCode,
			},
			{
				meetEndReason,
			},
			{
				new: true,
			}
		);

		if (!meet) {
			return {
				error: true,
				message: 'Meet not found.',
				data: null,
			};
		}

		return {
			error: false,
			message: 'Meet ended successfully.',
			data: meet,
		};
	} catch (err) {
		errorLogger(err);
		return {
			error: true,
			message: 'Something went wrong.',
			data: null,
		};
	}
};

const startMeet = async (user, meetCode) => {
	try {
		const meet = await Meet.findOne({
			userId: user.id,
			meetCode,
		});

		if (!meet) {
			return {
				error: true,
				message: 'Meet not found.',
				data: null,
			};
		}

		const updatedMeet = await Meet.findOneAndUpdate(
			{
				userId: user.id,
				meetCode,
			},
			{
				startTimeEpoch: Date.now(),
				endTimeEpoch: Date.now() + 1000 * 10 * 60,
			},
			{
				new: true,
			}
		);

		if (!updatedMeet) {
			return {
				error: true,
				message: 'Something went wrong.',
				data: null,
			};
		}

		return {
			error: false,
			message: 'Meet started successfully.',
			data: null,
		};
	} catch (err) {
		errorLogger(err);
		return {
			error: true,
			message: 'Something went wrong.',
			data: null,
		};
	}
};

module.exports = {
	createMeet,
	endMeet,
	startMeet,
};
