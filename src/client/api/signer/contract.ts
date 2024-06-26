import { EscrowSigner } from '@/client/class/signer.js'

function request_contracts_api (esigner : EscrowSigner) {
  return () => {
    const host = esigner.server_url
    const url  = `${host}/api/contract/list`
    const content = 'GET' + url
    return esigner._signer.gen_token(content)
  }
}

function cancel_contract_api (esigner : EscrowSigner) {
  return (cid : string) => {
    const host = esigner.server_url
    const url  = `${host}/api/contract/${cid}/cancel`
    const content = 'GET' + url
    return esigner._signer.gen_token(content)
  }
}

export default function (esigner : EscrowSigner) {
  return {
    list   : request_contracts_api(esigner),
    cancel : cancel_contract_api(esigner)
  }
}
