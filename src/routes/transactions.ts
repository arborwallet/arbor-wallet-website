import { Address, Hash } from 'chia-tools';
import { app, fullNodes } from '..';
import { NetworkName, networks } from '../types/Network';
import { Transactions } from '../types/routes/Transactions';
import {
    ReceiveTransactionGroup,
    SendTransactionGroup,
    TransactionGroup,
} from '../types/TransactionGroup';
import { logger } from '../utils/logger';

app.post('/api/v1/transactions', async (req, res) => {
    try {
        const { address: addressText } = req.body;
        if (!addressText) return res.status(400).send('Missing address');
        if (typeof addressText !== 'string')
            return res.status(400).send('Invalid address');
        const address = new Address(addressText);
        if (!(address.prefix in networks))
            return res.status(400).send('Invalid network');
        if (!(address.prefix in fullNodes))
            return res.status(400).send('Unimplemented network');
        const node = fullNodes[address.prefix as NetworkName]!;
        const recordsResult = await node.getCoinRecordsByPuzzleHash(
            address.toHash().toString(),
            undefined,
            undefined,
            true
        );
        if (!recordsResult.success)
            return res.status(500).send('Could not fetch coin records');
        const puzzleHash = address.toHash().toString();
        const sent: SendTransactionGroup[] = [];
        const received: Record<string, ReceiveTransactionGroup> = {};
        for (const record of recordsResult.coin_records) {
            if (record.coin.amount === 0) continue;
            const parentResult = await node.getCoinRecordByName(
                record.coin.parent_coin_info
            );
            if (!parentResult.success)
                return res
                    .status(500)
                    .send('Could not fetch parent coin record');
            if (parentResult.coin_record.coin.puzzle_hash !== puzzleHash) {
                if (!(record.coin.parent_coin_info in received)) {
                    received[record.coin.parent_coin_info] = {
                        type: 'receive',
                        transactions: [],
                        timestamp: record.timestamp,
                        block: record.confirmed_block_index,
                        amount: record.coin.amount,
                        fee: record.coin.amount,
                    };
                }
                const group = received[record.coin.parent_coin_info];
                group.transactions.push({
                    sender: new Hash(parentResult.coin_record.coin.puzzle_hash)
                        .toAddress(address.prefix)
                        .toString(),
                    amount: record.coin.amount,
                });
                group.fee -= record.coin.amount;
            }
            if (record.spent) {
                const coinId = Hash.coin(record.coin).toString();
                const blockResult = await node.getBlockRecordByHeight(
                    record.spent_block_index
                );
                if (!blockResult.success)
                    return res.status(500).send('Could not fetch block');
                const updatesResult = await node.getAdditionsAndRemovals(
                    blockResult.block_record.header_hash
                );
                if (!updatesResult.success)
                    return res
                        .status(500)
                        .send('Could not fetch additions and removals');
                const group: SendTransactionGroup = {
                    type: 'send',
                    transactions: [],
                    timestamp: blockResult.block_record.timestamp!,
                    block: record.spent_block_index,
                    amount: record.coin.amount,
                    fee: record.coin.amount,
                };
                for (const child of updatesResult.additions.filter(
                    (record) => record.coin.parent_coin_info === coinId
                )) {
                    if (child.coin.puzzle_hash !== puzzleHash)
                        group.transactions.push({
                            destination: new Hash(child.coin.puzzle_hash)
                                .toAddress(address.prefix)
                                .toString(),
                            amount: child.coin.amount,
                        });
                    group.fee -= child.coin.amount;
                }
                sent.push(group);
            }
        }
        res.status(200).send({
            transaction_groups: (Object.values(received) as TransactionGroup[])
                .concat(sent)
                .sort((a, b) => b.timestamp - a.timestamp),
        } as Transactions);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not fetch transactions');
    }
});
