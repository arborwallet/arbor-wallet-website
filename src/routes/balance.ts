import { addressInfo } from 'chia-tools';
import { app, fullNodes } from '..';
import { ForkName, forks } from '../types/Fork';
import { Result } from '../types/Result';
import { Balance } from '../types/routes/Balance';
import { logger } from '../utils/logger';

app.post('/api/v1/balance', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) {
            return res.status(200).send({
                success: false,
                error: 'Missing address',
            } as Result<Balance>);
        }
        if (typeof addressText !== 'string') {
            return res.status(200).send({
                success: false,
                error: 'Invalid address',
            } as Result<Balance>);
        }
        const address = addressInfo(addressText);
        if (!(address.prefix in forks)) {
            return res.status(200).send({
                success: false,
                error: 'Invalid address prefix',
            } as Result<Balance>);
        }
        const fork = forks[address.prefix as ForkName];
        const result = await fullNodes[
            address.prefix as ForkName
        ].getUnspentCoins(address.hash);
        if (!result.success) {
            return res.status(200).send({
                success: false,
                error: 'Could not fetch coin records',
            } as Result<Balance>);
        }
        res.status(200).send({
            success: true,
            balance: result.coin_records
                .map((record) => +record.coin.amount)
                .reduce((a, b) => a + b, 0),
            fork,
        } as Result<Balance>);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(200).send({
            success: false,
            error: 'Could not fetch balance',
        } as Result<Balance>);
    }
});
