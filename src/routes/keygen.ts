import { Seed } from 'chia-tools';
import { app } from '..';
import { Keygen } from '../types/routes/Keygen';
import { logger } from '../utils/logger';

app.get('/api/v1/keygen', async (_req, res) => {
    try {
        const mnemonic = Seed.mnemonic();
        const seed = await Seed.from(mnemonic);
        const privateKey = seed.getPrivateKey();
        const publicKey = privateKey.getPublicKey();
        res.status(200).send({
            phrase: mnemonic,
            private_key: privateKey.toString(),
            public_key: publicKey.toString(),
        } as Keygen);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate keypair');
    }
});
