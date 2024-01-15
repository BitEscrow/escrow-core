import { Buff }           from "@cmdcode/buff"
import { Signer, Wallet } from "@cmdcode/signer"
import { EscrowMember }   from "@/client/class/member.js"

/**
 * Take a string label as input, and return an
 * escrow client that is configured for testing.
 */
export function get_member (
  alias : string
) : EscrowMember {
  // Freeze the idx generation at 0 for test purposes.
  const idxgen = () => 0
  // Create a basic deterministic seed.
  const seed   = Buff.str(alias).digest
  // Create a new signer using the seed.
  const signer = new Signer({ seed })
  // Create a new wallet using the seed.
  const wallet = Wallet.create({ seed, network : 'regtest' })
  // Return an escrow client.
  return new EscrowMember({ idxgen, signer, wallet })
}

/**
 * Create a banner message in the console.
 */
export function print_banner (msg : string) {
  console.log('\n' + '='.repeat(80))
  console.log(` ${msg} `)
  console.log('='.repeat(80) + '\n')
}