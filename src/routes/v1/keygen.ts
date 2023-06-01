import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { PrivateKey } from 'chia-bls';
import { app } from '../..';
import { logger } from '../../utils/logger';

interface Keygen {
    phrase: string;
    private_key: string;
    public_key: string;
}

app.get('/api/v1/keygen', async (_req, res) => {
    try {
        const mnemonic = generateMnemonic();
        const seed = mnemonicToSeedSync(mnemonic);
        const privateKey = PrivateKey.fromSeed(seed);
        const publicKey = privateKey.getG1();

        const response = {
            phrase: mnemonic,
            private_key: privateKey.toHex(),
            public_key: publicKey.toHex(),
        } as Keygen;

        res.status(200).send(response);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate keypair');
    }
});
