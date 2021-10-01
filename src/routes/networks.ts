import { app } from '..';
import { networks } from '../types/Network';
import { Networks } from '../types/routes/Networks';

app.get('/api/v1/networks', async (_req, res) => {
    return res.status(200).send({
        networks: Object.values(networks),
    } as Networks);
});
