import { app } from '..';
import { NetworkName, networks } from '../types/Network';
import { Network } from '../types/routes/Network';
import { logger } from '../utils/logger';

app.post('/api/v1/network', async (req, res) => {
    try {
        const { network: networkNameText } = req.body;
        if (!networkNameText) return res.status(400).send('Missing network');
        if (!(networkNameText in networks))
            return res.status(400).send('Invalid network');
        return res.status(200).send({
            network: networks[networkNameText as NetworkName],
        } as Network);
    } catch (error) {
        logger.error(`${error}`);
        return res.status(500).send('Could not generate wallet');
    }
});
