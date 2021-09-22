import { Seed } from 'chia-tools';
import { app } from '..';
import { Recover } from '../types/routes/Recover';
import { logger } from '../utils/logger';

app.post('/api/v1/recover', async (req, res) => {
    try {
        const { phrase } = req.body;
        if (!phrase) return res.status(400).send('Missing phrase');
        if (typeof phrase !== 'string' || !/[a-z]+(?: [a-z]+){11}/.test(phrase))
            return res.status(400).send('Invalid phrase');
        const seed = await Seed.from(phrase);
        const privateKey = seed.getPrivateKey();
        const publicKey = privateKey.getPublicKey();
        res.status(200).send({
            phrase,
            private_key: privateKey.toString(),
            public_key: publicKey.toString(),
        } as Recover);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not recover keypair');
    }
});
