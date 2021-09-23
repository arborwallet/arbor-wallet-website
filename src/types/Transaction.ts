export type Transaction = SendTransaction | ReceiveTransaction;

export interface SendTransaction {
    destination: string;
    amount: number;
}

export interface ReceiveTransaction {
    sender: string;
    amount: number;
}
