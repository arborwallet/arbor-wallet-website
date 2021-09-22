import { Fork } from '../Fork';

export interface Wallet {
    address: string;
    fork: Fork;
}
