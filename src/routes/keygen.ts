import {
    generatePrivateKey,
    generatePublicKey,
    randomMnemonic,
    stringify,
    toSeed,
} from 'chia-tools';
import { app } from '..';
import { Result } from '../types/Result';
import { Keygen } from '../types/routes/Keygen';
import { logger } from '../utils/logger';

app.post('/api/v1/keygen', async (_req, res) => {
    try {
        const mnemonic = randomMnemonic();
        const seed = await toSeed(mnemonic);
        const privateKey = await generatePrivateKey(seed);
        const publicKey = generatePublicKey(privateKey);
        res.status(200).send({
            success: true,
            phrase: mnemonic,
            private_key: stringify(privateKey),
            public_key: stringify(publicKey),
        } as Result<Keygen>);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(200).send({
            success: false,
            error: 'Could not generate keypair',
        } as Result<Keygen>);
    }
});
