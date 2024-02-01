# Server Docs

## Connecting to our Server

BitEscrow currently provides an escrow server for the `signet`, `testnet`, and `mutiny` networks. Check out our list of client configurations below.

### Mutiny Configuration

To connect your EscrowClient to our `mutiny` server, use the following config:

```ts
const config = {
  hostname : 'https://bitescrow-mutiny.vercel.app',
  oracle   : 'https://mutinynet.com',
  network  : 'mutiny'
}
```

### Signet Configuration

To connect your EscrowClient to our `signet` server, use the following config:

```ts
const config = {
  hostname : 'https://bitescrow-signet.vercel.app',
  oracle   : 'https://mempool.space/signet',
  network  : 'signet'
}
```

### Testnet Configuration

To connect your EscrowClient to our `testnet` server, use the following config:

```ts
const config = {
  hostname : 'https://bitescrow-testnet.vercel.app',
  oracle   : 'https://mempool.space/testnet',
  network  : 'testnet'
}
```