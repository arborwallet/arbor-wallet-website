import { Address } from 'chia-tools';
import { app, fullNodes } from '..';
import { ForkName, forks } from '../types/Fork';
import { Balance } from '../types/routes/Balance';
import { logger } from '../utils/logger';

app.post('/api/v1/balance', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) return res.status(400).send('Missing address');
        if (typeof addressText !== 'string')
            return res.status(400).send('Invalid address');
        const address = new Address(addressText);
        if (!(address.prefix in forks))
            return res.status(400).send('Invalid address prefix');
        const result = await fullNodes[
            address.prefix as ForkName
        ].getCoinRecordsByPuzzleHash(
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
