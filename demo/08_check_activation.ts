import { print_banner }    from '@scrow/test'
import { sleep }           from '@scrow/sdk/util'

import { config }          from './00_demo_config.js'
import { client }          from './01_create_client.js'
import { funded_contract } from './07_deposit_funds.js'

const DEMO_MODE = process.env.VERBOSE === 'true'

/**
 * We are going to poll the escrow server and watch for the
 * contract to activate. The contract will only activate once
 * all funding is confirmed on-chain, and the effective date
 * of the contract has passed.
 */
const [ ival, retries ] = config.poll

let res   = await client.contract.read(funded_contract.cid),
    tries = 1

if (DEMO_MODE || config.network !== 'regtest') {
  print_banner('awaiting confirmation of funds')
  console.log('depending on the network, this could take a while!\n')
}

// While our response is ok, but the contract is not active (and we have tries):
while (res.ok && !res.data.contract.activated && tries < retries) {
  // Print our current status to console.
  console.log(`[${tries}/${retries}] re-checking contract in ${ival} seconds...`)
  // Sleep for interval seconds.
  await sleep(ival * 1000)
  // Fetch the latest contract data.
  res = await client.contract.read(funded_contract.cid)
  // Increment our tries counter
  tries += 1
}

// If the response failed, throw error.
if (!res.ok) throw new Error(res.error)

// If the contract is still inactive, throw error.
if (!res.data.contract.activated) {
  throw new Error('contract is not active')
}

export const active_contract = res.data.contract

if (DEMO_MODE) {
  print_banner('active contract')
  console.dir(active_contract, { depth : null })
}
