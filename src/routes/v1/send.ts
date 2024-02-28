import {
    AugSchemeMPL,
    JacobianPoint,
    PrivateKey,
    concatBytes,
    fromHex,
    toHex,
} from 'chia-bls';
import {
    CoinRecord,
    CoinSpend,
    addressInfo,
    formatHex,
    sanitizeHex,
    toCoinId,
} from 'chia-rpc';
import { Program } from 'clvm-lib';
import { app, blockchains, fullNodes } from '../..';
import { logger } from '../../utils/logger';
import { walletPuzzle } from '../../utils/puzzles';

interface Send {
    status: 'success';
}

app.post('/api/v1/send', async (req, res) => {
    try {
        const {
            private_key: privateKeyText,
            destination: destinationText,
            amount,
            fee,
        } = req.body;

        if (!privateKeyText) return res.status(400).send('Missing private_key');

        if (
            typeof privateKeyText !== 'string' ||
            !/[0-9a-f]{64}/.test(privateKeyText)
        )
            return res.status(400).send('Invalid private_key');

        if (!destinationText)
            return res.status(400).send('Missing destination');

        if (typeof destinationText !== 'string')
            return res.status(400).send('Invalid destination');

        if (!amount) return res.status(400).send('Missing amount');

        if (
            typeof amount !== 'number' ||
            !isFinite(amount) ||
            Math.floor(amount) !== amount ||
            amount <= 0
        )
            return res.status(400).send('Invalid amount');

        if (fee === undefined) return res.status(400).send('Missing fee');

        if (
            typeof fee !== 'number' ||
            !isFinite(fee) ||
            Math.floor(fee) !== fee ||
            fee < 0
        )
            return res.status(400).send('Invalid fee');

        const destination = addressInfo(destinationText);

        if (!(destination.prefix in blockchains))
            return res.status(400).send('Invalid blockchain');

        if (!(destination.prefix in fullNodes))
            return res.status(400).send('Unimplemented blockchain');

        const totalAmount = amount + fee;
        const node = fullNodes[destination.prefix]!;
        const blockchain = blockchains[destination.prefix]!;
        const privateKey = PrivateKey.fromHex(privateKeyText);
        const publicKey = privateKey.getG1();
        const puzzle = walletPuzzle.curry([
            Program.fromJacobianPoint(publicKey),
        ]);

        const coinRecordResult = await node.getCoinRecordsByPuzzleHash(
            puzzle.hashHex(),
        );

        if (!coinRecordResult.success)
            return res.status(500).send('Could not fetch coin records');

        const records = coinRecordResult.coin_records.filter(
            (record) => !record.spent,
        );

        records.sort((a, b) => b.coin.amount - a.coin.amount);

        const spendRecords: Array<CoinRecord> = [];

        let spendAmount = 0;

        calculator: while (records.length && spendAmount < totalAmount) {
            for (let i = 0; i < records.length; i++) {
                if (spendAmount + records[i].coin.amount <= totalAmount) {
                    const record = records.splice(i--, 1)[0];
                    spendRecords.push(record);
                    spendAmount += record.coin.amount;
                    continue calculator;
                }
            }

            const record = records.shift()!;
            spendRecords.push(record);
            spendAmount += record.coin.amount;
        }

        if (spendAmount < totalAmount)
            return res.status(400).send('Insufficient funds');

        const signatures: Array<JacobianPoint> = [];
        const spends: Array<CoinSpend> = [];
        let target = true;
        const change = spendAmount - amount - fee;

        for (const record of spendRecords) {
            const solution = Program.fromSource(
                `((${
                    target
                        ? `(51 ${formatHex(
                              toHex(destination.hash),
                          )} ${amount})${
                              change > 0
                                  ? ` (51 ${formatHex(
                                        puzzle.hashHex(),
                                    )} ${change})`
                                  : ''
                          }`
                        : ''
                }))`,
            );

            target = false;

            const coinId = toCoinId(record.coin);

            signatures.push(
                AugSchemeMPL.sign(
                    privateKey,
                    concatBytes(
                        solution.hash(),
                        coinId,
                        fromHex(sanitizeHex(blockchain.agg_sig_me_extra_data)),
                    ),
                ),
            );

            spends.push({
                coin: record.coin,
                puzzle_reveal: puzzle.serializeHex(),
                solution: solution.serializeHex(),
            });
        }

        const aggregate = AugSchemeMPL.aggregate(signatures);

        const bundle = {
            coin_spends: spends,
            aggregated_signature: aggregate.toHex(),
        };

        const pushTxResult = await node.pushTx(bundle);

        if (!pushTxResult.success) {
            console.log(bundle);
            console.log('\n\n');
            console.log('ERROR: ', pushTxResult.error);

            return res
                .status(500)
                .send('Could not push transaction to blockchain');
        }

        res.status(200).send({
            status: 'success',
        } as Send);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not send transaction');
    }
});
