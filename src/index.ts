import dotenv from 'dotenv';
import express from 'express';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

// Sets up the express application instance with middleware.
const app = express();
app.use(loggerMiddleware);

app.get('/', (req, res) => {
    res.status(200).send('Nothing to see here.');
});

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
