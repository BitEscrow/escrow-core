const configs = {
  mutiny : {
    hostname : 'https://bitescrow-mutiny.vercel.app',
    oracle   : 'https://mutinynet.com',
    network  : 'mutiny'
  },

  regtest : {
    hostname : 'http://localhost:3000',
    oracle   : 'http://172.21.0.3:3300',
    network  : 'regtest'
  },

  signet : {
    hostname : 'https://bitescrow-signet.vercel.app',
    oracle   : 'https://mempool.space/signet',
    network  : 'signet'
  },

  testnet : {
    hostname : 'https://bitescrow-testnet.vercel.app',
    oracle   : 'https://mempool.space/testnet',
    network  : 'testnet'
  }
}

const faucets = {
  mutiny  : 'https://faucet.mutinynet.com',
  regtest : 'none',
  signet  : 'https://signet.bc-2.jp',
  testnet : 'https://bitcoinfaucet.uo1.net'
}

const poll_rates = {
  mutiny  : [ 10, 6  ],
  regtest : [ 10, 6  ],
  signet  : [ 60, 30 ],
  testnet : [ 60, 30 ]
}

export const network = process.argv.slice(2)[0] ?? 'signet'

export const config  = configs[network as keyof typeof configs]
export const faucet  = faucets[network as keyof typeof faucets]
export const poll    = poll_rates[network as keyof typeof faucets]

export const members = [ 'alice', 'bob', 'carol' ]

export const sleep   = (ms : number) => new Promise(res => setTimeout(res, ms))
