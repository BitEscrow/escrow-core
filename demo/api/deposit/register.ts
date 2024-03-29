/**
 * Deposit API Demo for endpoint:
 * /api/deposit/:dpid/register
 * 
 * You can run this demo using the shell command:
 * yarn load demo/api/deposit/register
 */

import { print_banner } from '@scrow/test'
import { config }       from '@scrow/demo/00_demo_config.js'
import { client }       from '@scrow/demo/01_create_client.js'
import { new_account }  from '@scrow/demo/06_request_account.js'

import {
  fund_mutiny_address,
  fund_regtest_address,
  sleep
} from '@scrow/demo/util.js'

// Unpack account details.
const { address, deposit_pk, sequence, spend_xpub } = new_account
// Define how much sats we want to deposit
const amt_total = 20_000
// Also compute a total amount in bitcoin.
const btc_total = amt_total / 100_000_000

/** ========== [ Print Deposit Info ] ========== **/

switch (config.network) {
  case 'mutiny':
    fund_mutiny_address(address, amt_total)
    break
  case 'regtest':
    fund_regtest_address(address, amt_total)
    break
  default:
    print_banner('make a deposit')
    console.log('copy this address :', address)
    console.log('send this amount  :', `${amt_total} sats || ${btc_total} btc`)
    console.log('get funds here    :', config.faucet, '\n')   
}

await sleep(2000)

/** ========== [ Poll Deposit Status ] ========== **/

// Define our polling interval and retries.
const [ ival, retries ] = config.poll
// Poll for utxos from the account address.
const utxos = await client.oracle.poll_address(address, ival, retries, true)

print_banner('address utxos')
console.log('utxos:', utxos)

// Get the output data from the utxo.
const utxo = utxos[0].txspend
// Create a registration request.
const req = { deposit_pk, sequence, spend_xpub, utxo }
// Deliver our registration request to the server.
const res = await client.deposit.register(req)
// Check the response is valid.
if (!res.ok) throw new Error(res.error)
// Unpack our data object.
export const open_deposit = res.data.deposit

print_banner('open deposit')
console.dir(open_deposit, { depth: null })
console.log('\n')
