import { Fork } from '../Fork';
import { Success } from '../Result';

export interface Send extends Success {
    fork: Fork;
}
