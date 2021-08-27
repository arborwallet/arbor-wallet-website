import { hashInfo } from 'chia-tools';
import path from 'path';
import { app } from '..';
import { ForkName, forks } from '../types/Fork';
import { Result } from '../types/Result';
import { Wallet } from '../types/routes/Wallet';
import { executeCommand } from '../utils/execute';
import { logger } from '../utils/logger';

app.get('/api/v1/wallet', async (req, res) => {
    try {
        const { public_key: publicKeyText, fork: forkNameText } = req.body;
        if (!publicKeyText) {
            return res.status(200).send({
                success: false,
                error: 'Missing public_key',
            } as Result<Wallet>);
        }
        if (
            typeof publicKeyText !== 'string' ||
            !/[0-9a-f]{96}/.test(publicKeyText)
        ) {
            return res.status(200).send({
                success: false,
                error: 'Invalid public_key',
            } as Result<Wallet>);
        }
        if (!forkNameText) {
            return res.status(200).send({
                success: false,
                error: 'Missing fork',
            } as Result<Wallet>);
        }
        if (!(forkNameText in forks)) {
            return res.status(200).send({
                success: false,
                error: 'Invalid fork',
            } as Result<Wallet>);
        }
        const fork = forks[forkNameText as ForkName];
        const result = await executeCommand(
            `cd ${path.join(
                __dirname,
                '..',
                '..',
                'puzzles'
            )} && opc -H "$(cdv clsp curry wallet.clsp -a 0x${publicKeyText})"`
        );
        const { address } = hashInfo(result.split('\n')[0], forkNameText);
        return res.status(200).send({
            success: true,
            address,
            fork,
        } as Result<Wallet>);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(200).send({
            success: false,
            error: 'Could not generate wallet',
        } as Result<Wallet>);
    }
});
