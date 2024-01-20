require('dotenv').config({
	path: `.env.${process.env.NODE_ENV}`,
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');

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

// Routes

app.use('/favicon.ico', (req, res) => {
	res.status(204).end();
});

app.get('/', (_, res) => {
	res.json({
		error: false,
		message: 'Welcome to the HeroHire!',
		data: null,
	});
});

const { PORT } = process.env;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
