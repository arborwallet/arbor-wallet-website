import { app } from '..';
import { ForkName, forks } from '../types/Fork';
import { Fork } from '../types/routes/Fork';
import { logger } from '../utils/logger';

app.post('/api/v1/fork', async (req, res) => {
    try {
        const { fork: forkNameText } = req.body;
        if (!forkNameText) return res.status(400).send('Missing fork');
        if (!(forkNameText in forks))
            return res.status(400).send('Invalid fork');
        return res.status(200).send({
            fork: forks[forkNameText as ForkName],
        } as Fork);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
