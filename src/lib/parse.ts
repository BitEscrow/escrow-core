import { Buff } from '@cmdcode/buff'

import {
  ContractData,
  PaymentEntry,
  DepositData,
  ProposalData,
  WitnessData,
  ProgramData,
  CovenantData,
} from '../types/index.js'

import * as schema from '../schema/index.js'

export function parse_network (
  network : unknown
) {
  return schema.base.network.parse(network)
}

export function parse_payments (
  payments : PaymentEntry[]
) : PaymentEntry[] {
  return schema.base.payment.array().parse(payments)
}

export function parse_contract (
  contract : unknown
) : ContractData {
  return schema.contract.data.parse(contract)
}

export function parse_covenant (
  covenant : unknown
) : CovenantData {
  return schema.deposit.covenant.parse(covenant as CovenantData)
}

export function parse_deposit (
  deposit : unknown
) : DepositData {
  return schema.deposit.data.parse(deposit)
}

export function parse_program (
  terms : unknown[]
) : ProgramData {
  const parsed = schema.proposal.terms.parse(terms)
  const [ method, actions, paths, ...params ] = parsed
  const prog_id = Buff.json([ method, ...params ]).digest.hex
  return { prog_id, method, actions, paths, params }
}

export function parse_proposal (
  proposal : unknown
) : ProposalData {
  return schema.proposal.data.parse(proposal)
}

export function parse_witness (
  witness : unknown
) : WitnessData {
  return schema.vm.witness.parse(witness)
}
