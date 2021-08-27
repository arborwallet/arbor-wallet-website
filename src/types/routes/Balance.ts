import { Fork } from '../Fork';
import { Success } from '../Result';

export interface Balance extends Success {
    balance: number;
    fork: Fork;
}
