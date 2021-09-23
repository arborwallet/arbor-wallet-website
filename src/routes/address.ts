import { Hash } from 'chia-tools';
import path from 'path';
import { app } from '..';
import { forks } from '../types/Fork';
import { Address } from '../types/routes/Address';
import { executeCommand } from '../utils/execute';
import { logger } from '../utils/logger';

app.post('/api/v1/address', async (req, res) => {
    try {
        const { public_key: publicKeyText, fork: forkNameText } = req.body;
        if (!publicKeyText) return res.status(400).send('Missing public_key');
        if (
            typeof publicKeyText !== 'string' ||
            !/[0-9a-f]{96}/.test(publicKeyText)
        )
            return res.status(400).send('Invalid public_key');
        if (!forkNameText) return res.status(400).send('Missing fork');
        if (!(forkNameText in forks))
            return res.status(400).send('Invalid fork');
        const result = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp.hex -a 0x${publicKeyText})"`
        );
        const walletHash = new Hash(result.split('\n')[0]);
        const walletAddress = walletHash.toAddress(forkNameText);
        return res.status(200).send({
            address: walletAddress.toString(),
        } as Address);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
