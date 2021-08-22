import { generateMnemonic, mnemonicToSeed } from 'bip39';
import loadBls from 'bls-signatures';
import dotenv from 'dotenv';
import express from 'express';
import { BLS } from './blsjs';
import { toHexString } from './utils/crypto';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

// BLS instance, there's some sort of typing issue that will need to be fixed later.
export const blsPromise: Promise<BLS> = (loadBls as any)();

// Sets up the express application instance with middleware.
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Generates a mnemonic phrase, public key, and private key.
app.get('/keygen', async (req, res) => {
    const bls = await blsPromise;
    const mnemonic = generateMnemonic();
    const seed = await mnemonicToSeed(mnemonic);
    const privateKey = bls.PrivateKey.fromSeed(seed);
    const publicKey = privateKey.getPublicKey();
    res.status(200).send({
        phrase: mnemonic,
        privateKey: toHexString([...privateKey.serialize()]),
        publicKey: toHexString([...publicKey.serialize()]),
    });
});

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
