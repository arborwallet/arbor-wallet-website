import { Address, Hash } from 'chia-tools';
import { app, fullNodes } from '..';
import { ForkName, forks } from '../types/Fork';
import { Transactions } from '../types/routes/Transactions';
import { Transaction } from '../types/Transaction';
import { logger } from '../utils/logger';

app.post('/api/v1/transactions', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) return res.status(400).send('Missing address');
        if (typeof addressText !== 'string') {
            return res.status(400).send('Invalid address');
        }
        const address = new Address(addressText);
        const fork = forks[address.prefix as ForkName];
        const node = fullNodes[address.prefix as ForkName];
        const result = await node.getCoinRecordsByPuzzleHash(
            address.toHash().toString()
        );
        if (!result.success)
            return res.status(500).send('Could not fetch coin records');
        const transactions: Transaction[] = [];
        for (const entry of result.coin_records) {
            if (
                !result.coin_records.find(
                    (other) =>
                        entry.coin.parent_coin_info ===
                        Hash.coin(other.coin).toString()
                )
            ) {
                const result = await node.getBlockRecordByHeight(
                    entry.confirmed_block_index
                );
                if (!result.success)
                    return res.status(500).send('Could not fetch block');
                const additionsAndRemovals = await node.getAdditionsAndRemovals(
                    result.block_record.header_hash
                );
                if (!additionsAndRemovals.success)
                    return res
                        .status(500)
                        .send('Could not fetch additions and removals');
                const parent = additionsAndRemovals.removals.find(
                    (item) =>
                        entry.coin.parent_coin_info ===
                        Hash.coin(item.coin).toString()
                )!;
                transactions.push({
                    type: 'receive',
                    timestamp: entry.timestamp,
                    block: entry.confirmed_block_index,
                    sender: new Hash(parent.coin.puzzle_hash)
                        .toAddress(fork.ticker)
                        .toString(),
                    amount: entry.coin.amount,
                });
            }
            if (entry.spent) {
                const result = await node.getBlockRecordByHeight(
                    entry.spent_block_index
                );
                if (!result.success) {
                    return res.status(500).send('Could not fetch block');
                }
                const additionsAndRemovals = await node.getAdditionsAndRemovals(
                    result.block_record.header_hash
                );
                if (!additionsAndRemovals.success) {
                    return res
                        .status(500)
                        .send('Could not fetch additions and removals');
                }
                const coinId: string = Hash.coin(entry.coin).toString();
                const children = additionsAndRemovals.additions.filter(
                    (addition) => addition.coin.parent_coin_info === coinId
                );
                for (const child of children) {
                    if (child.coin.puzzle_hash !== entry.coin.puzzle_hash) {
                        transactions.push({
                            type: 'send',
                            timestamp: +child.timestamp,
                            block: child.confirmed_block_index,
                            destination: new Hash(child.coin.puzzle_hash)
                                .toAddress(fork.ticker)
                                .toString(),
                            amount: +child.coin.amount,
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
            balance: transactions.reduce(
                (a, b) => (b.type === 'receive' ? a + b.amount : a - b.amount),
                0
            ),
            fork,
        } as Transactions);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not fetch transactions');
    }
});
