/**
 * Deposit API Demo for endpoint:
 * /api/deposit/list/:pubkey
 * 
 * You can run this demo using the shell command:
 * yarn load demo/api/deposit/list
 */

import { print_banner } from '@scrow/test'
import { client }       from '@scrow/demo/01_create_client.js'
import { signers }      from '@scrow/demo/02_create_signer.js'

// Define our funder for the deposit.
const signer = signers[0]
// Generate a request token.
const req = signer.deposit.list()
// Deliver the request and token.
const res = await client.deposit.list(req)
// Check the response is valid.
if (!res.ok) throw new Error(res.error)
// Unpack our response data.
const { deposits } = res.data

print_banner('deposit list')
console.dir(deposits, { depth : null })
console.log('\n')
