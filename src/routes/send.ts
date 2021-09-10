import { CoinRecord } from 'chia-client/dist/src/types/FullNode/CoinRecord';
import {
    addressInfo,
    aggregate,
    concatBytes,
    encodeNumber,
    generatePublicKey,
    sign,
    stringify,
    stripHex,
    toBytes,
    toCoinId,
    toPrivateKey,
} from 'chia-tools';
import path from 'path';
import { app, fullNodes } from '..';
import { ForkName, forks } from '../types/Fork';
import { Result } from '../types/Result';
import { Send } from '../types/routes/Send';
import { executeCommand } from '../utils/execute';
import { logger } from '../utils/logger';

app.post('/api/v1/send', async (req, res) => {
    try {
        const {
            private_key: privateKeyText,
            destination: destinationText,
            amount,
        } = req.body;
        if (!privateKeyText) {
            return res.status(400).send({
                success: false,
                error: 'Missing private_key',
            } as Result<Send>);
        }
        if (
            typeof privateKeyText !== 'string' ||
            !/[0-9a-f]{64}/.test(privateKeyText)
        ) {
            return res.status(400).send({
                success: false,
                error: 'Invalid private_key',
            } as Result<Send>);
        }
        if (!destinationText) {
            return res.status(400).send({
                success: false,
                error: 'Missing destination',
            } as Result<Send>);
        }
        if (typeof destinationText !== 'string') {
            return res.status(400).send({
                success: false,
                error: 'Invalid destination',
            } as Result<Send>);
        }
        if (!amount) {
            return res.status(400).send({
                success: false,
                error: 'Missing amount',
            } as Result<Send>);
        }
        if (
            typeof amount !== 'number' ||
            !isFinite(amount) ||
            Math.floor(amount) !== amount ||
            amount <= 0
        ) {
            return res.status(400).send({
                success: false,
                error: 'Invalid amount',
            } as Result<Send>);
        }
        const destination = addressInfo(destinationText);
        if (!(destination.prefix in forks)) {
            return res.status(400).send({
                success: false,
                error: 'Invalid fork',
            } as Result<Send>);
        }
        const fork = forks[destination.prefix as ForkName];
        const node = fullNodes[destination.prefix as ForkName];
        const privateKey = await toPrivateKey(toBytes(privateKeyText));
        const publicKey = generatePublicKey(privateKey);
        const commandResult = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp -a 0x${stringify(
                publicKey
            )})"`
        );
        const lines = commandResult.trim().split('\n');
        const puzzleHash = lines[0];
        const serializedPuzzle = lines.slice(1).join('');
        const result = await node.getUnspentCoins(puzzleHash);
        if (!result.success) {
            return res.status(500).send({
                success: false,
                error: 'Could not fetch coin records',
            } as Result<Send>);
        }
        const records = result.coin_records;
        records.sort((a, b) => +b.coin.amount - +a.coin.amount);
        const spendRecords: CoinRecord[] = [];
        let spendAmount = 0;
        calculator: while (records.length && spendAmount < amount) {
            for (let i = 0; i < records.length; i++) {
                if (spendAmount + +records[i].coin.amount <= amount) {
                    const record = records.splice(i, 1)[0];
                    spendRecords.push(record);
                    spendAmount += +record.coin.amount;
                    continue calculator;
                }
            }
            const record = records.shift()!;
            spendRecords.push(record);
            spendAmount += +record.coin.amount;
        }
        if (spendAmount < amount) {
            return res.status(400).send({
                success: false,
                error: 'Insufficient funds',
            } as Result<Send>);
        }
        const defaultHash =
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const solution = `${amount} ${destination.hash} ${
            spendAmount - amount
        } 0x${puzzleHash}`;
        const hashResult = await executeCommand(`run '(sha256 ${solution})'`);
        const solutionHash = hashResult.trim().slice(2);
        const extraData = toBytes(
            'ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb'
        );
        const signatures = [];
        for (let i = 0; i < spendRecords.length; i++) {
            signatures.push(
                await sign(
                    privateKey,
                    concatBytes(
                        toBytes(i === 0 ? solutionHash : defaultHash),
                        toCoinId(
                            toBytes(
                                stripHex(spendRecords[i].coin.parent_coin_info)
                            ),
                            toBytes(stripHex(spendRecords[i].coin.puzzle_hash)),
                            encodeNumber(+spendRecords[i].coin.amount)
                        ),
                        extraData
                    )
                )
            );
        }
        const aggregateSignature = await aggregate(signatures);
        const serializedSolutionResult = await executeCommand(
            `opc '(${solution})'`
        );
        const serializedSolution = serializedSolutionResult.trim();
        const serializedDefaultSolution = 'ff80ff80ff80ff8080';
        const bundle = {
            coin_solutions: spendRecords.map((record, i) => {
                return {
                    coin: record.coin,
                    puzzle_reveal: serializedPuzzle,
                    solution:
                        i === 0
                            ? serializedSolution
                            : serializedDefaultSolution,
                };
            }),
            aggregated_signature: '0x' + stringify(aggregateSignature),
        };
        const transaction = await node.pushTransaction(bundle as any);
        if (!transaction.success) {
            return res.status(500).send({
                success: false,
                error: 'Could not send transaction',
            } as Result<Send>);
        }
        return res.status(200).send({
            success: true,
            fork,
            status: 'success',
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send({
            success: false,
            error: 'Could not send transaction',
        } as Result<Send>);
    }
});
