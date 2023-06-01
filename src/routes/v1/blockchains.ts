import { app, blockchains } from '../..';
import { BlockchainInfo } from '../../types/Blockchain';

interface Blockchains {
    blockchains: BlockchainInfo[];
}

app.get('/api/v1/blockchains', async (_req, res) => {
    return res.status(200).send({
        blockchains: Object.values(blockchains),
    } as Blockchains);
});
