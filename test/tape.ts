import tape           from 'tape'
import { get_daemon } from './src/core.js'

import e2e_test from './src/tests/e2e.test.js'
import vm_test  from './src/vm/vm.test.js'

tape('Escrow Core Test Suite', async t => {
  // vm_test(t)
  const core   = get_daemon()
  const client = await core.startup()
  await e2e_test(client, t)
  t.teardown(() => { core.shutdown() })
})
