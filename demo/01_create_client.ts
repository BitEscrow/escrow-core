import { EscrowClient } from '@scrow/core/client'

import { config } from './00_demo_config.js'

/**
 * Define our API client.
 */
export const client = new EscrowClient(config.client)
