import { FullNode } from 'chia-tools';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { ForkName } from './types/Fork';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

// Sets up the express application instance with middleware.
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(
    cors({
        origin: '*',
    })
);
app.use(express.static(path.resolve(__dirname, '..', 'static')));

// Starts clients for each fork to interact with their networks.
export const fullNodes: Partial<Record<ForkName, FullNode>> = {
    xch: new FullNode(),
};

// Requires all of the routes.
require('./routes/address');
require('./routes/balance');
require('./routes/fork');
require('./routes/forks');
require('./routes/keygen');
require('./routes/recover');
require('./routes/send');
require('./routes/transactions');

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
