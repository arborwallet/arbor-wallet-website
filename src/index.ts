import dotenv from 'dotenv';
import express from 'express';
import os from 'os';
import path from 'path';
import { ForkName } from './types/Fork';
import { logger, loggerMiddleware } from './utils/logger';
import { FullNode } from './utils/rpc';

// Reads the environment variables from the .env file.
dotenv.config();

// Sets up the express application instance with middleware.
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Home directories for each fork network.
export const networkHomes: Record<ForkName, string> = {
    xch: process.env.CHIA_HOME ?? path.join(os.homedir(), '.chia'),
};

// Starts clients for each fork to interact with their networks.
export const fullNodes: Record<ForkName, FullNode> = {
    xch: new FullNode({
        certPath: path.join(
            networkHomes.xch,
            'mainnet',
            'config',
            'ssl',
            'full_node',
            'private_full_node.crt'
        ),
        keyPath: path.join(
            networkHomes.xch,
            'mainnet',
            'config',
            'ssl',
            'full_node',
            'private_full_node.key'
        ),
    }),
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
