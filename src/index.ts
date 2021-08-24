import { generateMnemonic, mnemonicToSeed } from 'bip39';
import loadBls from 'bls-signatures';
// @ts-ignore
import ChiaUtils from 'chia-utils';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { BLS } from './blsjs';
import {
    GetAdditionsAndRemovals,
    GetBlockRecordByHeight,
    GetCoinRecordsByPuzzleHash,
} from './types/rpc';
import { WalletTransaction } from './types/WalletTransaction';
import {
    addressToHash,
    getPrefix,
    hashToAddress,
    toHexString,
} from './utils/crypto';
import { execCommand, rpc } from './utils/exec';
import { logger, loggerMiddleware } from './utils/logger';

// Reads the environment variables from the .env file.
dotenv.config();

// BLS instance, there's some sort of typing issue that will need to be fixed later.
export const blsPromise: Promise<BLS> = (loadBls as any)();

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
    const bls = await blsPromise;
    const mnemonic = generateMnemonic();
    const seed = await mnemonicToSeed(mnemonic);
    const privateKey = bls.PrivateKey.fromSeed(seed);
    const publicKey = privateKey.getPublicKey();
    res.status(200).send({
        phrase: mnemonic,
        privateKey: toHexString([...privateKey.serialize()]),
        publicKey: toHexString([...publicKey.serialize()]),
    });
});

// Generates a wallet address from a public key on a fork.
app.get('/api/v1/wallet', async (req, res) => {
    const { public_key, fork } = req.body;
    if (!public_key) return res.status(400).send('Missing public_key');
    if (typeof public_key !== 'string')
        return res.status(400).send('Invalid public_key');
    if (!fork) return res.status(400).send('Missing fork');
    if (typeof fork !== 'string') return res.status(400).send('Invalid fork');
    if (!/[0-9a-fA-F]+/.test(public_key))
        return res.status(400).send('Invalid public_key');
    const forkData = forks[fork];
    if (!forkData) return res.status(400).send('Invalid fork');
    const compiled = await execCommand(
        `cd ${path.join(
            __dirname,
            '..',
            'puzzles'
        )} && opc -H "$(cdv clsp curry wallet.clsp -a 0x${public_key})"`
    );
    const address = hashToAddress(compiled.split('\n')[0], fork);
    return res.status(200).send({
        address,
        fork: forkData,
    });
});

// Recovers a public key and private key.
app.get('/api/v1/recover', async (req, res) => {
    const bls = await blsPromise;
    const { phrase } = req.body;
    if (!phrase) return res.status(400).send('Missing phrase');
    if (typeof phrase !== 'string')
        return res.status(400).send('Invalid phrase');
    const seed = await mnemonicToSeed(phrase);
    const privateKey = bls.PrivateKey.fromSeed(seed);
    const publicKey = privateKey.getPublicKey();
    res.status(200).send({
        privateKey: toHexString([...privateKey.serialize()]),
        publicKey: toHexString([...publicKey.serialize()]),
    });
});

// Fetches the balance of a puzzle.
app.get('/api/v1/balance', async (req, res) => {
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
});

// Fetches a computed list of transactions, paginated and sorted.
app.get('/api/v1/transactions', async (req, res) => {
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
});

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
