import { run_schedule } from './schedule.js'
import { init_paths }   from './state.js'
import { now }          from '../lib/util.js'

import {
  debug,
  err_handler
} from './util.js'

import {
  init_stores,
  run_program
} from './program.js'

import {
  PathStatus,
  StateData,
  WitnessData,
  ProgramEntry,
  ContractData
} from '../types/index.js'

const INIT_STATE = {
  commits : [],
  error   : null,
  result  : null,
  status  : 'init' as PathStatus,
  steps   : 0,
  store   : []
}

/**
 * Evaluates the witness data against the current virtual machine state.
 */
export function eval_witness (
  programs : ProgramEntry[],
  state    : StateData,
  witness  : WitnessData,
  marker  = now()
) : { error ?: string, state : StateData } {
  // Return early if there is already a result.
  if (state.result !== null) {
    return { state }
  }
  // Define our error varaible.
  let error : string | undefined
  // Try to run the scheduler and program.
  try {
    debug('[vm] eval witness data:', witness)
    // Evaluate the schedule for due events.
    run_schedule(state, marker)
    // If there is a result, return early.
    if (state.result !== null) return { state }
    // Fetch the program by id, then run the program.
    run_program(programs, state, witness)
  } catch (err) {
    // Handle raised errors.
    error = err_handler(err)
  }
  // Update the state timestamp.
  state.updated = marker
  // Return the current state.
  return { error, state }
}

/**
 * Evaluates the schedule of the virtual machine to process due events.
 */
export function eval_schedule (
  state  : StateData,
  marker : number = now()
) : StateData {
  // Return early if there is already a result.
  if (state.result !== null) return state
  // Evaluate the schedule for due events.
  run_schedule(state, marker)
  // Return the current state.
  return state
}

/**
 * Initializes the virtual machine with the given parameters.
 */
export function init_vm (
  contract : ContractData
) : StateData {
  const { cid, programs, published, terms } = contract
  const head     = cid
  const paths    = init_paths(terms.paths, terms.programs)
  const store    = init_stores(programs.map(e => e[0]))
  const start    = published
  const tasks    = terms.schedule.sort((a, b) => a[0] - b[0])
  const updated  = start
  return { ...INIT_STATE, head, paths, start, store, tasks, updated }
}
