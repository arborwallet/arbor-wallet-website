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
export const fullNodes: Record<ForkName, FullNode> = {
    xch: new FullNode(),
};

// Requires all of the routes.
require('./routes/keygen');
require('./routes/wallet');
require('./routes/recover');
require('./routes/balance');
require('./routes/transactions');
require('./routes/send');

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
