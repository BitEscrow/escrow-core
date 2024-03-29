/**
 * Deposit API Demo for endpoint:
 * /api/deposit/:dpid/digest
 * 
 * You can run this demo using the shell command:
 * yarn load demo/api/deposit/digest
 */

import { print_banner }   from '@scrow/test'
import { client }         from '@scrow/demo/01_create_client.js'
import { locked_deposit } from '@scrow/demo/07_deposit_funds.js'

// Define the deposit id we will use.
const dpid = locked_deposit.dpid
// Request to read a deposit via dpid.
const res = await client.deposit.digest(dpid)
// Check the response is valid.
if (!res.ok) throw new Error(res.error)
// Unpack the data response
const deposit = res.data.deposit

print_banner('locked deposit digest')
console.dir(deposit, { depth : null })
console.log('\n')
