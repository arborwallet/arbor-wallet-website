import { Seed } from 'chia-tools';
import { app } from '../..';
import { logger } from '../../utils/logger';

interface Keygen {
    phrase: string;
    private_key: string;
    public_key: string;
}

app.get('/api/v1/keygen', async (_req, res) => {
    let privateKey, publicKey;
    try {
        const mnemonic = Seed.mnemonic();
        const seed = await Seed.from(mnemonic);
        privateKey = seed.getPrivateKey();
        publicKey = privateKey.getPublicKey();
        const response = {
            phrase: mnemonic,
            private_key: privateKey.toString(),
            public_key: publicKey.toString(),
        } as Keygen;
        privateKey.delete();
        publicKey.delete();
        res.status(200).send(response);
    } catch (error) {
        if (privateKey) privateKey.delete();
        if (publicKey) publicKey.delete();
        logger.error(`${error}`);
        return res.status(500).send('Could not generate keypair');
    }
});
