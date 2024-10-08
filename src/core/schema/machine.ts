import { z } from 'zod'
import base  from '@/schema/base.js'
import prop  from './proposal.js'
import wit   from './witness.js'

const { bool, hash, literal, num, regex, stamp, str } = base

const config = z.object({
  active_at  : stamp,
  engine     : str,
  expires_at : stamp,
  pathnames  : str.array(),
  programs   : prop.programs,
  schedule   : prop.schedule,
  vmid       : hash
})

const program = z.object({
  prog_id : hash,
  method  : str,
  actions : regex,
  params  : literal.array(),
  paths   : regex
})

const close_info = z.object({
  closed    : bool,
  closed_at : stamp.nullable()
})

const vm_open = z.object({
  closed    : z.literal(false),
  closed_at : z.null()
})

const vm_closed = z.object({
  closed    : z.literal(true),
  closed_at : stamp
})

const close_state = z.discriminatedUnion('closed', [ vm_open, vm_closed ])

const submit_req = z.object({
  witness : wit.data
})

const base_data = z.object({
  active_at  : stamp,
  commit_at  : stamp,
  engine     : str,
  error      : str.nullable().default(null),
  expires_at : stamp,
  head       : hash,
  output     : str.nullable(),
  pathnames  : str.array(),
  programs   : program.array(),
  state      : str,
  step       : num,
  tasks      : prop.schedule,
  updated_at : stamp,
  vmid       : hash
})

const data    = base_data.and(close_state)
const shape   = base_data.merge(close_info)

const vm_verify = z
  .function()
  .args(str, literal.array())
  .returns(str.nullable())

const vm_eval = z
  .function()
  .args(data, z.union([ wit.data, wit.data.array() ]))
  .returns(data)

const vm_init = z
  .function()
  .args(config)
  .returns(data)

const vm_run = z
  .function()
  .args(data, stamp.optional())
  .returns(data)

const api = z.object({
  actions : str.array(),
  methods : str.array(),
  states  : str.array(),
  label   : str,
  eval    : vm_eval,
  init    : vm_init,
  run     : vm_run,
  verify  : vm_verify
})

export default { api, config, data, program, shape, submit_req }
