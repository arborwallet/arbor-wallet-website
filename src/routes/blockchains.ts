import { app, blockchains } from '..';
import { Blockchains } from '../types/routes/Blockchains';

app.get('/api/v1/blockchains', async (_req, res) => {
    return res.status(200).send({
        blockchains: Object.values(blockchains),
    } as Blockchains);
});
