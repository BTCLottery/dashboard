/**
 * @module dpos-dashboard.ethereum
 */

import { ERC20 } from "@/store/plasma/web3-contracts/ERC20"
import { Transfer } from "@/types"
import BN from "bn.js"
import debug from "debug"
import { ethers } from "ethers"
import ERC20ABI from "loom-js/dist/mainnet-contracts/ERC20.json"
import { BareActionContext, getStoreBuilder } from "vuex-typex"
import Web3 from "web3"
import {
  EthereumConfig,
  EthereumState,
  HasEthereumState,
  WalletType,
} from "./types"
import { LedgerAdapter } from "./wallets/ledger"
import { MetaMaskAdapter } from "./wallets/metamask"

declare type ActionContext = BareActionContext<EthereumState, HasEthereumState>

const log = debug("dash.ethereum")
const ZERO = new BN("0")

const wallets: Map<string, WalletType> = new Map([
  ["metamask", MetaMaskAdapter],
  ["ledger", LedgerAdapter],
])

const initialState: EthereumState = {
  networkId: "",
  networkName: "",
  chainId: "",
  endpoint: "",
  blockExplorer: "",
  provider: null,
  address: "",
  signer: null,
  walletType: "",
  erc20Addresses: {
    // us1
    loom: "0x425532c6a0b0327bbd702ad7a1ab618b1e86289d",
    bnb: "",
    usdc: "",
  },
  balances: {
    eth: ZERO,
    loom: ZERO,
  },
  loom: {
    contract: null,
    balance: ZERO,
    address: "",
  },
  coins: {
    loom: {
      balance: ZERO,
      loading: true,
    },
  },
}

// web3 instance
// @ see
let web3: Web3 | null

const builder = getStoreBuilder<HasEthereumState>().module(
  "ethereum",
  initialState,
)
const stateGetter = builder.state()

function requireValue<T>(v: T | null | undefined, errorMessage: string): T {
  if (v === null || v === undefined) {
    throw new Error(errorMessage)
  }
  return v
}

// vuex typedd module
export const ethereumModule = {
  get state() {
    return stateGetter()
  },

  get web3(): Web3 {
    return web3
  },

  getERC20,

  setConfig: builder.commit(setConfig),

  refreshBalance: builder.dispatch(refreshBalance),
  approve: builder.dispatch(approve),
  transfer: builder.dispatch(transfer),

  setWalletType: builder.dispatch(setWalletType),
  setToExploreMode: builder.dispatch(setToExploreMode),
  allowance: builder.dispatch(allowance),

  initERC20: builder.dispatch(initERC20),
  clearERC20: builder.dispatch(clearERC20),
}

// holds the contracts. We don't need to exposed these on the state
const erc20Contracts: Map<string, ERC20> = new Map()

function getERC20(token: string) {
  return erc20Contracts.get(token)
}

async function setWalletType(context: ActionContext, walletType: string) {
  const wallet = wallets.get(walletType)
  if (wallet === undefined) {
    console.error("unsuported wallet type " + walletType)
    // to do tell the user about the error
    return
  }
  context.state.walletType = walletType
  if (wallet.isMultiAccount === false) {
    wallet
      .createProvider()
      .then((web3provider) => {
        // context.state.provider = web3provider
        web3 = new Web3(web3provider)
        log("web3 provider", web3provider)
        // using web3 but  need an ethers signer for eth signing.
        // @ts-ignore
        return new ethers.providers.Web3Provider(web3provider).getSigner()
      })
      .then((signer) => {
        context.state.signer = signer
        log("signer", signer)
        return signer.getAddress()
      })
      .then((address) => {
        log("address", address)
        context.state.address = address
        log("wallet set")
      })
      .catch((e) => {
        console.error(e)
      })
  }
}

async function setToExploreMode(context: ActionContext, address: string) {
  web3 = new Web3(
    new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws"),
  )
  // Signer is not used in explore mode
  context.state.signer = null
  context.state.address = address
}

function setConfig(state: EthereumState, config: EthereumConfig) {
  log("config", config)
  Object.assign(state, config)
  // remove any web3 stuff
  web3 = null
}

/**
 * deposit from ethereum account to gateway
 * @param symbol
 * @param tokenAmount
 */
export function refreshBalance(context: ActionContext, symbol: string) {
  const contract = requireValue(erc20Contracts.get(symbol), "No contract found")
  const coinState = context.state.coins[symbol]
  coinState.loading = true
  return (
    contract.methods
      .balanceOf(context.state.address)
      // @ts-ignore
      .call({
        from: context.state.address,
      })
      .then((ethersBN) => {
        log("balanceOf %s %s ", symbol, ethersBN.toString())
        context.state.balances[symbol] = new BN(ethersBN.toString())
        coinState.balance = new BN(ethersBN.toString())
      })
      .finally(() => {
        coinState.loading = false
      })
  )
}

/**
 * approve amount for ERC20 tokens
 * @param symbol
 * @param tokenAmount
 */
export async function approve(context: ActionContext, payload: Transfer) {
  const { symbol, weiAmount, to } = payload
  const contract = requireValue(
    erc20Contracts.get(symbol),
    "Contract not initialized",
  )
  await contract.methods
    .approve(to, weiAmount.toString())
    // @ts-ignore
    .send({
      from: context.state.address,
    })
}

/**
 * withdraw from gateway to ethereum account
 * @param symbol
 */
export async function transfer(
  context: ActionContext,
  payload: Transfer,
): Promise<any> {
  const { symbol, weiAmount, to } = payload
  const contract = requireValue(
    erc20Contracts.get(symbol),
    "Contract not initialized",
  )
  const tx = await contract.methods
    .transfer(to, weiAmount.toString())
    // @ts-ignore
    .send({
      from: context.state.address,
    })
  log("transfer", tx)
  return tx
}

export async function allowance(
  context: ActionContext,
  payload: { symbol: string; spender: string },
): Promise<BN> {
  const { symbol, spender } = payload
  const contract = requireValue<ERC20>(
    erc20Contracts.get(symbol),
    "Expected contract",
  )
  const amount = await contract.methods
    .allowance(context.state.address, spender)
    // @ts-ignore
    .call({
      from: context.state.address,
    })
  return new BN(amount.toString())
}

// async depositAsync(amount: BN): Promise<ethers.ContractTransaction> {
//   let currentApproval = await this._ethereumLoom.functions.allowance(
//     await this.ethAddress,
//     this._ethereumGateway.address
//   )

//   let currentApprovalBN = new BN(currentApproval.toString())

//   log('Current approval:', currentApproval)
//   if (amount.gt(currentApprovalBN)) {
//     let tx = await this._ethereumLoom.functions.approve(
//       this._ethereumGateway.address,
//       amount.sub(currentApprovalBN).toString()
//     )
//     await tx.wait()
//     log('Approved an extra', amount.sub(currentApprovalBN))
//   }
//   return this._ethereumGateway.functions.depositERC20(
//     amount.toString(),
//     this._ethereumLoom.address
//   )
// }

export function initERC20(context: ActionContext, symbol: string) {
  log("initERC20")
  const contractAddr = context.state.erc20Addresses[symbol]
  const web3: Web3 = ethereumModule.web3!
  // @ts-ignore
  const contract = new web3.eth.Contract(ERC20ABI, contractAddr) as ERC20
  erc20Contracts.set(symbol, contract)

  const account = context.state.address
  // out out filters
  const send = contract.events.Transfer({
    fromBlock: "latest",
    filter: {
      from: account,
    },
  })
  const receive = contract.events.Transfer({
    fromBlock: "latest",
    filter: {
      to: account,
    },
  })

  // const receive = contract.filters.Transfer(null, account, null)
  // contract.contract.on(send, refresh)
  // contract.on(receive, refresh)

  const refresh = () => ethereumModule.refreshBalance(symbol)
  send.on("data", refresh)
  receive.on("data", refresh)

  ethereumModule.refreshBalance(symbol)

  return contract
}

export function clearERC20() {
  erc20Contracts.clear()
}