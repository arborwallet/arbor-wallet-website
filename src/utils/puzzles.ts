import { Program } from 'clvm-lib';
import fs from 'fs';
import path from 'path';

export const walletPuzzle = Program.deserializeHex(
    fs.readFileSync(
        path.join(__dirname, '..', '..', 'puzzles', 'wallet.clsp.hex'),
        'utf-8'
    )
);
