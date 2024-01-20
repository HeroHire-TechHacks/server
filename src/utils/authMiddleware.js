const { getUserByUserToken } = require('../dals/users');
const { errorLogger } = require('./logErrors');

const verifyAuth = async (req, res, next) => {
	try {
		let userToken = req.headers['x-auth-token'];

		userToken = typeof userToken === 'string' && userToken?.trim();

		if (!userToken) {
			return res.status(400).json({
				error: true,
				message: 'Unauthorized',
				data: null,
			});
		}

		// find the user by userToken

		const userResponse = await getUserByUserToken(userToken);

		if (userResponse.error) {
			return res.status(400).json(userResponse);
		}

		const user = userResponse.data;

		if (!user) {
			return res.status(400).json({
				error: true,
				message: 'Unauthorized',
				data: null,
			});
		}

		req.user = user;

		next();
	} catch (err) {
		errorLogger(err);

		return res.status(500).json({
			error: true,
			message: 'Something went wrong.',
			data: null,
		});
	}
};

module.exports = { verifyAuth };
