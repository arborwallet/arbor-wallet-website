import { bech32m } from 'bech32';
import { BinaryLike, createHash } from 'crypto';

export function sha256(text: BinaryLike): string {
    return createHash('sha256').update(text).digest('hex');
}

export function formatHash(text: string): string {
    if (!/^0[xX]/.test(text)) return `0x${text}`;
    return text;
}

export function unformatHash(text: string): string {
    if (/^0[xX]/.test(text)) return text.slice(2);
    return text;
}

export function encodeString(text: string) {
    let array = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) array[i] = text.charCodeAt(i);
    return array;
}

export function decodeString(array: Uint8Array) {
    let text = '';
    for (let i = 0; i < array.length; i++)
        text += String.fromCharCode(array[i]);
    return text;
}

export function addressToHash(address: string) {
    try {
        return toHexString(
            convertBits(bech32m.decode(address).words, 5, 8, false)
        );
    } catch {
        return null;
    }
}

export function hashToAddress(puzzleHash: string, prefix: string) {
    try {
        return bech32m.encode(
            prefix,
            convertBits(toByteArray(puzzleHash), 8, 5, true)
        );
    } catch {
        return null;
    }
}

function convertBits(
    data: number[],
    fromBits: number,
    toBits: number,
    pad: boolean
) {
    let acc = 0;
    let bits = 0;
    let maxv = (1 << toBits) - 1;
    let ret = [];
    for (const value of data) {
        const b = value & 0xff;
        if (b < 0 || b >> fromBits > 0)
            throw new Error('Could not convert bits.');
        acc = (acc << fromBits) | b;
        bits += fromBits;
        while (bits >= toBits) {
            bits -= toBits;
            ret.push((acc >> bits) & maxv);
        }
    }
    if (pad && bits > 0) {
        ret.push((acc << (toBits - bits)) & maxv);
    } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv) != 0) {
        throw new Error('Could not convert bits.');
    }
    return ret;
}

export function toHexString(byteArray: number[]) {
    return byteArray
        .map((byte) => {
            return ('0' + (byte & 0xff).toString(16)).slice(-2);
        })
        .join('');
}

export function toByteArray(hexString: string) {
    var result = [];
    for (var i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
}
