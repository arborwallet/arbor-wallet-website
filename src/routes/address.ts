import { Hash } from 'chia-tools';
import path from 'path';
import { app, blockchains, fullNodes } from '..';
import { Address } from '../types/routes/Address';
import { executeCommand } from '../utils/execute';
import { logger } from '../utils/logger';

app.post('/api/v1/address', async (req, res) => {
    try {
        const { public_key: publicKeyText, blockchain: blockchainNameText } =
            req.body;
        if (!publicKeyText) return res.status(400).send('Missing public_key');
        if (
            typeof publicKeyText !== 'string' ||
            !/[0-9a-f]{96}/.test(publicKeyText)
        )
            return res.status(400).send('Invalid public_key');
        if (!blockchainNameText)
            return res.status(400).send('Missing blockchain');
        if (!(blockchainNameText in blockchains))
            return res.status(400).send('Invalid blockchain');
        if (!(blockchainNameText in fullNodes))
            return res.status(400).send('Unimplemented blockchain');
        const result = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp.hex -a 0x${publicKeyText})"`
        );
        const walletHash = new Hash(result.split('\n')[0]);
        const walletAddress = walletHash.toAddress(blockchainNameText);
        return res.status(200).send({
            address: walletAddress.toString(),
        } as Address);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
