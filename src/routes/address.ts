import { Hash } from 'chia-tools';
import path from 'path';
import { app, fullNodes } from '..';
import { networks } from '../types/Network';
import { Address } from '../types/routes/Address';
import { executeCommand } from '../utils/execute';
import { logger } from '../utils/logger';

app.post('/api/v1/address', async (req, res) => {
    try {
        const { public_key: publicKeyText, network: networkNameText } =
            req.body;
        if (!publicKeyText) return res.status(400).send('Missing public_key');
        if (
            typeof publicKeyText !== 'string' ||
            !/[0-9a-f]{96}/.test(publicKeyText)
        )
            return res.status(400).send('Invalid public_key');
        if (!networkNameText) return res.status(400).send('Missing network');
        if (!(networkNameText in networks))
            return res.status(400).send('Invalid network');
        if (!(networkNameText in fullNodes))
            return res.status(400).send('Unimplemented network');
        const result = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp.hex -a 0x${publicKeyText})"`
        );
        const walletHash = new Hash(result.split('\n')[0]);
        const walletAddress = walletHash.toAddress(networkNameText);
        return res.status(200).send({
            address: walletAddress.toString(),
        } as Address);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
