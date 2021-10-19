import { Seed } from 'chia-tools';
import { app } from '../..';
import { logger } from '../../utils/logger';

interface Recover {
    phrase: string;
    private_key: string;
    public_key: string;
}

app.post('/api/v1/recover', async (req, res) => {
    let privateKey, publicKey;
    try {
        const { phrase } = req.body;
        if (!phrase) return res.status(400).send('Missing phrase');
        if (typeof phrase !== 'string' || !/[a-z]+(?: [a-z]+){11}/.test(phrase))
            return res.status(400).send('Invalid phrase');
        const seed = await Seed.from(phrase);
        privateKey = seed.getPrivateKey();
        publicKey = privateKey.getPublicKey();
        const response = {
            phrase,
            private_key: privateKey.toString(),
            public_key: publicKey.toString(),
        } as Recover;
        privateKey.delete();
        publicKey.delete();
        res.status(200).send(response);
    } catch (error) {
        if (privateKey) privateKey.delete();
        if (publicKey) publicKey.delete();
        logger.error(`${error}`);
        return res.status(500).send('Could not recover keypair');
    }
});
