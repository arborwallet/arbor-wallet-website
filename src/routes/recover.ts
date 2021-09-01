import {
    generatePrivateKey,
    generatePublicKey,
    toHex,
    toSeed,
} from 'chia-tools';
import { app } from '..';
import { Result } from '../types/Result';
import { Recover } from '../types/routes/Recover';
import { logger } from '../utils/logger';

app.post('/api/v1/recover', async (req, res) => {
    try {
        const { phrase } = req.body;
        if (!phrase) {
            return res.status(200).send({
                success: false,
                error: 'Missing phrase',
            } as Result<Recover>);
        }
        if (
            typeof phrase !== 'string' ||
            !/[a-z]+(?: [a-z]+){11}/.test(phrase)
        ) {
            return res.status(200).send({
                success: false,
                error: 'Invalid phrase',
            } as Result<Recover>);
        }
        const seed = await toSeed(phrase);
        const privateKey = await generatePrivateKey(seed);
        const publicKey = generatePublicKey(privateKey);
        res.status(200).send({
            success: true,
            phrase,
            private_key: toHex(privateKey.serialize()),
            public_key: toHex(publicKey.serialize()),
        } as Result<Recover>);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(200).send({
            success: false,
            error: 'Could not recover keypair',
        } as Result<Recover>);
    }
});
