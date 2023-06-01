import { JacobianPoint } from 'chia-bls';
import { toAddress } from 'chia-rpc';
import { Program } from 'clvm-lib';
import { app, blockchains, fullNodes } from '../..';
import { logger } from '../../utils/logger';
import { walletPuzzle } from '../../utils/puzzles';

interface Address {
    address: string;
}

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

        const puzzle = walletPuzzle.curry([
            Program.fromJacobianPoint(JacobianPoint.fromHexG1(publicKeyText)),
        ]);
        const walletAddress = toAddress(puzzle.hash(), blockchainNameText);

        return res.status(200).send({
            address: walletAddress.toString(),
        } as Address);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
