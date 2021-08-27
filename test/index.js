import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';

dotenv.config({
    path: path.join(
        path.dirname(url.fileURLToPath(import.meta.url)),
        '..',
        '.env'
    ),
});

const baseURL = `http://localhost:${process.env.PORT ?? 80}/api/v1`;

async function callAPI(method, route, data) {
    try {
        return await axios({
            url: `${baseURL}/${route}`,
            method,
            data,
        });
    } catch (error) {
        throw error;
    }
}

const { data: keypair } = await callAPI('get', 'recover', {
    phrase: 'join please impose reason little citizen silk power mention any thing below',
});
const { data: wallet } = await callAPI('get', 'wallet', {
    public_key: keypair.public_key,
    fork: 'xch',
});
const { data: balance } = await callAPI('get', 'balance', {
    address: wallet.address,
});
const { data: transactions } = await callAPI('get', 'transactions', {
    address: wallet.address,
});
const { data: send } = await callAPI('get', 'send', {
    private_key: keypair.private_key,
    destination:
        'xch1cpvynt305wyhyp2vtljxguzwtwjs77yzhstqtgwx4mfcenkmtm7qpqh82t',
    amount: 1,
});
console.log(keypair, wallet, balance, transactions, send);
