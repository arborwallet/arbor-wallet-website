# Arbor Wallet API

This is the API documentation for Arbor Wallet. It currently supports basic light wallet functionality.

## Blockchain Model

`name` String  
`unit` String  
`logo` String  
`ticker` String  
`agg_sig_me_extra_data` String  
`precision` Integer  
`blockchain_fee` Integer

```json
{
    "name": "Chia",
    "unit": "Mojo",
    "logo": "/icons/blockchains/chia.png",
    "ticker": "xch",
    "agg_sig_me_extra_data": "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
    "precision": 12,
    "blockchain_fee": 0
}
```

## Send Group Model

`type` "send"  
`transactions` List of Send Transaction  
`timestamp` Integer (Milliseconds Since Epoch)  
`block` Integer  
`fee` Integer

```json
{
    "type": "send",
    "transactions": [
        {
            "destination": "xch1abc",
            "amount": 100
        }
    ],
    "timestamp": 42389610023,
    "block": 812412,
    "fee": 1
}
```

## Receive Group Model

`type` "receive"  
`transactions` List of Receive Transaction  
`timestamp` Integer (Milliseconds Since Epoch)  
`block` Integer  
`fee` Integer

```json
{
    "type": "receive",
    "transactions": [
        {
            "sender": "xch1abc",
            "amount": 100
        }
    ],
    "timestamp": 42389610023,
    "block": 812412,
    "fee": 1
}
```

## Send Model

`destination` String (Address)  
`amount` Integer

```json
{
    "destination": "xch1abc",
    "amount": 100
}
```

## Receive Model

`sender` String (Address)  
`amount` Integer

```json
{
    "sender": "xch1abc",
    "amount": 100
}
```

## Transaction Group Model

Receive Group or Send Group

## Transaction Model

Receive or Send

## Status Codes

`200` The request was valid and the response is the data requested.  
`400` The request was invalid and the response is the error message.  
`500` An internal error occurred and the response is the error message.

## POST `/api/v1/keygen`

Creates a new cryptographically secure BIP-39 mnemonic phrase and AugSchemeMPL keypair.

### Response

`phrase` String  
`public_key` String  
`private_key` String

```json
{
    "phrase": "the quick brown fox jumps over the lazy dog is a sentence",
    "public_key": "cafef00d",
    "private_key": "cafef00d"
}
```

## POST `/api/v1/recover`

Recovers a keypair from a mnemonic phrase.

### Request

`phrase` String

```json
{
    "phrase": "the quick brown fox jumps over the lazy dog is a sentence"
}
```

### Response

`phrase` String  
`public_key` String  
`private_key` String

```json
{
    "phrase": "the quick brown fox jumps over the lazy dog is a sentence",
    "public_key": "cafef00d",
    "private_key": "cafef00d"
}
```

## POST `/api/v1/blockchain`

Fetches the blockchain object from its ticker symbol.

### Request

`blockchain` String

```json
{
    "blockchain": "xch"
}
```

### Response

`blockchain` Blockchain

```json
{
    "blockchain" {
        "name": "Chia",
        "unit": "Mojo",
        "logo": "/icons/blockchains/chia.png",
        "ticker": "xch",
        "agg_sig_me_extra_data": "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
        "precision": 12,
        "blockchain_fee": 0
    }
}
```

## GET `/api/v1/blockchains`

Fetches a list of blockchain objects.

### Response

`blockchains` List of Blockchain

```json
{
    "blockchains": [
        {
            "name": "Chia",
            "unit": "Mojo",
            "logo": "/icons/blockchains/chia.png",
            "ticker": "xch",
            "agg_sig_me_extra_data": "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
            "precision": 12,
            "blockchain_fee": 0
        }
    ]
}
```

## POST `/api/v1/address`

Converts a public key to a light wallet address. Wallet updates will be on new API versions, so continue using this version for old wallets.

### Request

`public_key` String  
`blockchain` String (e.g. `"xch"`)

```json
{
    "public_key": "cafef00d",
    "blockchain": "xch"
}
```

### Response

`address` String

```json
{
    "address": "xch1abc"
}
```

## POST `/api/v1/balance`

`address` String

```json
{
    "address": "xch1abc"
}
```

### Response

`balance` Integer

```json
{
    "balance": 100
}
```

## POST `/api/v1/transactions`

Fetches a list of wallet style transactions on a given address.

### Request

`address` String

```json
{
    "address": "xch1abc"
}
```

### Response

`transaction_groups` List of Transaction Group

```json
{
    "transaction_groups": [
        {
            "type": "receive",
            "transactions": [
                {
                    "sender": "xch1abc",
                    "amount": 100
                }
            ],
            "timestamp": 42389610023,
            "block": 812412,
            "fee": 1
        }
    ]
}
```

## POST `/api/v1/send`

Sends a given amount to a destination, authorized by a private key. The wallet is calculated from the private key on the fly, so it doesn't have to be provided.

### Request

`private_key` String  
`destination` String (Address)  
`amount` Integer  
`fee` Integer

```json
{
    "private_key": "cafef00d",
    "destination": "xch1abc",
    "amount": 100,
    "fee": 0
}
```

### Response

`status` "success"

```json
{
    "status": "success"
}
```
