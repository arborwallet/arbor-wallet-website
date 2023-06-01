import { toHex } from 'chia-bls';
import { addressInfo } from 'chia-rpc';
import { app, blockchains, fullNodes } from '../..';
import { logger } from '../../utils/logger';

interface Records {
    records: CoinRecord[];
}

app.post('/api/v2/records', async (req, res) => {
    try {
        const { address: addressText } = req.body;

        if (!addressText) return res.status(400).send('Missing address');

        if (typeof addressText !== 'string')
            return res.status(400).send('Invalid address');
        
        const address = addressInfo(addressText);

        if (!(address.prefix in blockchains))
            return res.status(400).send('Invalid blockchain');
        
        if (!(address.prefix in fullNodes))
            return res.status(400).send('Unimplemented blockchain');
        
        const result = await fullNodes[
            address.prefix
        ]!.getCoinRecordsByPuzzleHash(toHex(address.hash));

        if (!result.success)
            return res.status(500).send('Could not fetch coin records');
        
        res.status(200).send({
            records: result.coin_records.map((record) => ({
                ...record,
                spent: record.spent_block_index !== 0,
            })),
        } as Records);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not fetch records');
    }
});
