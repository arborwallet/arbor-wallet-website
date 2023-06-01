import { FullNode } from 'chia-rpc';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { BlockchainInfo } from './types/Blockchain';
import { withHomeDirectory } from './utils/home';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

const DISCORD_INVITE = process.env.DISCORD_INVITE!;
if (!DISCORD_INVITE) throw new Error('Missing `DISCORD_INVITE` environment variable.');

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

// Starts clients for each blockchain to interact with.
export const fullNodes: Partial<Record<string, FullNode>> = {};
export const blockchains: Record<string, BlockchainInfo> = {};
export const sourceDir = __dirname;
export const blockchainFile = path.join(sourceDir, '..', 'blockchains.json');
export const routeDir = path.join(sourceDir, 'routes');

for (let [rootPath, blockchain] of Object.entries(
    JSON.parse(fs.readFileSync(blockchainFile, 'utf8'))
) as [string, any][]) {
    rootPath = withHomeDirectory(rootPath);
    const blockchainInfo: BlockchainInfo = blockchain;
    blockchains[blockchainInfo.ticker] = blockchainInfo;
    fullNodes[blockchainInfo.ticker] = new FullNode(rootPath);
}

// Requires all of the routes.
for (const version of fs.readdirSync(routeDir)) {
    if (!/^v[0-9]+$/.test(version)) continue;
    for (const file of fs.readdirSync(path.join(routeDir, version))) {
        if (!/\.js$/.test(file)) continue;
        require(path.resolve(routeDir, version, file));
    }
}

app.get('/discord', (_req, res) =>
    res.redirect(DISCORD_INVITE)
);

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
