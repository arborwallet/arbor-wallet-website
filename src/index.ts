import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import os from 'os';
import path from 'path';
import { ForkName } from './types/Fork';
import { logger, loggerMiddleware } from './utils/logger';
import { FullNode } from './utils/rpc';

// Reads the environment variables from the .env file.
dotenv.config();

// Sets up the express application instance with middleware.
export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(
    cors({
        origin: '*',
    })
);

// Home directories for each fork network.
export const networkHomes: Record<ForkName, string> = {
    xch: process.env.CHIA_HOME ?? path.join(os.homedir(), '.chia'),
};

// Starts clients for each fork to interact with their networks.
export const fullNodes: Record<ForkName, FullNode> = {
    xch: new FullNode({
        certPath: path.join(
            networkHomes.xch,
            'mainnet',
            'config',
            'ssl',
            'full_node',
            'private_full_node.crt'
        ),
        keyPath: path.join(
            networkHomes.xch,
            'mainnet',
            'config',
            'ssl',
            'full_node',
            'private_full_node.key'
        ),
    }),
};

// Requires all of the routes.
require('./routes/keygen');
require('./routes/wallet');
require('./routes/recover');
require('./routes/balance');
require('./routes/transactions');
require('./routes/send');

app.get('/', (_req, res) =>
    res.status(200).send(`
        <body style="background-color: #AAFFAA; font-family: sans-serif;">
            <center>
                <h1>Digital Farming Initiative</h1>
                <img width=150 height=150 src='https://cdn.discordapp.com/attachments/876522894858010774/880665834056474655/arbor-wallet-a-logo.png'>
                <img width=150 height=150 src='https://cdn.discordapp.com/attachments/824082092194791424/881012471740121128/icononly.png'>
                <h2>Coming soon...</h2>
            </center>
        </body>
`)
);

app.get('/privacy/en', (_req, res) =>
    res.status(200).send(`<h2>Privacy Policy</h2>
<p>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use a Digital Farming Initiative mobile app (the &ldquo;App&rdquo;). You are encouraged to review this Privacy Policy to be informed of updates. You will be deemed to have been made aware of, will be subject to, and will be deemed to have accepted any changes to the Privacy Policy by your continued use of the App. Please read this Privacy Policy very carefully. If you do not agree with the terms of this privacy policy, please do not access or use the App.</p>
<p>&nbsp;</p>
<p>Information We Collect</p>
<p>a. Analytics. The App collects anonymous data such as your mobile device manufacturer, model, and version of your operating system in case of App crashes to improve future versions of the App.<br />b. Information Usage. We use any information you provided and we collect to operate and improve our App and customer support; by using the App, you consent to such usage. We do not share personal information with outside parties except to the extent necessary to accomplish the App&rsquo;s functionality. We may disclose your information in response to subpoenas, court orders, or other legal requirements; to exercise our legal rights or defend against legal claims; to investigate, prevent, or take action regarding illegal activities, suspected fraud or abuse, violations of our policies; or to protect our rights and property.</p>
<p>In the future, we may sell to, buy, merge with, or partner with other businesses. In such transactions, user information may be among the transferred assets.</p>
<p>&nbsp;</p>
<p>Security</p>
<p>We implement a variety of security measures to help keep your information secure. Data we store is encrypted to keep the data secure and communications with the App and data exchanges use SSL and data encryption.</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>Accessing or Deleting your Information</p>
<p>You may access or delete the App at any time of your choosing.</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>Compliance, Authorization, and Consent</p>
<p>a.&nbsp;California Online Privacy Protection Act Compliance. We comply with the California Online Privacy Protection Act. We therefore will not distribute your personal information to outside parties without your consent.<br />b.&nbsp;Children&rsquo;s Online Privacy Protection Act Compliance. We never collect or maintain information in the App from those we actually know are under 13, and no part of the App is structured to attract anyone under 13.<br />c.&nbsp;Information for European Union Customers. By using the App and providing your information, you authorize us to collect, use, and store your information outside of the European Union.<br />d.&nbsp;International Transfers of Information.&nbsp;Information may be processed, stored, and used outside of the country in which you are located. Data privacy laws vary across jurisdictions, and different laws may be applicable to your data depending on where it is processed, stored, or used.<br />e.&nbsp;Your Consent. By using our site or Apps, you consent to our privacy policy.</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>Contacting Us</p>
<p>If you have questions regarding this privacy policy, you may email support@arborwallet.com .</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>Changes to this Policy</p>
<p>If we decide to change our privacy policy, we will post those changes on this page.<br />Version history: v1-September 15, 2021.</p>`)
);

// Listen on the configured port, falling back to port 80.
const port = process.env.PORT ?? 80;
app.listen(port, () =>
    logger.info(
        `The web server is now running on port ${port} in ${process.env.NODE_ENV} mode.`
    )
);
