import { verify_sig } from '@cmdcode/crypto-tools/signer'

import {
  decode_tx,
  encode_tx,
  parse_txid
} from '@scrow/tapscript/tx'

import * as assert from '@/assert.js'
import { VM }      from '@/vm/index.js'

import { get_proposal_id } from '../lib/proposal.js'
import { create_txinput }  from '../lib/tx.js'

import {
  create_spend_templates,
  get_contract_id,
  get_spend_template,
  get_vm_config
} from '../lib/contract.js'

import {
  validate_proposal,
  verify_proposal
} from './proposal.js'

import {
  ContractData,
  ContractRequest,
  ProposalData,
  TxOutput,
  VMBase,
  VMReceipt,
  WitnessData
} from '../types/index.js'

import ContractSchema from '../schema/contract.js'
import { verify_vm_receipt } from './vm.js'

export function validate_contract (
  contract : unknown
) : asserts contract is ContractData {
  void ContractSchema.data.parse(contract)
}

export function verify_contract_req (
  request : ContractRequest
) {
  const { proposal, signatures } = request
  validate_proposal(proposal)
  verify_proposal(proposal)
  verify_endorsements(proposal, signatures)
}

export function verify_contract (
  contract  : ContractData,
  proposal  : ProposalData,
  server_pk : string
) {
  const { fees, published, sig } = contract
  const out = create_spend_templates(proposal, fees)
  const pid = get_proposal_id(proposal)
  const cid = get_contract_id(out, pid, published)
  assert.ok(pid === contract.prop_id, 'prop_id does not match contract')
  assert.ok(cid === contract.cid,     'cid id does not match contract')
  for (const [ label, txhex ] of out) {
    const tmpl = contract.outputs.find(e => e[0] === label)
    assert.ok(tmpl !== undefined, 'output template does not exist for label: ' + label)
    assert.ok(tmpl[1] === txhex,  'tx hex does not match output for label: ' + label)
  }
  assert.ok(verify_sig(sig, cid, server_pk), 'signature is invalid for server pubkey: ' + server_pk)
}

export function verify_activation (
  contract : ContractData,
  state    : VMBase
) {
  const { activated, vmid } = contract
  assert.ok(activated !== null,            'contract activated date is null')
  assert.ok(vmid !== null,                 'contract vmid is null')
  assert.ok(activated === state.activated, 'contract activated date does not match vm')
  assert.ok(vmid === state.vmid,           'contract vmid does not match vm')
}

export function verify_execution (
  contract   : ContractData,
  receipt    : VMReceipt,
  server_pk  : string,
  statements : WitnessData[]
) {
  // Compute the vm configuration.
  const vm_config = get_vm_config(contract)
  // Initialize the vm state.
  let vm_state  = VM.init(vm_config)
  // Verify the activation of the vm.
  verify_activation(contract, vm_state)
  // Update the vm state for each witness.
  for (const witness of statements) {
    vm_state = VM.eval(vm_state, witness)
  }
  // Verify the final vm state with the receipt.
  verify_vm_receipt(receipt, server_pk, vm_state)
}

export function verify_settlement (
  contract   : ContractData,
  statements : WitnessData[],
  utxos      : TxOutput[]
) {
  // Unpack the contract object.
  const { spent_at, spent_txid } = contract
  // Assert the spent timestamp and txid exists.
  assert.ok(spent_at !== null,   'contract spent_at is null')
  assert.ok(spent_txid !== null, 'contract spent_txid is null')
  // Compute the vm configuration.
  const vm_config = get_vm_config(contract)
  // Initialize the vm state.
  let vm_state  = VM.init(vm_config)
  // Verify the activation of the vm.
  verify_activation(contract, vm_state)
  // Update the vm state for each witness.
  for (const witness of statements) {
    vm_state = VM.eval(vm_state, witness)
  }
  // Run the vm up to the final timestamp.
  vm_state = VM.run(vm_state, spent_at)
  // Assert the state output is not null.
  assert.ok(vm_state.output !== null, 'contract vm output is null')
  // Get the spend template for the provided output.
  const output = get_spend_template(vm_state.output, contract.outputs)
  // Convert the output into a txdata object.
  const txdata = decode_tx(output, false)
  // Add each utxo to the txdata object.
  for (const utxo of utxos) {
    const vin = create_txinput(utxo)
    txdata.vin.push(vin)
  }
  // Encode the new tx as a segwit transaction.
  const txhex = encode_tx(txdata)
  // Compute the final transaction id.
  const txid  = parse_txid(txhex)
  // Assert that the transaction id matches.
  assert.ok(txid === contract.spent_txid, 'settlement txid does not match contract')
}

export function verify_endorsements (
  proposal   : ProposalData,
  signatures : string[] = []
) {
  // List all pubkeys in proposal.
  const prop_id = get_proposal_id(proposal)
  for (const signature of signatures) {
    const pub = signature.slice(0, 64)
    const sig = signature.slice(64)
    assert.ok(verify_sig(sig, prop_id, pub), 'signature is invalid for pubkey: ' + pub)
  }
}
