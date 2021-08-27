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

const { data: transactions } = await callAPI('get', 'transactions', {
    address: 'xch1tjlc9nvvkua9n44uz0eaz5jqw8k3w0mwz2drqcz9quvsda77hxmq6nqxyz',
});
console.log(transactions);
