
import { EscrowClient } from '../../class/client.js'

import {
  validate_account_req,
  validate_register_req,
  validate_commit_req,
  validate_close_req,
  validate_lock_req
} from '@/validators/index.js'

import {
  ApiResponse,
  AccountRequest,
  AccountDataResponse,
  DepositDataResponse,
  DepositListResponse,
  FundingDataResponse,
  RegisterRequest,
  CommitRequest,
  CloseRequest,
  LockRequest,
  DepositDigestResponse,
  DepositStatusResponse
} from '@/types/index.js'

import * as assert from '@/assert.js'

/**
 * Request a deposit account from the provider.
 */
function request_account_api (client : EscrowClient) {
  return async (
    request : AccountRequest
  ) : Promise<ApiResponse<AccountDataResponse>> => {
    validate_account_req(request)
    // Formulate the request.
    const url = `${client.host}/api/deposit/request`
    // Formulate the request.
    const init = {
      method  : 'POST',
      body    : JSON.stringify(request),
      headers : { 'content-type' : 'application/json' }
    }
    // Return the response.
    return client.fetcher<AccountDataResponse>({ url, init })
  }
}

/**
 * Create a deposit account from a template.
 */
function register_deposit_api (client : EscrowClient) {
  return async (
    request : RegisterRequest
  ) : Promise<ApiResponse<DepositDataResponse>> => {
    // Validate the request.
    validate_register_req(request)
    // Configure the url.
    const url = `${client.host}/api/deposit/register`
    // Formulate the request.
    const init = {
      method  : 'POST',
      body    : JSON.stringify(request),
      headers : { 'content-type' : 'application/json' }
    }
    // Return the response.
    return client.fetcher<DepositDataResponse>({ url, init })
  }
}

/**
 * Fund a contract directly using a deposit template.
 */
function commit_deposit_api (client : EscrowClient) {
  return async (
    request : CommitRequest
  ) : Promise<ApiResponse<FundingDataResponse>> => {
    // Validate the request.
    validate_commit_req(request)
    // Formulate the request url.
    const url  = `${client.host}/api/deposit/commit`
    // Forulate the request body.
    const init = {
      method  : 'POST',
      body    : JSON.stringify(request),
      headers : { 'content-type' : 'application/json' }
    }
    // Return the response.
    return client.fetcher<FundingDataResponse>({ url, init })
  }
}

/**
 * Fetch a deposit from the server by Id.
 */
function read_deposit_api (client : EscrowClient) {
  return async (
    dpid  : string
  ) : Promise<ApiResponse<DepositDataResponse>> => {
    // Validate the deposit id.
    assert.is_hash(dpid)
    // Formulate the request.
    const url = `${client.host}/api/deposit/${dpid}`
    // Return the response.
    return client.fetcher<DepositDataResponse>({ url })
  }
}

/**
 * Fetch a deposit's status from the server by Id.
 */
function read_deposit_digest_api (client : EscrowClient) {
  return async (
    dpid  : string
  ) : Promise<ApiResponse<DepositDigestResponse>> => {
    // Validate the deposit id.
    assert.is_hash(dpid)
    // Formulate the request.
    const url = `${client.host}/api/deposit/${dpid}/digest`
    // Return the response.
    return client.fetcher<DepositDigestResponse>({ url })
  }
}

/**
 * Fetch a deposit's status from the server by Id.
 */
function read_deposit_status_api (client : EscrowClient) {
  return async (
    dpid  : string
  ) : Promise<ApiResponse<DepositStatusResponse>> => {
    // Validate the deposit id.
    assert.is_hash(dpid)
    // Formulate the request.
    const url = `${client.host}/api/deposit/${dpid}/status`
    // Return the response.
    return client.fetcher<DepositStatusResponse>({ url })
  }
}

function list_deposit_api (client : EscrowClient) {
  return async (
    pubkey : string,
    token  : string
  ) : Promise<ApiResponse<DepositListResponse>> => {
    // Validate the pubkey.
    assert.is_hash(pubkey)
    // Define the request url.
    const url = `${client.host}/api/deposit/list/${pubkey}`
    // Define the request config.
    const init = {
      method  : 'GET',
      headers : { 'Authorization' : 'Bearer ' + token }
    }
    // Return the response.
    return client.fetcher<DepositListResponse>({ url, init })
  }
}

function lock_deposit_api (client : EscrowClient) {
  return async (
    dpid    : string,
    request : LockRequest
  ) : Promise<ApiResponse<FundingDataResponse>> => {
    // Validate the deposit id.
    assert.is_hash(dpid)
    // Validate the request body.
    validate_lock_req(request)
    // Create the request url.
    const url    = `${client.host}/api/deposit/${dpid}/lock`
    // Create the request object.
    const init   = {
      body    : JSON.stringify(request),
      method  : 'POST',
      headers : { 'content-type' : 'application/json' }
    }
    // Fetch and return a response.
    return client.fetcher<FundingDataResponse>({ url, init })
  }
}

function close_deposit_api (client : EscrowClient) {
  return async (
    dpid    : string,
    request : CloseRequest
  ) : Promise<ApiResponse<DepositDataResponse>> => {
    // Validate the deposit id.
    assert.is_hash(dpid)
    // Validate the request body.
    validate_close_req(request)
    // Create the request url.
    const url  = `${client._host}/api/deposit/${dpid}/close`
    // Create the request object.
    const init = {
      body    : JSON.stringify(request),
      headers : { 'content-type': 'application/json' },
      method  : 'POST'
    }
    return client.fetcher<DepositDataResponse>({ url, init })
  }
}

export default function (client : EscrowClient) {
  return {
    request  : request_account_api(client),
    register : register_deposit_api(client),
    commit   : commit_deposit_api(client),
    digest   : read_deposit_digest_api(client),
    status   : read_deposit_status_api(client),
    list     : list_deposit_api(client),
    read     : read_deposit_api(client),
    lock     : lock_deposit_api(client),
    close    : close_deposit_api(client)
  }
}
