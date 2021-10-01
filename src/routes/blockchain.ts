import { app } from '..';
import { BlockchainName, blockchains } from '../types/Blockchain';
import { Blockchain } from '../types/routes/Blockchain';
import { logger } from '../utils/logger';

app.post('/api/v1/blockchain', async (req, res) => {
    try {
        const { blockchain: blockchainNameText } = req.body;
        if (!blockchainNameText)
            return res.status(400).send('Missing blockchain');
        if (!(blockchainNameText in blockchains))
            return res.status(400).send('Invalid blockchain');
        return res.status(200).send({
            blockchain: blockchains[blockchainNameText as BlockchainName],
        } as Blockchain);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
