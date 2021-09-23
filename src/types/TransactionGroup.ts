import { ReceiveTransaction, SendTransaction } from './Transaction';

export type TransactionGroup = SendTransactionGroup | ReceiveTransactionGroup;

export interface SendTransactionGroup {
    type: 'send';
    transactions: SendTransaction[];
    timestamp: number;
    block: number;
    amount: number;
    fee: number;
}

export interface ReceiveTransactionGroup {
    type: 'receive';
    transactions: ReceiveTransaction[];
    timestamp: number;
    block: number;
    amount: number;
    fee: number;
}
