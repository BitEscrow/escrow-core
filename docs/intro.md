# Introduction

BitEscrow is a protocol for privately depositing Bitcoin into a non-custodial, covenant-based smart contract.

Key Features Include:

  * __100% private.__ All on-chain transactions appear as single-key spends. Participation is done through randomly generated credentials. Only requires a signing key (hot), and wallet xpub (cold) to participate.

  * __100% non-custodial.__ Money is secured in a collaborative 2-of-2 contract. All payouts are pre-signed before deposit. Addresses are generated from a cold-stored xpub of your choice.

  * __100% auditable.__ All contract terms, inputs, and operations are signed and recorded in a commit chain. Each settlement transaction is backed by an auditable commit history.

  * __Designed for trustless environments.__ Signing keys are disposable and have no capacity to sweep funds. Terms are signed up-front and verified before deposit.

  * __Designed to be robust.__ Deposits are reusable when a contract cancels or expires. Credentials are recoverable via your xpub. Refunds are secured upfront and broadcast automatically on expiration.

## Protocol Overview

The complete protocol involves three rounds of communication, split between three parties:

`Members`  : Those participating within the contract.
`Funders`  : Those depositing funds into the contract.
`Provider` : The server hosting the contract (BitEscrow API).

The three rounds of communication are _negotiation_, _funding_, and _settlement_.

### Negotiation

The first step is to negotiate and agree on a [proposal](data/draft.md#proposaldata) document. This is a human-readable document which contains all of the initial terms of the contract.

It is written in JSON format, and designed for collaboration (much like a PSBT):

```ts
{
  title    : 'Basic two-party contract with third-party dispute resolution.',
  content  : '{}',
  duration : 14400,  // 4 hours.
  network  : 'regtest',
  paths: [
    [ 'payout', 90000, 'bcrt1qhlm6uva0q2m5dq4kjd9uzsankkxe9pza5uylcs' ],
    [ 'return', 90000, 'bcrt1qemwtdfh9uncvw7jlq4ux7p7stl9lgvfxa8t05g' ]
  ],
  payments : [[ 10000, 'bcrt1qxemag7t72rlrhl2ezsnsprmunmnzc35nmaph6v' ]],
  programs : [
    [ 'endorse', 'dispute',       '*', 1, '9997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803be' ],
    [ 'endorse', 'resolve',       '*', 1, '9094567ba7245794198952f68e5723ac5866ad2f67dd97223db40e14c15b092e' ],
    [ 'endorse', 'close|resolve', '*', 2, 
      '9997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803be',
      '4edfcf9dfe6c0b5c83d1ab3f78d1b39a46ebac6798e08e19761f5ed89ec83c10'
    ]
  ],
  schedule : [[ 7200, 'close', 'payout|return' ]],
  value    : 100000,
  version  : 1
}
```

You can share this document peer-to-peer, or use a third-party for collaboration. The protocol is designed for third-party platforms to assist with negotiation and offer their own services (such as arbitration).

Once the terms have been decided, any member can deliver the final proposal to the escrow server. The server will validate all terms, then publish an open [contract](wiki/contract.md) for funding.

> Note: The escrow server does not take part in negotiations. While BitEscrow may offer these services, the protocol is designed so that members can negotiate freely, without the server being involved.

### Funding

To deposit funds into a contract, each funder requests a [Deposit Account](data/deposit.md#depositaccount) from the server. This account uses a 2-of-2 multi-signature address with a time-locked refund path.

```ts
interface DepositAccount {
  acct_id    : string  // Hash identifer for the account record.
  acct_sig   : string  // Signature for the account record.
  address    : string  // On-chain address for receiving funds.
  agent_id   : string  // Identifier of the deposit agent.
  agent_pk   : string  // Public key of the deposit agent.
  created_at : number  // Account creation timestamp (in seconds).
  deposit_pk : string  // Public key of the funder making the deposit.
  sequence   : number  // Locktime converted into a sequence value.
  spend_xpub : string  // The extended key used for returning funds.
}
```

The funder independently verifies the account information, then sends their funds into the account address. Once the transaction is available in the mempool, the funder can register their deposit with the server.

To lock funds to a contract, the funder produces a batch of signatures, one for each spending path in the contract. These signatures authorize the contract to spend the deposit based on the contract terms. The combination of these signatures form a [Covenant](data/deposit.md#covenantdata) with the contract.

```ts
interface CovenantData {
  cid    : string  // Id of the contract you are signing for.
  pnonce : string  // Public nonce of the signer.
  // List of labeled partial signatures for the covenant.
  psigs  : [ label : string, psig : string ][]
}
```

Once a covenant is made, the funds are locked to the contract. When enough funds have been confirmed, the contract becomes active.

### Settlement

The final round of the protocol is the `settlement`. This is the most exciting round, as members get to decide how the money shall be spent.

Each contract comes with a tiny virtual machine called a CVM. When the contract activates, this machine is initialized with the terms of the proposal:

```ts
vm_state: {
  commits  : [],
  error    : null,
  head     : 'b70704c41e27d5f35a11ae7c6e5976501aa1380195714007197d7f47934dcf69',
  output   : null,
  paths    : [ [ 'payout', 0 ], [ 'return', 0 ] ],
  start : 1706511301,
  steps : 0,
  store : [
    [ '054fef5ba39416260ea4b48e9c557ee7e45d780d04b28e094d110459b971b78b', '[]' ],
    [ 'cf236c4e91678bddaaa482d41720f277bb7d2e4540a0fc47736b999a54d29e39', '[]' ],
    [ 'e7862cbeb981d295639af3e91661fc96e0f97b429e9ff2985d20a654667d167a', '[]' ]
  ],
  status  : 'init',
  tasks   : [ [ 7200, 'close', 'payout|return' ] ],
  updated : 1706511301
}
```

A git-style hash chain is also created, starting with the contract's identifier (cid).

Members of the contract can interact with the CVM by submitting a signed statement, called a [witness](data/witness.md#witnessdata). Members use these statements to instruct the CVM to perform a basic set of operations.

Each operation targets a spending path in the contract. Operations include `lock`, `release`, `close` and `dispute`:

```ts
// An example witness statement, endorsed with two signatures.
{
  action  : 'close',
  args    : [],
  method  : 'endorse',
  path    : 'tails',
  prog_id : '054fef5ba39416260ea4b48e9c557ee7e45d780d04b28e094d110459b971b78b',
  sigs    : [
    'effe19ba82f5451739b1d3471dae675c476147bab74e6654f1aaba82e2d96d9f...',
    'f1b1d3a097db6acb76e9296e1e41db169a781813301b4853207ee3b6e39c72b9...'
  ],
  stamp   : 1706511302,
  wid     : '8859eb66bf8fd0d2868d74fefbbaf5f73408c9072c99b4d8df3348f1479bf5f5'
}
```

Every statement that updates the CVM is recorded into the hash-chain. This chain validates the full execution history of the machine, from activation to settlement:

```ts
vm_state: {
  commits: [[
    // Position of the commit in the chain,
    step   : 0,
    // UTC timestamp of the commit.
    stamp  : 1706511302,
    // Previous head, before the commit.
    head   : 'b70704c41e27d5f35a11ae7c6e5976501aa1380195714007197d7f47934dcf69',
    // The witness id of the statement being committed.
    wid    : '8859eb66bf8fd0d2868d74fefbbaf5f73408c9072c99b4d8df3348f1479bf5f5',
    // The action that was performed.
    action : 'close',
    // The path that was evaluated.
    path   : 'tails'
  ]],
  // The (now updated) head of the chain.
  head: '41cf5e1a716067f9255580c96a808d5999c602fb2092b1789fb1ffb574c93597',
}
```

Once the CVM has evaluated a spending path, the server will complete the signatutes for the selected path, then settle the contract with a final transaction. Each member runs their own execution of the CVM and verifies that the contract settled correctly.

### Protocol Flow

To demonstrate the flow of the protocol through various paths and outcomes, we'll walk through a sales agreement between three parties: **Alice** (the *buyer*), **Bob** (the *seller*), and **Carol** (third-party *arbitrator*).

**Negotiation and Funding**

1. Alice and Bob prepare a proposal, and agree on terms / arbitration.
2. Alice submits the proposal to the agent and receives a contract.
3. Alice deposits her funds with the contract agent, along with a covenant.
4. Once the deposit is confirmed on-chain, the contract becomes active.

**Settle on Payout (happy path)**  

5. Alice receives her widget and forgets about Bob.  
6. The contract schedule closes automatically on 'payout'.  
7. Bob gets the funds, Alice can verify the CVM execution.  

**Settle on Refund (neutral path)**  

5. Alice doesn't like her widget.  
6. Alice and Bob both agree to sign the 'refund' path.  
7. Alice gets a partial refund, Bob still keeps his fees.  

**Settle a Dispute (unhappy path)**  

5. Alice didn't get the right widget, and disputes the payout.  
6. Carol steps in, and decides on the 'refund' path.  
7. Alice gets a partial refund, Bob still keeps his fees.  

**Contract Expires (ugly path)**  

5. Alice claims she didn't get a widget, and disputes the payout.  
6. Carol is on a two-week cruise in the bahamas. No auto-settlement terms were set.  
7. The contract expires, all deposits are released.  

**Deposits Expire (ugliest path)**  

5. Everything above happens, except the last part.  
6. The entire escrow platform goes down in flames.  
7. The timelock on deposits expire, Alice can spend via the refund path.

Even in a worst-case scenario, deposits are recoverable by the time-locked refund path.

### Security Model

A brief description of the security model:

  * Each member participates using an anonymous credential. Credentials can be verified and claimed without revealing the owner to the escrow server.
  
  * Members decide the terms of the proposal and all spending paths. The escrow server is not involved until the terms have already been finalized.

  * Anyone can choose to endorse a proposal to publicize their support. Members do not reveal their credential by making an endorsement.

  * Funders decide what transactions to sign and deliver to the escrow server. If there's a disagreement, funders can refund a deposit collaboratively or wait out the timelock.

  * The escrow server cannot link funders to a member of the contract.

  * The escrow server can only settle using transactions provided by funders.
  
  * All parites independently verify the progression of the contract and final settlement. If the server settles a contract without a valid proof, their reputation is burned.

Some challenges with the current model:

  * The escrow server has an ability to censor members of a contract by ignoring their statements. In the short term, we plan to mitigate this using time-stamped delivery receipts. In the long-term, we plan to support open platforms (such as nostr) where delivery can be independently verified.

  * Even with the covenant restrictions, the burning of reputation may not be considered strong enough incentive. We are exploring additional options, such as the server staking some collateral.

In terms of security, speed, and simplicity, we believe this is the best non-custodial solution for providing programmable escrow contracts on Bitcoin.
