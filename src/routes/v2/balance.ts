import { Address } from 'chia-tools';
import { app, blockchains, fullNodes } from '../..';
import { logger } from '../../utils/logger';

interface Balance {
    balance: number;
}

app.post('/api/v2/balance', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) return res.status(400).send('Missing address');
        if (typeof addressText !== 'string')
            return res.status(400).send('Invalid address');
        const address = new Address(addressText);
        if (!(address.prefix in blockchains))
            return res.status(400).send('Invalid blockchain');
        if (!(address.prefix in fullNodes))
            return res.status(400).send('Unimplemented blockchain');
        const result = await fullNodes[
            address.prefix
        ]!.getCoinRecordsByPuzzleHash(
            address.toHash().toString(),
            undefined,
            undefined,
            true
        );
        if (!result.success)
            return res.status(500).send('Could not fetch coin records');
        res.status(200).send({
            balance: result.coin_records
                .filter((record) => !record.spent)
                .map((record) => +record.coin.amount)
                .reduce((a, b) => a + b, 0),
        } as Balance);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not fetch balance');
    }
});
