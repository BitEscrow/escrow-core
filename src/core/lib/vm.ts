import { Buff }  from '@cmdcode/buff'

import { assert, now, regex, sort_record } from '../util/index.js'

import {
  ProgramQuery,
  ProgramData,
  ProgramEntry,
  VMConfig,
  VMReceipt,
  SignerAPI,
  VMData,
  ContractData
} from '../types/index.js'

import { get_path_names } from './proposal.js'

export function create_program (
  entry : ProgramEntry
) : ProgramData {
  const [ method, actions, paths, ...params ] = entry
  const prog_id = get_program_id(entry)
  return { prog_id, method, actions, paths, params }
}

/**
 * Returns a given program from the program terms,
 * based upon the supplied search criteria.
 */
export function get_program (
  query    : ProgramQuery,
  programs : ProgramEntry[]
) : ProgramData | undefined {
  // Unpack all available terms from the query.
  const { action, includes, method, path, params } = query
  // Convert each ProgramTerm into ProgramData.
  let progs = programs.map(e => create_program(e))
  // If defined, filter programs by method.
  if (method !== undefined) {
    progs = progs.filter(e => e.method === method)
  }
  // If defined, filter programs by allowed action.
  if (action !== undefined) {
    progs = progs.filter(e => regex(action, e.actions))
  }
  // If defined, filter programs by allowed path.
  if (path !== undefined) {
    progs = progs.filter(e => regex(path, e.paths))
  }
  // If defined, filter programs by matching params and index.
  if (Array.isArray(params)) {
    progs = progs.filter(e => params.every((x, i) => e.params[i] === x))
  }
  // If defined, filter programs by matching params (any index).
  if (Array.isArray(includes)) {
    progs = progs.filter(e => includes.every(x => e.params.includes(x)))
  }
  // Return the first program that matches all specified criteria.
  return progs.at(0)
}

export function get_program_id (
  entry : ProgramEntry
) : string {
  const [ method, _, __, ...params ] = entry
  return Buff.json([ method, ...params ]).digest.hex
}

export function get_program_idx (
  entries : ProgramEntry[],
  program : ProgramEntry
) {
  const [ method, actions, paths, thold ] = program
  const idx = entries.findIndex(e => {
    return (e[0] === method && e[1] === actions && e[2] === paths && e[3] === thold)
  })
  return (idx !== -1) ? idx : null
}

export function get_vm_config (contract : ContractData) : VMConfig {
  const { activated, cid, terms }     = contract
  const { paths, programs, schedule } = terms
  assert.exists(activated)
  const pathnames = get_path_names(paths)
  const vmid      = get_vm_id(activated, cid)
  return { activated, pathnames, programs, schedule, vmid }
}

export function get_vm_id (activated : number, cid : string) {
  const hash  = Buff.hex(cid)
  const stamp = Buff.num(activated, 4)
  return Buff.join([ hash, stamp ]).digest.hex
}

export function create_receipt (
  data   : VMData,
  signer : SignerAPI,
  created_at = now()
) : VMReceipt {
  const hash       = get_receipt_hash(data)
  const server_pk  = signer.pubkey
  const receipt_id = get_receipt_id(hash, server_pk, created_at)
  const server_sig = signer.sign(receipt_id)
  return sort_record({ ...data, created_at, receipt_id, server_pk, server_sig })
}

export function get_receipt_hash (data : VMData) {
  const err   = Buff.str(data.error  ?? 'null')
  const head  = Buff.hex(data.head, 32)
  const out   = Buff.str(data.output ?? 'null')
  const stamp = Buff.num(data.updated, 4)
  const step  = Buff.num(data.step, 4)
  const vmid  = Buff.hex(data.vmid, 32)
  return Buff.join([ err, head, out, stamp, step, vmid ]).digest.hex
}

export function get_receipt_id (
  hash   : string,
  pubkey : string,
  stamp  : number
) {
  const cat = Buff.num(stamp, 4)
  const dig = Buff.hex(hash, 32)
  const pub = Buff.hex(pubkey, 32)
  return Buff.join([ cat, dig, pub ]).digest.hex
}