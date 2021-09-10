import {
    addressInfo,
    encodeNumber,
    formatHex,
    hashInfo,
    stripHex,
    toBytes,
    toCoinId,
    toHex,
} from 'chia-tools';
import { app, fullNodes } from '..';
import { ForkName, forks } from '../types/Fork';
import { Result } from '../types/Result';
import { Transactions } from '../types/routes/Transactions';
import { Transaction } from '../types/Transaction';
import { logger } from '../utils/logger';

app.post('/api/v1/transactions', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) {
            return res.status(400).send({
                success: false,
                error: 'Missing address',
            } as Result<Transactions>);
        }
        if (typeof addressText !== 'string') {
            return res.status(400).send({
                success: false,
                error: 'Invalid address',
            } as Result<Transactions>);
        }
        const address = addressInfo(addressText);
        const fork = forks[address.prefix as ForkName];
        const node = fullNodes[address.prefix as ForkName];
        const result = await node.getCoins(address.hash);
        if (!result.success) {
            return res.status(500).send({
                success: false,
                error: 'Could not fetch coin records',
            } as Result<Transactions>);
        }
        const transactions: Transaction[] = [];
        for (const entry of result.coin_records) {
            if (
                !result.coin_records.find(
                    (other) =>
                        entry.coin.parent_coin_info ===
                        formatHex(
                            toHex(
                                toCoinId(
                                    toBytes(
                                        stripHex(other.coin.parent_coin_info)
                                    ),
                                    toBytes(stripHex(other.coin.puzzle_hash)),
                                    encodeNumber(+other.coin.amount)
                                )
                            )
                        )
                )
            ) {
                const result = await node.getBlockRecordByHeight(
                    entry.confirmed_block_index
                );
                if (!result.success) {
                    return res.status(500).send({
                        success: false,
                        error: 'Could not fetch block',
                    } as Result<Transactions>);
                }
                const additionsAndRemovals = await node.getAdditionsAndRemovals(
                    result.block_record.header_hash
                );
                if (!additionsAndRemovals.success) {
                    return res.status(500).send({
                        success: false,
                        error: 'Could not fetch additions and removals',
                    } as Result<Transactions>);
                }
                const parent = additionsAndRemovals.removals.find(
                    (item) =>
                        entry.coin.parent_coin_info ===
                        formatHex(
                            toHex(
                                toCoinId(
                                    toBytes(
                                        stripHex(item.coin.parent_coin_info)
                                    ),
                                    toBytes(stripHex(item.coin.puzzle_hash)),
                                    encodeNumber(+item.coin.amount)
                                )
                            )
                        )
                )!;
                transactions.push({
                    type: 'receive',
                    timestamp: +entry.timestamp,
                    block: entry.confirmed_block_index,
                    sender: hashInfo(parent.coin.puzzle_hash, fork.ticker)
                        .address,
                    amount: +entry.coin.amount,
                });
            }
            if (entry.spent) {
                const result = await node.getBlockRecordByHeight(
                    entry.spent_block_index
                );
                if (!result.success) {
                    return res.status(500).send({
                        success: false,
                        error: 'Could not fetch block',
                    } as Result<Transactions>);
                }
                const additionsAndRemovals = await node.getAdditionsAndRemovals(
                    result.block_record.header_hash
                );
                if (!additionsAndRemovals.success) {
                    return res.status(500).send({
                        success: false,
                        error: 'Could not fetch additions and removals',
                    } as Result<Transactions>);
                }
                const coinId: string = formatHex(
                    toHex(
                        toCoinId(
                            toBytes(stripHex(entry.coin.parent_coin_info)),
                            toBytes(stripHex(entry.coin.puzzle_hash)),
                            encodeNumber(+entry.coin.amount)
                        )
                    )
                );
                const children = additionsAndRemovals.additions.filter(
                    (addition) => addition.coin.parent_coin_info === coinId
                );
                for (const child of children) {
                    if (child.coin.puzzle_hash !== entry.coin.puzzle_hash) {
                        transactions.push({
                            type: 'send',
                            timestamp: +child.timestamp,
                            block: child.confirmed_block_index,
                            destination: hashInfo(
                                child.coin.puzzle_hash,
                                fork.ticker
                            ).address,
                            amount: +child.coin.amount,
                        });
                    }
                }
            }
        }
        transactions.sort((a, b) => b.timestamp - a.timestamp);
        res.status(200).send({
            success: true,
            transactions: transactions.filter(
                (transaction) => transaction.amount > 0
            ),
            balance: transactions.reduce(
                (a, b) => (b.type === 'receive' ? a + b.amount : a - b.amount),
                0
            ),
            fork,
        } as Result<Transactions>);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send({
            success: false,
            error: 'Could not fetch transactions',
        } as Result<Transactions>);
    }
});
