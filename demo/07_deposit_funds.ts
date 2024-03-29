import { print_banner } from '@scrow/test'
import { config }       from './00_demo_config.js'
import { client }       from './01_create_client.js'
import { signers }      from './02_create_signer.js'
import { new_contract } from './05_create_contract.js'
import { new_account }  from './06_request_account.js'

import {
  fund_regtest_address,
  fund_mutiny_address,
  sleep
} from './util.js'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

/** ========== [ Verify the Account ] ========== **/

// Define our depositor from the signers.
export const depositor = signers[0]
// Verify the deposit.
depositor.account.verify(new_account)

/** ========== [ Calculate Deposit Amount ] ========== **/

// Unpack account address.
const { address } = new_account
// Compute a txfee from the feerate.
const vin_fee   = new_contract.feerate * 65
// Compute a total amount (in sats) with the txfee.
const amt_total = new_contract.total + vin_fee
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

const [ ival, retries ] = config.poll

let tries = 1,
    utxos = await client.oracle.get_address_utxos(address)

// While there are no utxos (and we still have tries):
while (utxos.length === 0 && tries < retries) {
  // Print current status to console.
  console.log(`[${tries}/${retries}] checking address in ${ival} seconds...`)
  // Sleep for interval number of secords.
  await sleep(ival * 1000)
  // Check again for utxos at address.
  utxos = await client.oracle.get_address_utxos(address)
  // Increment our tries counter
  tries += 1
}

// If we still have no utxos, throw error.
if (utxos.length === 0) throw new Error('utxo not found')

if (DEMO_MODE) {
  console.log('\nutxo:', utxos[0])
}

/** ========== [ Create Deposit Covenant ] ========== **/

// Choose our first signer as the funder.
const signer     = signers[0]
// Get the output data from the utxo.
const utxo       = utxos[0].txspend
// Request the funders device to sign a covenant.
const commit_req = signer.account.commit(new_account, new_contract, utxo)
// Deliver our registration request to the server.
const res = await client.deposit.commit(commit_req)
// Check the response is valid.
if (!res.ok) throw new Error(res.error)

/**
 * Define our deposit and funded contract.
 */
export const funded_contract = res.data.contract
export const locked_deposit  = res.data.deposit

/** ========== [ Export New Data ] ========== **/

if (DEMO_MODE) {
  print_banner('locked deposit')
  console.dir(locked_deposit, { depth : null })

  print_banner('funded contract')
  console.dir(funded_contract, { depth : null })
}
