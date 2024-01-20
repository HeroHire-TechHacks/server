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
