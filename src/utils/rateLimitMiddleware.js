const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 60 minutes
	max: 60,
	standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: {
		error: true,
		message: 'Rate limit reached',
		data: null,
	},
});

module.exports = {
	rateLimiter,
};
