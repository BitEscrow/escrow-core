/* Global Imports */

import { Test }       from 'tape'
import { CoreClient } from '@cmdcode/core-cmd'
import { P2TR }       from '@scrow/tapscript/address'
import { parse_txid } from '@scrow/tapscript/tx'

/* Package Imports */

import {
  create_account,
  create_account_req,
} from '@scrow/sdk/account'

import { now } from '@scrow/sdk/util'

import {
  close_deposit,
  create_deposit,
  create_register_req
} from '@scrow/sdk/deposit'

import {
  get_recovery_config,
  get_recovery_tx,
  sign_recovery_tx
} from '@scrow/sdk/recovery'

import {
  verify_account_req,
  verify_account,
  verify_deposit,
  verify_register_req
} from '@scrow/sdk/verify'

/* Local Imports */

import {
  fund_address,
  get_members,
  get_utxo
} from '../core.js'

import ServerPolicy from '../config/policy.json' assert { type: 'json' }

const VERBOSE = process.env.VERBOSE === 'true'

const AMOUNT   = 100_000
const FEERATE  = 1
const LOCKTIME = 172800
const NETWORK  = 'regtest'

export default async function (
  client  : CoreClient,
  tape    : Test
) {
  tape.test('E2E Recovery Test', async t => {
    try {

      /* ------------------- [ Init ] ------------------- */

      const banner   = (title : string) => `\n\n=== [ ${title} ] ===`.padEnd(80, '=') + '\n\n'
      const aliases  = [ 'agent', 'alice' ]
      const users    = await get_members(client, aliases)

      const [ server, funder ] = users

      const funder_sd  = funder.signer
      const server_sd  = server.signer
      const server_pol = ServerPolicy

      /* ------------------- [ Create Account ] ------------------ */

      //
      const return_addr = P2TR.create(funder_sd.pubkey, NETWORK)
      // Client: Create account request.
      const acct_req = create_account_req(funder_sd.pubkey, LOCKTIME, NETWORK, return_addr)
      // Server: Verify account request.
      verify_account_req(server_pol, acct_req)
      // Server: Create account data.
      const account = create_account(acct_req, server_sd)
      // Client: Verify account data.
      verify_account(account, funder_sd)

      if (VERBOSE) {
        console.log(banner('account'))
        console.dir(account, { depth : null })
      } else {
        t.pass('account ok')
      }

      /* ------------------- [ Create Deposit ] ------------------- */

      // Fund deposit address and get txid.
      const dep_txid = await fund_address(client, 'faucet', account.deposit_addr, AMOUNT, false)
      // Fetch the utxo for the funded address.
      const utxo     = await get_utxo(client, account.deposit_addr, dep_txid)
      // Client: Create the commit request.
      const reg_req  = create_register_req(FEERATE, account, funder_sd, utxo)
      // Server: Verify the registration request.
      verify_register_req(server_pol, reg_req, server_sd)
      // Server: Create the deposit data.
      const deposit  = create_deposit({}, reg_req, server_sd)
      // Client: Verify the deposit data.
      verify_deposit(deposit, funder_sd)

      await client.mine_blocks(1)

      if (VERBOSE) {
        console.log(banner('deposit'))
        console.dir(deposit, { depth : null })
      } else {
        t.pass('deposit ok')
      }

      /* ------------------ [ Recover Deposit ] ------------------ */

      const rec_config = get_recovery_config(deposit)
      const template   = get_recovery_tx(rec_config, FEERATE, return_addr, utxo)
      const signed_tx  = sign_recovery_tx(rec_config, funder_sd, template, utxo)
      const txid       = parse_txid(template)
      const dp_closed  = close_deposit(deposit, now(), txid)

      if (VERBOSE) {
        console.log(banner('deposit closed'))
        console.dir(dp_closed, { depth : null })
      } else {
        t.pass('closed ok')
      }

      let is_valid = false

      try {
        await client.publish_tx(signed_tx, true)
      } catch (err) {
        const { message } = err as Error
        is_valid = message.includes('non-BIP68-final')
      }

      if (VERBOSE) {
        console.log(banner('closing tx'))
        console.dir(signed_tx, { depth : null })
      }

      t.true(is_valid, 'recovery tx rejected with non-BIP68-final')
    } catch (err) {
      const { message } = err as Error
      console.log(err)
      t.fail(message)
    }
  })
}