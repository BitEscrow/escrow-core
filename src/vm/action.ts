import {
  PathState,
  StateData
} from '../types/index.js'

export function run_action (
  action : string,
  path   : PathState,
  state  : StateData
) : PathState | null {
  /**
   * Run an action on a specified path.
   */
  switch (action) {
    case 'close':
      return exec_close(path)
    case 'dispute':
      return exec_dispute(path)
    case 'lock':
      return exec_lock(path)
    case 'release':
      return exec_release(path)
    case 'resolve':
      return exec_resolve(state)
    default:
      throw 'Action not found: ' + action
  }
}

export function exec_dispute (state : PathState) {
  if (state === PathState.disputed) {
    throw 'Path is already in dispute.'
  } else {
    return PathState.disputed
  }
}

export function exec_resolve (state : StateData) {
  if (state.status !== 'disputed') {
    throw 'State is not in a dispute.'
  } else {
    return PathState.closed
  }
}

export function exec_lock (state : PathState) {
  if (state === PathState.locked) {
    throw '[vm] Path is already locked.'
  } else if (state === PathState.disputed) {
    throw '[vm] Path is in a dispute.'
  } else {
    return PathState.locked
  }
}

export function exec_release (state : PathState) {
  if (state !== PathState.locked) {
    throw '[vm] Path is not locked.'
  } else {
    return PathState.open
  }
}

function exec_close (state : PathState) {
  if (state === PathState.locked) {
    throw '[vm] Path is locked.'
  } else if (state === PathState.disputed) {
    throw '[vm] Path is in dispute.'
  } else {
    return PathState.closed
  }
}
