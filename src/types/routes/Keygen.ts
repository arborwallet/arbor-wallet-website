import { Success } from '../Result';

export interface Keygen extends Success {
    phrase: string;
    private_key: string;
    public_key: string;
}
