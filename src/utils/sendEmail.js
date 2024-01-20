const sgMail = require('@sendgrid/mail');
const { errorLogger } = require('./logErrors');

const templates = {
	emailVerification: (userEmail, otpCode) => ({
		to: userEmail,
		from: process.env.FROM_EMAIL,
		subject: 'HeroHire Login OTP',
		text: 'HeroHire Login OTP',
		html: `Hi!
		<br/>
		<br/>
		Your OTP for HeroHire is ${otpCode}.
		<br />
		<br />
		To report any issues, please reply to this email. If you did not request this email, please ignore it.
		<br/>
		<br/>
		Regards
		<br/>
		Team HeroHire
		<br/>
		<a href="https://herohire.xyz">herohire.xyz</a>
	`,
	}),
};

let isApiKeySet = false;

const sendEmail = async (userEmail, otpCode) => {
	try {
		// set api key only once for the entire app lifecycle
		if (!isApiKeySet) {
			sgMail.setApiKey(process.env.SENDGRID_API_KEY);
			isApiKeySet = true;
		}

		const response = await sgMail.send(
			templates.emailVerification(userEmail, otpCode)
		);

		if (
			!response ||
			!response[0] ||
			!response[0].statusCode ||
			response[0].statusCode !== 202
		) {
			throw new Error('Error sending email');
		}

		return true;
	} catch (err) {
		errorLogger(err);

		return false;
	}
};

module.exports = { sendEmail };
