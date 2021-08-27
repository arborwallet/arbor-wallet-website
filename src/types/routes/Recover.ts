import { Success } from '../Result';

export interface Recover extends Success {
    phrase: string;
    private_key: string;
    public_key: string;
}
