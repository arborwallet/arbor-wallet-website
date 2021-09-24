# ArborWallet API
This is rough documentation of the API for ArborWallet. It currently supports basic light wallet functionality.

## Structures

### Fork Structure
* `name` String (e.g. `"Chia"`)
* `unit` String (e.g. `"Mojo"`)
* `ticker` String (e.g. `"xch"`)
* `precision` Integer (e.g. `12`)

### Send Transaction Group Structure
* `type` "send"
* `transactions` List of Send Transaction
* `timestamp` Integer (Milliseconds Since Epoch)
* `block` Integer
* `fee` Integer

### Receive Transaction Group Structure
* `type` "receive"
* `transactions` List of Receive Transaction
* `timestamp` Integer (Milliseconds Since Epoch)
* `block` Integer
* `fee` Integer

### Send Transaction Structure
* `destination` String (Address)
* `amount` Integer

### Receive Transaction Structure
* `sender` String (Address)
* `amount` Integer

### Transaction Group Structure
Either Receive Transaction Group or Send Transaction Group

### Transaction Structure
Either Receive Transaction or Send Transaction

## Status Codes
* `200` The request was valid and the response is the data requested.
* `400` The request was invalid and the response is the error message.
* `500` An internal error occurred and the response is the error message.

### POST `/api/v1/keygen`
Creates a new cryptographically secure BIP-39 mnemonic phrase and AugSchemeMPL keypair.
#### Response
* `phrase` String
* `public_key` String
* `private_key` String

### POST `/api/v1/recover`
Recovers a keypair from a mnemonic phrase.
#### Request
* `phrase` String
#### Response
* `phrase` String
* `public_key` String
* `private_key` String

### POST `/api/v1/fork`
Fetches the fork object from its ticker symbol.
#### Request
* `fork` String
#### Response
* `fork` Fork

### GET `/api/v1/forks`
Fetches a list of fork objects.
#### Response
* `forks` List of Fork

### POST `/api/v1/address`
Converts a public key to a light wallet address. Wallet updates will be on new API versions, so continue using this version for old wallets.
#### Request
* `public_key` String
* `fork` String (e.g. `"xch"`)
#### Response
* `address` String

### POST `/api/v1/balance`
* `address` String
#### Response
* `balance` Integer

### POST `/api/v1/transactions`
Fetches a list of wallet style transactions on a given address.
#### Request
* `address` String
#### Response
* `transactions` Transaction List

### POST `/api/v1/send`
Sends a given amount to a destination, authorized by a private key. The wallet is calculated from the private key on the fly, so it doesn't have to be provided.
#### Request
* `private_key` String
* `destination` String (Address)
* `amount` Integer
* `fee` Integer
#### Response
* `status` "success"