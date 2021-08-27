import { Fork } from '../Fork';
import { Success } from '../Result';
import { Transaction } from '../Transaction';

export interface Transactions extends Success {
    transactions: Transaction[];
    balance: number;
    fork: Fork;
}
