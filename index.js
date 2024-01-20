require('dotenv').config({
	path: `.env.${process.env.NODE_ENV}`,
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { rateLimiter } = require('./src/utils/rateLimitMiddleware');
const { errorLogger } = require('./src/utils/logErrors');
const { connectDB } = require('./src/utils/mongoUtils');
const {
	networkLoggerMiddleware,
} = require('./src/utils/networkLoggerMiddleware');
const {
	getUserByEmail,
	createNewUser,
	updateUser,
} = require('./src/dals/users');
const { generateOTP } = require('./src/utils/randomStringGenerator');
const Otp = require('./src/schema/otps');
const { sendEmail } = require('./src/utils/sendEmail');
const { verifyAuth } = require('./src/utils/authMiddleware');
const { createMeet, startMeet, endMeet } = require('./src/dals/meets');
const {
	conversationLimitMiddleware,
} = require('./src/utils/conversationLimitMiddleware');
const {
	generateFirstMessage,
	saveUserConversation,
	generateNextMessage,
} = require('./src/dals/conversation');

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.set('trust proxy', 1);
app.use(
	morgan(
		':date[iso] :remote-addr :method :url :status :res[content-length] - :response-time ms'
	)
);
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

networkLoggerMiddleware(app);

connectDB();

// Routes

app.use('/favicon.ico', (req, res) => {
	res.status(204).end();
});

app.use(rateLimiter);

app.get('/', (_, res) => {
	res.json({
		error: false,
		message: 'Welcome to the HeroHire!',
		data: null,
	});
});

app.post('/login', async (req, res) => {
	let { email, name } = req.body;

	email = typeof email === 'string' && email?.trim().toLowerCase();

	// regex validate email
	const emailRegex = /\S+@\S+\.\S+/;

	if (!emailRegex.test(email)) {
		return res.status(400).json({
			error: true,
			message: 'Invalid email',
			data: null,
		});
	}

	if (!email) {
		return res.status(400).json({
			error: true,
			message: 'Email is required',
			data: null,
		});
	}

	if (email.length < 5 || email.length > 50) {
		return res.status(400).json({
			error: true,
			message: 'Invalid email',
			data: null,
		});
	}

	name = typeof name === 'string' && name?.trim();

	if (!name) {
		return res.status(400).json({
			error: true,
			message: 'Name is required',
			data: null,
		});
	}

	if (name.length < 3 || name.length > 30) {
		return res.status(400).json({
			error: true,
			message: 'Invalid name',
			data: null,
		});
	}

	const userResponse = await getUserByEmail(email);

	if (userResponse.error) {
		return res.status(500).json(userResponse);
	}

	const user = userResponse.data;

	if (!user) {
		const newUserResponse = await createNewUser(email, name);

		if (newUserResponse.error) {
			return res.status(400).json(newUserResponse);
		}

		const otpCode = await generateOTP(6);

		const saveOtpInDb = await Otp.create({
			email,
			otp: otpCode,
		});

		if (!saveOtpInDb) {
			return res.status(400).json({
				error: true,
				message: 'Some error! Please try again later.',
				data: null,
			});
		}

		sendEmail(email, otpCode);

		return res.status(200).json({
			error: false,
			message: 'Success',
			data: 'email_sent',
		});
	} else {
		if (user.verified) {
			const updatedUserResponse = await updateUser(email, name, user.verified);

			if (updatedUserResponse.error) {
				return res.status(400).json(updatedUserResponse);
			}

			const updatedUser = updatedUserResponse.data;

			return res.status(200).json({
				error: false,
				message: 'Success',
				data: updatedUser.userToken,
			});
		} else {
			// user exists but not verified
			// check if email was sent in last 10 minutes
			const checkOtpResponse = await Otp.findOne({
				email,
				createdAt: {
					$gte: new Date(Date.now() - 10 * 60 * 1000),
				},
			});

			if (checkOtpResponse) {
				return res.status(400).json({
					error: false,
					message: 'Email already sent',
					data: 'email_already_sent',
				});
			}

			const otpCode = await generateOTP(6);

			const saveOtpInDb = await Otp.create({
				email,
				otp: otpCode,
			});

			if (!saveOtpInDb) {
				return res.status(400).json({
					error: true,
					message: 'Some error! Please try again later.',
					data: null,
				});
			}

			sendEmail(email, otpCode);

			return res.status(200).json({
				error: false,
				message: 'Success',
				data: 'email_sent',
			});
		}
	}
});

app.post('/verify-otp', async (req, res) => {
	let { email, otp } = req.body;

	otp = typeof otp === 'string' && otp?.trim();

	if (!otp || otp.length !== 6) {
		return res.status(400).json({
			error: true,
			message: 'OTP is invalid',
			data: null,
		});
	}

	email = typeof email === 'string' && email?.trim().toLowerCase();

	// regex validate email
	const emailRegex = /\S+@\S+\.\S+/;

	if (!email || !emailRegex.test(email)) {
		return res.status(400).json({
			error: true,
			message: 'Invalid email',
			data: null,
		});
	}

	const userResponse = await getUserByEmail(email);

	if (userResponse.error) {
		return res.status(500).json(userResponse);
	}

	const user = userResponse.data;

	if (!user) {
		return res.status(200).json({
			error: true,
			message: 'Invalid Email',
			data: null,
		});
	}

	if (user.verified) {
		return res.status(400).json({
			error: true,
			data: null,
			message: 'User already verified',
		});
	}

	// get latest otp from the records by createdAt
	const latestOtp = await Otp.findOne({
		email,
	}).sort({ createdAt: -1 });

	if (!latestOtp) {
		return res.status(400).json({
			error: true,
			message: 'OTP is invalid or expired. Please try again.',
			data: null,
		});
	}

	if (latestOtp.otp !== otp) {
		return res.status(400).json({
			error: true,
			message: 'OTP is invalid or expired. Please try again.',
			data: null,
		});
	}

	// update user verified to true

	const updateUserToVerifiedResponse = await updateUser(email, user.name, true);

	if (updateUserToVerifiedResponse.error) {
		return res.status(400).json(updateUserToVerifiedResponse);
	}

	return res.status(200).json({
		error: false,
		message: 'User verified',
		data: user.userToken,
	});
});

app.get('/details', verifyAuth, async (_, res) => {
	return res.status(200).json({
		error: false,
		message: 'Success',
		data: jobDetails,
	});
});

app.post('/create-meet', verifyAuth, async (req, res) => {
	const userId = req.user.id;

	const meetDetailsResponse = await createMeet(userId);

	if (meetDetailsResponse.error) {
		return res.status(400).json({
			error: true,
			message: 'Some error! Please try again later.',
			data: null,
		});
	}

	const meetDetails = meetDetailsResponse.data;

	return res.status(200).json({
		error: false,
		message: 'Success',
		data: meetDetails.meetCode,
	});
});

app.post('/end-meet', verifyAuth, async (req, res) => {
	const userId = req.user.id;
	let { meetCode, meetEndReason } = req.body;

	meetCode = typeof meetCode === 'string' && meetCode?.trim();

	meetEndReason = typeof meetEndReason === 'string' && meetEndReason.trim();

	if (!meetCode) {
		return res.status(400).json({
			error: true,
			message: 'Some error. Please try again later.',
			data: null,
		});
	}

	if (!meetEndReason) {
		return res.status(400).json({
			error: true,
			message: 'Meet end reason is required.',
			data: null,
		});
	}

	const meetDetailsResponse = await endMeet(userId, meetCode, meetEndReason);

	if (meetDetailsResponse.error) {
		return res.status(400).json(meetDetailsResponse);
	}

	return res.status(200).json({
		error: false,
		message: 'Success',
		data: null,
	});
});

app.post('/start-meet', verifyAuth, async (req, res) => {
	let { meetCode } = req.body;

	meetCode = typeof meetCode === 'string' && meetCode?.trim();

	if (!meetCode) {
		return res.status(400).json({
			error: true,
			message: 'Some error. Please try again later.',
			data: null,
		});
	}

	const response = await startMeet(req.user, meetCode);

	return res.status(response.error ? 400 : 200).json(response);
});

app.post(
	'/first-message',
	[verifyAuth, conversationLimitMiddleware],
	async (req, res) => {
		let { meetCode } = req.body;

		meetCode = typeof meetCode === 'string' && meetCode?.trim();

		if (!meetCode) {
			return res.status(400).json({
				error: true,
				message: 'Some error. Please try again later.',
				data: null,
			});
		}

		const response = await generateFirstMessage(req.user, meetCode);

		return res.status(response.error ? 400 : 200).json(response);
	}
);

app.post('/save-conversation', verifyAuth, async (req, res) => {
	let { base64Audio, meetCode } = req.body;
	const user = req.user;

	base64Audio = typeof base64Audio === 'string' && base64Audio?.trim();
	meetCode = typeof meetCode === 'string' && meetCode?.trim();

	if (!meetCode) {
		return res.status(400).json({
			error: true,
			message: 'Some error. Please try again later.',
			data: null,
		});
	}

	if (!base64Audio) {
		return res.status(400).json({
			error: true,
			message: 'Audio is required.',
			data: null,
		});
	}

	const response = await saveUserConversation(user, meetCode, base64Audio);

	return res.status(response.error ? 400 : 200).json(response);
});

app.post(
	'/next-message',
	[verifyAuth, conversationLimitMiddleware],
	async (req, res) => {
		let { meetCode } = req.body;

		meetCode = typeof meetCode === 'string' && meetCode?.trim();

		if (!meetCode) {
			return res.status(400).json({
				error: true,
				message: 'Some error. Please try again later.',
				data: null,
			});
		}

		const response = await generateNextMessage(req.user, meetCode);

		return res.status(response.error ? 400 : 200).json(response);
	}
);

app.use((err, _req, res, _next) => {
	errorLogger(err);
	res.status(500).json({
		error: true,
		data: null,
		message: 'Some error! Please try again later.',
	});
});

const { PORT } = process.env;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
