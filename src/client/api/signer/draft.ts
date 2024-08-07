import { EscrowSigner } from '@/client/class/signer.js'

import {
  get_proposal_id,
  verify_endorsement
} from '@/core/lib/proposal.js'

import {
  CredentialConfig,
  DraftSession
} from '@/client/types/index.js'

import {
  claim_membership,
  create_credential
} from '@/client/lib/membership.js'

import {
  endorse_session,
  join_session,
  leave_session,
  verify_session
} from '@/client/lib/session.js'

export function join_session_api (esigner : EscrowSigner) {
  return (
    pol_id  : string,
    session : DraftSession,
    options : CredentialConfig = {}
  ) : DraftSession => {
    const { hid, idx } = options
    const signer = (hid !== undefined)
      ? esigner._signer.get_id(hid)
      : esigner._signer
    const xpub  = (idx !== undefined)
      ? esigner._wallet.get_account(idx).xpub
      : esigner._wallet.xpub
    const cred  = create_credential(signer, xpub)
    return join_session(cred, pol_id, session)
  }
}

export function leave_session_api (esigner : EscrowSigner) {
  return (session : DraftSession) : DraftSession => {
    const mship = claim_membership(session.members, esigner._signer)
    if (mship === null) return session
    return leave_session(mship, session)
  }
}

export function endorse_session_api (esigner : EscrowSigner) {
  return (session : DraftSession) : DraftSession => {
    verify_session(session)
    // also need to verify mship and role.
    return endorse_session(session, esigner._signer)
  }
}

export function has_membership_api (esigner : EscrowSigner) {
  return (session : DraftSession) : boolean => {
    const mship = claim_membership(session.members, esigner._signer)
    return mship !== null
  }
}

export function has_role_api (esigner : EscrowSigner) {
  return (
    role_id : string,
    session : DraftSession
  ) : boolean => {
    const mship = claim_membership(session.members, esigner._signer)
    return mship?.pid === role_id
  }
}

export function has_signature_api (esigner : EscrowSigner) {
  return (session : DraftSession) : boolean => {
    const pub = esigner.pubkey
    const sig = session.sigs.find(e => e.slice(0, 64) === pub)
    if (sig === undefined) return false
    const prop_id = get_proposal_id(session.proposal)
    verify_endorsement(prop_id, sig)
    return true
  }
}

export default function (esigner : EscrowSigner) {
  return {
    endorse   : endorse_session_api(esigner),
    is_member : has_membership_api(esigner),
    is_role   : has_role_api(esigner),
    is_signed : has_signature_api(esigner),
    join      : join_session_api(esigner),
    leave     : leave_session_api(esigner)
  }
}
