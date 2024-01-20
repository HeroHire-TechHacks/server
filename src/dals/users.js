const User = require('../schema/users');
const { errorLogger } = require('../utils/logErrors');
const { generateRandomString } = require('../utils/randomStringGenerator');

const getUserByEmail = async (email) => {
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return {
				error: false,
				message: 'no_user_found',
				data: null,
			};
		}

		return {
			error: false,
			message: 'user_found',
			data: user,
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

const getUserByUserToken = async (userToken) => {
	try {
		const user = await User.findOne({ userToken });

		if (!user) {
			return {
				error: false,
				message: 'no_user_found',
				data: null,
			};
		}

		return {
			error: false,
			message: 'user_found',
			data: user,
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

const createNewUser = async (email, name) => {
	try {
		const userToken = await generateRandomString(12);

		const user = await User.create({
			email,
			userToken,
			name,
		});

		if (user) {
			return {
				error: false,
				data: user,
				message: 'User created successfully',
			};
		}

		return {
			error: true,
			data: null,
			message: 'Error creating user',
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

const updateUser = async (email, name, verified) => {
	try {
		// find the user by email and update it and return the updated user.

		const updatedUser = await User.findOneAndUpdate(
			{ email },
			{
				$set: {
					name,
					verified,
				},
			},
			{
				new: true,
			}
		);

		if (updatedUser) {
			return {
				error: false,
				message: 'User updated successfully',
				data: updatedUser,
			};
		}

		return {
			error: true,
			message: 'Error updating user',
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
	getUserByEmail,
	createNewUser,
	getUserByUserToken,
	updateUser,
};
