# ArborWallet API
This is rough documentation of the API for ArborWallet. It currently supports basic light wallet functionality.

## Fork Structure
* `name` String (e.g. `"Chia"`)
* `ticker` String (e.g. `"xch"`)
* `unit` String (e.g. `"mojo"`)
* `precision` Integer (e.g. `12`)

## Send Transaction Structure
* `type` "send"
* `timestamp` Integer (Milliseconds Since Epoch)
* `block` Integer
* `destination` String (Address)
* `amount` Integer

## Receive Transaction Structure
* `type` "receive"
* `timestamp` Integer (Milliseconds Since Epoch)
* `block` Integer
* `sender` String (Address)
* `amount` Integer

## Transaction Structure
Either Receive Transaction or Send Transaction

---
## GET `/api/v1/keygen`
Creates a new cryptographically secure BIP-39 mnemonic phrase and AugSchemeMPL keypair.
### Response
* `phrase` String
* `public_key` String
* `private_key` String
---
## GET `/api/v1/recover`
Recovers a keypair from a mnemonic phrase.
### Request
* `phrase` String
### Response
* `phrase` String
* `public_key` String
* `private_key` String
---
## GET `/api/v1/wallet`
Converts a public key to a light wallet address. Wallet updates will be on new API versions, so continue using this version for old wallets.
### Request
* `public_key` String
* `fork` String (e.g. `"xch"`)
### Response
* `address` String
* `fork` Fork
---
## GET `/api/v1/balance`
* `address` String
### Response
* `balance` Integer
* `fork` Fork
---
## GET `/api/v1/transactions`
Fetches a list of wallet style transactions on a given address.
### Request
* `address` String
### Response
* `transactions` Transaction List
* `fork` Fork
---
## POST `/api/v1/transactions`
Sends a given amount to a destination, authorized by a private key. The wallet is calculated from the private key on the fly, so it doesn't have to be provided.
### Request
* `private_key` String
* `amount` Integer
* `destination` String (Address)
### Response
* `status` "success"
* `fork` Fork