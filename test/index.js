import assert from 'assert';
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

// Valid usages.
const { data: keypair } = await callAPI('get', 'keygen', {});
console.log('Expected keypair:', keypair);
const { data: recovery } = await callAPI('get', 'recover', {
    phrase: keypair.phrase,
});
assert.deepStrictEqual(keypair, recovery);
console.log('Expected recovery:', recovery);
const { data: send } = await callAPI('post', 'transactions', {
    private_key:
        '6cfbbd3b57ef8b162a1c758c737654b75bec07f33793b4fee2cfab7b2e6c68065',
    destination:
        'xch1cpvynt305wyhyp2vtljxguzwtwjs77yzhstqtgwx4mfcenkmtm7qpqh82t',
    amount: 1,
});
console.log(send);

// Edge cases.
try {
    const edge = await callAPI('get', 'recover');
    console.error('Edge case passed the test erroneously:', edge.data);
    process.exit(1);
} catch (error) {
    console.error('Should be missing phrase', error.message);
}
try {
    const edge = await callAPI('get', 'recover', {
        phrase: 'test',
    });
    console.error('Edge case passed the test erroneously:', edge.data);
    process.exit(1);
} catch (error) {
    console.error('Should be invalid phrase:', error.message);
}

// Successfully passed and failed all tests.
console.log('Tests complete, no problems found.');
