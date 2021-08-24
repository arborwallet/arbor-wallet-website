import loadBls, { G2Element, ModuleInstance } from '@chiamine/bls-signatures';
import { generateMnemonic, mnemonicToSeed } from 'bip39';
// @ts-ignore
import ChiaUtils from 'chia-utils';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import {
    CoinRecord,
    GetAdditionsAndRemovals,
    GetBlockRecordByHeight,
    GetCoinRecordsByPuzzleHash,
    PushTX,
} from './types/rpc';
import { WalletTransaction } from './types/WalletTransaction';
import {
    addressToHash,
    getPrefix,
    hashToAddress,
    toByteArray,
    toHexString,
    unformatHash,
} from './utils/crypto';
import { execCommand, rpc } from './utils/exec';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

// BLS instance, there's some sort of typing issue that will need to be fixed later.
export const blsPromise: Promise<ModuleInstance> = (loadBls as any)();

// A list of Chia forks.
interface Fork {
    name: string;
    ticker: string;
    unit: string;
    precision: number;
}
const forks: Record<string, Fork> = {
    xch: {
        name: 'Chia',
        ticker: 'xch',
        unit: 'mojo',
        precision: 12,
    },
};

// Sets up the express application instance with middleware.
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Generates a mnemonic phrase, public key, and private key.
app.get('/api/v1/keygen', async (req, res) => {
    try {
        const bls = await blsPromise;
        const mnemonic = generateMnemonic();
        const seed = await mnemonicToSeed(mnemonic);
        const privateKey = bls.AugSchemeMPL.key_gen(seed);
        const publicKey = privateKey.get_g1();
        res.status(200).send({
            phrase: mnemonic,
            private_key: toHexString([...privateKey.serialize()]),
            public_key: toHexString([...publicKey.serialize()]),
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Generates a wallet address from a public key on a fork.
app.get('/api/v1/wallet', async (req, res) => {
    try {
        const { public_key, fork } = req.body;
        if (!public_key) return res.status(400).send('Missing public_key');
        if (typeof public_key !== 'string')
            return res.status(400).send('Invalid public_key');
        if (!fork) return res.status(400).send('Missing fork');
        if (typeof fork !== 'string')
            return res.status(400).send('Invalid fork');
        if (!/[0-9a-fA-F]{96}/.test(public_key))
            return res.status(400).send('Invalid public_key');
        const forkData = forks[fork];
        if (!forkData) return res.status(400).send('Invalid fork');
        const result = await execCommand(
            `cd ${path.join(
                __dirname,
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp -a 0x${public_key})"`
        );
        const address = hashToAddress(result.split('\n')[0], fork);
        return res.status(200).send({
            address,
            fork: forkData,
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Recovers a public key and private key.
app.get('/api/v1/recover', async (req, res) => {
    try {
        const bls = await blsPromise;
        const { phrase } = req.body;
        if (!phrase) return res.status(400).send('Missing phrase');
        if (typeof phrase !== 'string' || !/[a-z]+(?: [a-z]+){11}/.test(phrase))
            return res.status(400).send('Invalid phrase');
        const seed = await mnemonicToSeed(phrase);
        const privateKey = bls.AugSchemeMPL.key_gen(seed);
        const publicKey = privateKey.get_g1();
        res.status(200).send({
            phrase,
            private_key: toHexString([...privateKey.serialize()]),
            public_key: toHexString([...publicKey.serialize()]),
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Fetches the balance of a puzzle.
app.get('/api/v1/balance', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).send('Missing address');
        if (typeof address !== 'string')
            return res.status(400).send('Invalid address');
        const hash = addressToHash(address);
        if (!hash) return res.status(400).send('Invalid address');
        const fork = forks[getPrefix(address)!];
        if (!fork) return res.status(400).send('Invalid address prefix');
        const coinRecordResult: GetCoinRecordsByPuzzleHash = await rpc(
            'get_coin_records_by_puzzle_hash',
            {
                puzzle_hash: hash,
                include_spent_coins: true,
            }
        );
        if (!coinRecordResult.success) {
            return res.status(500).send(coinRecordResult.error);
        }
        res.status(200).send({
            balance: coinRecordResult.coin_records
                .filter((record) => !record.spent)
                .map((record) => record.coin.amount)
                .reduce((a, b) => a + b, 0),
            fork,
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Sends a transaction from a wallet to a destination with a given amount.
app.post('/api/v1/transactions', async (req, res) => {
    try {
        const bls = await blsPromise;
        const { private_key, destination, amount } = req.body;
        if (!private_key) return res.status(400).send('Missing private_key');
        if (typeof private_key !== 'string')
            return res.status(400).send('Invalid private_key');
        if (!destination) return res.status(400).send('Missing destination');
        if (typeof destination !== 'string')
            return res.status(400).send('Invalid destination');
        if (!amount) return res.status(400).send('Missing amount');
        if (typeof amount !== 'number')
            return res.status(400).send('Invalid amount');
        const destinationHash = addressToHash(destination);
        if (!destinationHash)
            return res.status(400).send('Invalid destination');
        const fork = forks[getPrefix(destination)!];
        if (!fork) return res.status(400).send('Invalid fork');
        if (!/[0-9a-fA-F]{64}/.test(private_key))
            return res.status(400).send('Invalid private_key');
        const amountNumber = +amount;
        if (
            !isFinite(amountNumber) ||
            Math.floor(amountNumber) !== amountNumber ||
            amountNumber <= 0
        )
            return res.status(400).send('Invalid amount');
        const privateKeyObject = bls.PrivateKey.from_bytes(
            Uint8Array.from(toByteArray(private_key)),
            false
        );
        const publicKeyObject = privateKeyObject.get_g1();
        const public_key = toHexString([...publicKeyObject.serialize()]);
        const result = await execCommand(
            `cd ${path.join(
                __dirname,
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp -a 0x${public_key})"`
        );
        const lines = result.trim().split('\n');
        const puzzleHash = lines[0];
        const serializedPuzzle = lines.slice(1).join('');
        const coinRecordResult: GetCoinRecordsByPuzzleHash = await rpc(
            'get_coin_records_by_puzzle_hash',
            {
                puzzle_hash: puzzleHash,
                include_spent_coins: true,
            }
        );
        if (!coinRecordResult.success) {
            return res.status(500).send(coinRecordResult.error);
        }
        const records = coinRecordResult.coin_records.filter(
            (record) => !record.spent
        );
        records.sort((a, b) => b.coin.amount - a.coin.amount);
        const spendRecords: CoinRecord[] = [];
        let spendAmount = 0;
        calculator: while (records.length && spendAmount < amountNumber) {
            for (let i = 0; i < records.length; i++) {
                if (spendAmount + records[i].coin.amount <= amountNumber) {
                    const record = records.splice(i, 1)[0];
                    spendRecords.push(record);
                    spendAmount += record.coin.amount;
                    continue calculator;
                }
            }
            const record = records.shift()!;
            spendRecords.push(record);
            spendAmount += record.coin.amount;
        }
        if (spendAmount < amount)
            return res.status(400).send('Insufficient funds');
        const defaultHash =
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const solution = `${amountNumber} 0x${destinationHash} ${
            spendAmount - amountNumber
        } 0x${puzzleHash}`;
        const hashResult = await execCommand(`run '(sha256 ${solution})'`);
        const solutionHash = hashResult.trim().slice(2);
        const agg_sig_me_extra_data = toByteArray(
            'ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb'
        );
        const signatures: G2Element[] = spendRecords.map((record, i) =>
            bls.AugSchemeMPL.sign(
                privateKeyObject,
                Uint8Array.from([
                    ...toByteArray(i === 0 ? solutionHash : defaultHash),
                    ...toByteArray(
                        unformatHash(
                            ChiaUtils.get_coin_info_mojo(
                                record.coin.parent_coin_info,
                                record.coin.puzzle_hash,
                                record.coin.amount
                            )
                        )
                    ),
                    ...agg_sig_me_extra_data,
                ])
            )
        );
        const aggregateSignature = bls.AugSchemeMPL.aggregate(signatures);
        const serializedSolutionResult = await execCommand(
            `opc '(${solution})'`
        );
        const serializedSolution = serializedSolutionResult.trim();
        const serializedDefaultSolution = 'ff80ff80ff80ff8080';
        const bundle = {
            spend_bundle: {
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
                aggregated_signature:
                    '0x' + toHexString([...aggregateSignature.serialize()]),
            },
        };
        const pushTX: PushTX = await rpc('push_tx', bundle);
        if (!pushTX.success) return res.status(500).send(pushTX.error);
        return res.status(200).send({
            fork,
            status: 'success',
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Fetches a computed list of transactions, paginated and sorted.
app.get('/api/v1/transactions', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).send('Missing address');
        if (typeof address !== 'string')
            return res.status(400).send('Invalid address');
        const hash = addressToHash(address);
        if (!hash) return res.status(400).send('Invalid address');
        const fork = forks[getPrefix(address)!];
        if (!fork) return res.status(400).send('Invalid address prefix');
        const coinRecordResult: GetCoinRecordsByPuzzleHash = await rpc(
            'get_coin_records_by_puzzle_hash',
            {
                puzzle_hash: hash,
                include_spent_coins: true,
            }
        );
        if (!coinRecordResult.success) {
            return res.status(500).send(coinRecordResult.error);
        }
        const transactions: WalletTransaction[] = [];
        for (const entry of coinRecordResult.coin_records) {
            if (
                !coinRecordResult.coin_records.find(
                    (other) =>
                        entry.coin.parent_coin_info ===
                        ChiaUtils.get_coin_info_mojo(
                            other.coin.parent_coin_info,
                            other.coin.puzzle_hash,
                            other.coin.amount
                        )
                )
            ) {
                const blockRecordResult: GetBlockRecordByHeight = await rpc(
                    'get_block_record_by_height',
                    {
                        height: entry.confirmed_block_index,
                    }
                );
                if (!blockRecordResult.success) {
                    return res.status(500).send(blockRecordResult.error);
                }
                const additionsAndRemovals: GetAdditionsAndRemovals = await rpc(
                    'get_additions_and_removals',
                    {
                        header_hash: blockRecordResult.block_record.header_hash,
                    }
                );
                if (!additionsAndRemovals.success) {
                    return res.status(500).send(additionsAndRemovals.error);
                }
                const parent = additionsAndRemovals.removals.find(
                    (item) =>
                        ChiaUtils.get_coin_info_mojo(
                            item.coin.parent_coin_info,
                            item.coin.puzzle_hash,
                            item.coin.amount
                        ) === entry.coin.parent_coin_info
                )!;
                transactions.push({
                    type: 'receive',
                    timestamp: entry.timestamp,
                    block: entry.confirmed_block_index,
                    sender: parent.coin.puzzle_hash,
                    amount: entry.coin.amount,
                });
            }
            if (entry.spent) {
                const blockRecordResult: GetBlockRecordByHeight = await rpc(
                    'get_block_record_by_height',
                    {
                        height: entry.spent_block_index,
                    }
                );
                if (!blockRecordResult.success) {
                    return res.status(500).send(blockRecordResult.error);
                }
                const additionsAndRemovals: GetAdditionsAndRemovals = await rpc(
                    'get_additions_and_removals',
                    {
                        header_hash: blockRecordResult.block_record.header_hash,
                    }
                );
                if (!additionsAndRemovals.success) {
                    return res.status(500).send(additionsAndRemovals.error);
                }
                const coinId: string = ChiaUtils.get_coin_info_mojo(
                    entry.coin.parent_coin_info,
                    entry.coin.puzzle_hash,
                    entry.coin.amount
                );
                const children = additionsAndRemovals.additions.filter(
                    (addition) => addition.coin.parent_coin_info === coinId
                );
                for (const child of children) {
                    if (child.coin.puzzle_hash !== entry.coin.puzzle_hash) {
                        transactions.push({
                            type: 'send',
                            timestamp: child.timestamp,
                            block: child.confirmed_block_index,
                            destination: child.coin.puzzle_hash,
                            amount: child.coin.amount,
                        });
                    }
                }
            }
        }
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        res.status(200).send({
            transactions: transactions.filter(
                (transaction) => transaction.amount > 0
            ),
            fork,
        });
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send(`${error}`);
    }
});

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
