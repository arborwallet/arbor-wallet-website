import { mnemonicToSeedSync } from 'bip39';
import { PrivateKey } from 'chia-bls';
import { app } from '../..';
import { logger } from '../../utils/logger';

interface Recover {
    phrase: string;
    private_key: string;
    public_key: string;
}

app.post('/api/v1/recover', async (req, res) => {
    try {
        const { phrase } = req.body;

        if (!phrase) return res.status(400).send('Missing phrase');

        if (typeof phrase !== 'string' || !/[a-z]+(?: [a-z]+){11}/.test(phrase))
            return res.status(400).send('Invalid phrase');

        const seed = mnemonicToSeedSync(phrase);
        const privateKey = PrivateKey.fromSeed(seed);
        const publicKey = privateKey.getG1();

        const response = {
            phrase,
            private_key: privateKey.toString(),
            public_key: publicKey.toString(),
        } as Recover;

        res.status(200).send(response);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not recover keypair');
    }
});
