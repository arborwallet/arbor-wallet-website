import { app, blockchains, fullNodes } from '../..';
import { logger } from '../../utils/logger';

interface Transaction {
    status: 'success';
}

app.post('/api/v2/transaction', async (req, res) => {
    try {
        const { spend_bundle: spendBundle, blockchain } = req.body;
        if (!spendBundle) return res.status(400).send('Missing spend_bundle');
        if (!blockchain) return res.status(400).send('Missing blockchain');
        if (!(blockchain in blockchains))
            return res.status(400).send('Invalid blockchain');
        if (!(blockchain in fullNodes))
            return res.status(400).send('Unimplemented blockchain');
        const result = await fullNodes[blockchain]!.pushTx(spendBundle);
        if (!result.success)
            return res.status(500).send('Could not push transaction');
        res.status(200).send({
            status: 'success',
        } as Transaction);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not send transaction');
    }
});
