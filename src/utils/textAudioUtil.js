const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const { errorLogger } = require('./logErrors');
const { openai, getOpenAIClient } = require('./openai');

let textToSpeechClient = null;
let speechClient = null;

const initializeTextToSpeechClient = () => {
	textToSpeechClient = new textToSpeech.TextToSpeechClient();
};

const initializeSpeechClient = () => {
	speechClient = new speech.SpeechClient();
};

const getTextToSpeechClient = () => {
	if (!textToSpeechClient) {
		initializeTextToSpeechClient();
	}

	return textToSpeechClient;
};

const getSpeechClient = () => {
	if (!speechClient) {
		initializeSpeechClient();
	}

	return speechClient;
};

const convertTextToAudio = async (text) => {
	try {
		const client = getTextToSpeechClient();

		const request = {
			input: { text },
			voice: {
				languageCode: 'en-IN',
				ssmlGender: 'MALE',
				name: 'en-IN-Neural2-B',
			},
			audioConfig: { audioEncoding: 'MP3' },
		};

		const [response] = await client.synthesizeSpeech(request);

		if (!response || !response.audioContent) {
			throw new Error('Error converting text to audio.');
		}

		const base64Audio = response.audioContent.toString('base64');

		return base64Audio;
	} catch (err) {
		errorLogger(err);

		return null;
	}
};

const convertAudioToText = async (base64Audio) => {
	try {
		const client = getSpeechClient();

		const audio = {
			content: base64Audio,
		};

		const config = {
			enableAutomaticPunctuation: false,
			encoding: 'WEBM_OPUS',
			languageCode: 'en-IN',
			model: 'default',
			sampleRateHertz: 48000,
		};

		const request = {
			audio: audio,
			config: config,
		};

		const [response] = await client.recognize(request);

		if (
			!response ||
			!response.results[0] ||
			!response.results[0].alternatives[0] ||
			!response.results[0].alternatives[0].transcript
		) {
			throw new Error('Error converting audio to text.');
		}

		return response.results[0].alternatives[0].transcript;
	} catch (err) {
		errorLogger(err);

		return null;
	}
};

module.exports = {
	convertTextToAudio,
	convertAudioToText,
};
