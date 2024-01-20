const generateRandomString = async (length) => {
	const { customAlphabet } = await import('nanoid');
	const nanoid = customAlphabet(
		'1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
		length
	);

	return nanoid();
};

const generateOTP = async (length) => {
	const { customAlphabet } = await import('nanoid');
	const nanoid = customAlphabet('0123456789', length);

	return nanoid();
};

module.exports = {
	generateRandomString,
	generateOTP,
};
