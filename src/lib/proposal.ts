import { parse_addr }    from '@scrow/tapscript/address'
import { create_vout }   from '@scrow/tapscript/tx'
import { TxOutput }      from '@scrow/tapscript'
import { parse_program } from './parse.js'
import { regex }         from './util.js'

import {
  Payment,
  PayPath,
  ProgramQuery,
  ProgramTerms
} from '../types/index.js'

type PathTotal = [ path: string, total : number ]

/**
 * Returns an array of payment paths
 * that is filtered by a given label.
 */
export function filter_path (
  label : string,
  paths : PayPath[]
) : PayPath[] {
  return paths.filter(e => e[0] === label)
}

/**
 * Returns an array of unique path names
 * from an array of payment paths.
 */
export function get_path_names (
  paths : PayPath[]
) : string[] {
  return [ ...new Set(paths.map(e => e[0])) ]
}

/**
 * Returns the total value 
 * from an array of payments.
 */
export function get_pay_total (
  payments : Payment[]
) : number {
  return payments.map(e => e[0]).reduce((acc, curr) => acc + curr, 0)
}

/**
 * Returns an array of unique addresses
 * from an array of payment paths.
 */
export function get_addrs (
  paths : PayPath[]
) : string[] {
  return [ ...new Set(paths.map(e => e[2])) ]
}

/**
 * Returns an array of transaction outputs from
 * an array of payment paths and array of payments.
 */
export function get_path_vouts (
  label   : string,
  paths   : PayPath[] = [],
  payouts : Payment[] = []
) : TxOutput[] {
  const filtered : Payment[] = filter_path(label, paths).map(e => [ e[1], e[2] ])
  const template : Payment[] = [ ...filtered.sort(), ...payouts.sort() ]
  return template.map(([ value, addr ]) => {
    const scriptPubKey = parse_addr(addr).asm
    return create_vout({ value, scriptPubKey })
  })
}

/**
 * Returns an array of labeled totals, one
 * for each unique payment path.
 */
export function get_path_total (
  paths : PayPath[]
) : PathTotal[] {
  // Setup an array for out totals.
  const path_totals : PathTotal[] = []
  // Collect a set of unique path names.
  const path_names = get_path_names(paths)
  // For each unique name in the set:
  for (const label of path_names) {
    // Collect all values for that path.
    const val = filter_path(label, paths).map(e => e[1])
    // Reduce the values into a total amount.
    const amt = val.reduce((acc, curr) => acc + curr, 0)
    // Add the total to the array.
    path_totals.push([ label, amt ])
  }
  return path_totals
}

/**
 * Returns a given program from the program terms,
 * based upon the supplied search criteria.
 */
export function find_program (
  query : ProgramQuery,
  terms : ProgramTerms[]
) {
  // Unpack all available terms from the query.
  const { action, includes, method, path, params } = query
  // Convert each ProgramTerm into ProgramData.
  let progs = terms.map(e => parse_program(e))
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
    progs = progs.filter(e => includes.every(x => e.params.includes(x as any)))
  }
  // Return the first program that matches all specified criteria.
  return progs[0]
}
