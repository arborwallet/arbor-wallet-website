export type Transaction = SendTransaction | ReceiveTransaction;

export interface SendTransaction {
    type: 'send';
    timestamp: number;
    block: number;
    destination: string;
    amount: number;
}

export interface ReceiveTransaction {
    type: 'receive';
    timestamp: number;
    block: number;
    sender: string;
    amount: number;
}
