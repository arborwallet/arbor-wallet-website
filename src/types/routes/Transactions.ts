import { Fork } from '../Fork';
import { Transaction } from '../Transaction';

export interface Transactions {
    transactions: Transaction[];
    balance: number;
    fork: Fork;
}
