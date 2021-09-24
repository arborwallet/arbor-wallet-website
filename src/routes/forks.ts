import { app } from '..';
import { forks } from '../types/Fork';
import { Forks } from '../types/routes/Forks';

app.get('/api/v1/forks', async (_req, res) => {
    return res.status(200).send({
        forks: Object.values(forks),
    } as Forks);
});
