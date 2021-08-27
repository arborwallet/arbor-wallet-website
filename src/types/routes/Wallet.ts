import { Fork } from '../Fork';
import { Success } from '../Result';

export interface Wallet extends Success {
    address: string;
    fork: Fork;
}
