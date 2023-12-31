import { z } from 'zod'
import base  from './base.js'

const { hash, label, literal, num, stamp, str } = base

const action    = z.enum([ 'lock', 'release', 'dispute', 'resolve', 'close' ])
const commit    = z.tuple([ num, num, hash, hash ])
const entry     = z.tuple([ hash ]).rest(literal)
const method    = z.enum([ 'oracle', 'reveal', 'sign' ])
const path      = z.tuple([ str, num ])
const regex     = z.string().regex(/[a-zA-Z0-9\_\|\*\-]/)
const progdata  = z.tuple([ hash, regex, regex, label, literal.array() ])
const item      = z.tuple([ label, str ])
const store     = z.tuple([ label, item.array() ])

const task      = z.tuple([ num, action, regex ])
const status    = z.enum([ 'init', 'open', 'disputed', 'closed' ])

const data = z.object({
  commits  : commit.array(),
  head     : hash,
  paths    : path.array(),
  programs : progdata.array(),
  result   : label.nullable(),
  start    : stamp,
  steps    : num.max(255),
  store    : store.array(),
  status   : status,
  tasks    : task.array(),
  updated  : stamp
})

export default { 
  action,
  commit,
  data,
  entry,
  method,
  path, 
  progdata,
  regex,
  store,
  task,
  status
}
