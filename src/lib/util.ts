import { Buff, Bytes } from '@cmdcode/buff'
import { sha256 }      from '@cmdcode/crypto-tools/hash'

import {
  Literal,
  ProgramTerms
} from '@/index.js'

export function fail (
  error : string,
  throws = false
) : false {
  if (!throws) return false
  throw new Error(error)
}

export function exists <T> (
  value ?: T | null
) : value is NonNullable<T> {
  if (typeof value === 'undefined' || value === null) {
    return false
  }
  return true
}

export function get_entry <T = string[]> (
  label   : string,
  entries : [ string, T ][]
) : T {
  const ent = entries.find(e => e[0] === label)
  if (ent === undefined) {
    throw new Error('Entry not found for label: ' + label)
  }
  return ent[1]
}

export function is_hex (
  value : unknown
) : value is string {
  if (
    typeof value === 'string'            &&
    value.match(/[^a-fA-F0-9]/) === null &&
    value.length % 2 === 0
  ) { 
    return true
  }
  return false
}

export function is_hash (value : unknown) : value is string {
  if (is_hex(value) && value.length === 64) {
    return true
  }
  return false
}

export function is_literal (value : unknown) : value is Literal {
  if (
    typeof value === 'string'  ||
    typeof value === 'number'  ||
    typeof value === 'boolean' ||
    typeof value === null
  ) {
    return true
  }
  return false
}

export function is_stamp (value : unknown) : value is number {
  return (
    typeof value === 'number' &&
    value > 500_000_000       &&
    value <= Number.MAX_SAFE_INTEGER
  )
}

export function is_uint (
  value : unknown, 
  max_val = Number.MAX_SAFE_INTEGER
) : value is Number {
  if (typeof value === 'string') {
    value = Number(value)
  }
  if (typeof value !== 'number') {
    return false
  }
  return (
    typeof value === 'number' &&
    !isNaN(value)             && 
    value >= 0                && 
    value <= max_val          && 
    Math.floor(value) === value
  )
}

export function now () {
  return Math.floor(Date.now() / 1000)
}

export function sleep (ms ?: number) {
  return new Promise(res => setTimeout(res, ms ?? 1000))
}

export function regex (
  input   : string,
  pattern : string
) {
  if (pattern === '*') {
    return true
  } else {
    return new RegExp(pattern).test(input)
  }
}

export function get_access_list (
  expr   : string,
  labels : string[]
) {
  let blist : string[], wlist : string[]
  if (expr === '*') {
    wlist = labels
    blist = []
  } else if (expr.includes('|')) {
    wlist = expr.split('|')
    blist = labels.filter(e => !wlist.includes(e))
  } else {
    wlist = [ expr ]
    blist = labels.filter(e => e !== expr)
  }
  return { wlist, blist }
}

export function sort_bytes (
  bytes : Bytes[]
) : string[] {
  return bytes.map(e => Buff.bytes(e).hex).sort()
}

export function sort_record <T extends Record<string, any>> (
  obj : T
) : T {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key]
      return sorted
    }, {} as Record<string, any>) as T
}

export function stringify (content : any) : string {
  switch (typeof content) {
    case 'object':
      return (content !== null)
        ? JSON.stringify(content)
        : 'null'
    case 'string':
      return content
    case 'bigint':
      return String(content)
    case 'number':
      return String(content)
    case 'boolean':
      return String(content)
    case 'undefined':
      return 'undefined'
    default:
      throw new TypeError('Content type not supported: ' + typeof content)
  }
}

export function get_object_id <T extends object> (
  obj : T) : Buff {
  if (Array.isArray(obj) || typeof obj !== 'object') {
    throw new Error('not an object')
  }

  const ent = Object
    .entries(obj)
    .filter(([ _, val ]) => val !== undefined)
    .sort()

  return sha256(Buff.json(ent))
}

export function compare (a : unknown, b : unknown) {
  const a_str = stringify(a)
  const b_str = stringify(b)
  return a_str === b_str
}

export function compare_arr (
  arr1 : Literal[][],
  arr2 : Literal[][]
) {
  const a1 = arr1.map(e => JSON.stringify(e)).sort()
  const a2 = arr2.map(e => JSON.stringify(e)).sort()
  return JSON.stringify(a1) === JSON.stringify(a2)
}

export function get_diff_arr <T> (prev : T, curr : T) {
  if (!Array.isArray(prev) || !Array.isArray(curr)) {
    throw new Error('both values must be an array')
  }
  const a1 = prev.map(e => stringify(e))
  const a2 = curr.map(e => stringify(e))
  return prev.filter((_e, idx) => a1[idx] !== a2[idx]) as T
}

export function find_program_idx (
  progs : ProgramTerms[],
  terms : ProgramTerms,
) {
  const [ method, actions, paths, thold ] = terms
  const idx = progs.findIndex(e => {
    return (e[0] === method && e[1] === actions && e[2] === paths && e[3] === thold)
  })
  return (idx !== -1) ? idx : null
}
