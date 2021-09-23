import { Fork } from '../Fork';
import { TransactionGroup } from '../TransactionGroup';

export interface Transactions {
    transactions: TransactionGroup[];
    balance: number;
    fork: Fork;
}
