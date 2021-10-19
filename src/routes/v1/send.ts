import { concatBytes, hexToBytes } from 'bytes.ts';
import {
    Address,
    CoinRecord,
    CoinSpend,
    Hash,
    PrivateKey,
    Signature,
} from 'chia-tools';
import path from 'path';
import { quote } from 'shell-quote';
import { app, blockchains, fullNodes } from '../..';
import { executeCommand } from '../../utils/execute';
import { logger } from '../../utils/logger';

interface Send {
    status: 'success';
}

const extraData = hexToBytes(
    'ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb'
);

app.post('/api/v1/send', async (req, res) => {
    let privateKey, publicKey, signatures: Signature[] | undefined, aggregate;
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
        const destination = new Address(destinationText);
        if (!(destination.prefix in blockchains))
            return res.status(400).send('Invalid blockchain');
        if (!(destination.prefix in fullNodes))
            return res.status(400).send('Unimplemented blockchain');
        const totalAmount = amount + fee;
        const node = fullNodes[destination.prefix]!;
        privateKey = await PrivateKey.from(privateKeyText);
        publicKey = privateKey.getPublicKey();
        const compileResult = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp.hex -a 0x${publicKey})"`
        );
        const lines = compileResult.trim().split('\n');
        const puzzleHash = '0x' + lines[0];
        const serializedPuzzle = lines.slice(1).join('');
        const coinRecordResult = await node.getCoinRecordsByPuzzleHash(
            puzzleHash
        );
        if (!coinRecordResult.success)
            return res.status(500).send('Could not fetch coin records');
        const records = coinRecordResult.coin_records.filter(
            (record) => !record.spent
        );
        records.sort((a, b) => b.coin.amount - a.coin.amount);
        const spendRecords: CoinRecord[] = [];
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
        signatures = [];
        const spends: CoinSpend[] = [];
        let target = true;
        const destinationHash = destination.toHash();
        const change = spendAmount - amount - fee;
        for (const record of spendRecords) {
            const solution = `((${
                target
                    ? `(51 ${destinationHash} ${amount})${
                          change > 0 ? ` (51 ${puzzleHash} ${change})` : ''
                      }`
                    : ''
            }))`;
            target = false;
            const solutionResult = new Hash(
                (
                    await executeCommand(
                        `brun '(a (q 2 2 (c 2 (c 5 ()))) (c (q 2 (i (l 5) (q 11 (q . 2) (a 2 (c 2 (c 9 ()))) (a 2 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))' '${solution}'`
                    )
                ).trim()
            );
            const serializedSolution = (
                await executeCommand(`opc ${quote([solution])}`)
            ).trim();
            const coinId = Hash.coin(record.coin);
            signatures.push(
                privateKey.sign(
                    concatBytes(solutionResult.bytes, coinId.bytes, extraData)
                )
            );
            spends.push({
                coin: record.coin,
                puzzle_reveal: serializedPuzzle,
                solution: serializedSolution,
            });
        }
        aggregate = await Signature.from(signatures);
        const pushTxResult = await node.pushTx({
            coin_spends: spends,
            aggregated_signature: aggregate.toString(),
        });
        if (!pushTxResult.success)
            return res
                .status(500)
                .send('Could not push transaction to blockchain');
        aggregate.delete();
        for (const signature of signatures) signature.delete();
        privateKey.delete();
        publicKey.delete();
        res.status(200).send({
            status: 'success',
        } as Send);
    } catch (error) {
        if (aggregate) aggregate.delete();
        if (signatures) for (const signature of signatures) signature.delete();
        if (privateKey) privateKey.delete();
        if (publicKey) publicKey.delete();
        logger.error(`${error}`);
        return res.status(500).send('Could not send transaction');
    }
});
