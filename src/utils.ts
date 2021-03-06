import BN from "bn.js"
import BigNumber from "bignumber.js"
import Cards from "./data/cards.json"
import CardDetails from "./data/cardDetail.json"
import { TokenData } from "./services/TokenService"
import productionTokens from "@/assets/tokens/production.tokens.json"
import extDevTokens from "@/assets/tokens/ext-dev.tokens.json"
import devTokens from "@/assets/tokens/dev.tokens.json"

export const ZERO = new BN(0)

export function formatToCrypto(amount) {
  const conversion = new BigNumber(amount / 10 ** 18, 10)
  // show gwei if less than one
  return conversion.lt(1) && conversion.gt(0)
    ? conversion.toFormat(9)
    : conversion.toFormat(2)
}

export function parseToWei(amount: string, decimal = 18) {
  // BN is ints only
  const bigNumber = new BigNumber(amount).multipliedBy(10 ** decimal)
  return new BN(bigNumber.toFixed())
}

export const DOMAIN_NETWORK_ID = {
  1: ["loom"],
  4: ["rinkeby", "local"],
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function capitalize(s: string) {
  if (typeof s !== "string") return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const simpleMutations = (stateName) => ({
  [`set${capitalize(stateName)}`]: (state, payload) =>
    (state[stateName] = payload),
})

export function getCardByTokenId(id: string) {
  let cardDetail = CardDetails[id]
  let card
  if (!cardDetail) {
    cardDetail = defaultCardData
    card = Object.assign({}, cardDetail)
  } else {
    card = Object.assign(
      {},
      defaultCardData,
      Cards.cards.find((cd) => parseInt(cd.mould_type, 10) === cardDetail.mouldId),
    )
    const variation = cardDetail.variant.replace("-edition", "")
    card.variation = variation === "backers" ? "backer" : variation
  }
  card.id = id
  return card
}

export const defaultCardData = {
  display_name: "Card",
  priceInUSD: 0.0,
  priceInETH: 0.0,
  image: "question_card",
  title: "A Great Zombie",
  inventory: 0,
  variant: "standard-edition",
  variation: "standard",
  mould_type: "001",
  element: "AIR",
  originalID: "001",
  id: "001",
  tradeable: false,
}

export function formatToLoomAddress(address: string) {
  if (/^0x/.test(address)) {
    return address.replace("0x", "loom")
  } else {
    return address
  }
}

export function formatFromLoomAddress(address: string) {
  if (address.slice(0, 4) === "loom") {
    return address.replace("loom", "0x")
  } else {
    return address
  }
}

export const formatToBNBAddress = (address: string) =>
  /^0x/.test(address) ? address.replace("0x", "bnb") : address

export const formatFromBNBAddress = (address: string) =>
  address.slice(0, 3) === "bnb" ? address.replace("bnb", "0x") : address

export function getRequired<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error("Value required but was null " + name)
  }
  return value
}

/**
 * Return list of token symbol from localStorage
 */
export function getWalletFromLocalStorage(env: string) {
  const tokens = {
    "production": productionTokens,
    "ext-dev": extDevTokens,
    "dev": devTokens,
  }
  let wallets = JSON.parse(localStorage.getItem("wallets")!) // Get wallet from localStorage

  if (!wallets || !Object.keys(wallets).includes(env)) {
    const plasmaLoomAddr = tokens[env].find((token) => token.symbol === "LOOM")!.plasma
    const plasmaEthAddr = tokens[env].find((token) => token.symbol === "ETH")!.plasma

    // Create default wallet
    if (!wallets) {
      wallets = { [env]: [plasmaLoomAddr, plasmaEthAddr] }
    } else {
      wallets[env] = [plasmaLoomAddr, plasmaEthAddr]
    }

    localStorage.setItem("wallets", JSON.stringify(wallets)) // set wallet to localStorage
  }

  return wallets[env]
}

/**
 * To add the new token symbol into wallet, then update wallet in localStorage
 * @param token Token data
 * @param env Current environment
 */
export function setNewTokenToLocalStorage(token: TokenData, env: string) {
  const wallet = getWalletFromLocalStorage(env)
  // check symbol not exist in wallet
  const isExist = wallet.find((address) => token.plasma === address)
  if (!isExist) {
    wallet.push(token.plasma)
    const wallets = JSON.parse(localStorage.getItem("wallets")!)
    wallets[env] = wallet
    localStorage.setItem("wallets", JSON.stringify(wallets))
  }
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function detectedWallet() {
  if ("imToken" in window ||
    // @ts-ignore
    ("ethereum" in window && window.ethereum.isImToken)
  ) return "imToken"

  // @ts-ignore
  const web3 = window.web3
  if (!web3) return ""

  if (web3.isCobo) return "cobo"

  if (web3.currentProvider.isTrust) return "trust"

  if (web3.currentProvider.isGoWallet) return "goWallet"

  if (web3.currentProvider.isAlphaWallet) return "alphaWallet"

  if (web3.currentProvider.isStatus) return "status"

  if (web3.currentProvider.isToshi) return "coinbase"

  if ("__CIPHER__" in window) return "cipher"

  if (web3.currentProvider.isMetaMask) return "metamask"

  return ""
}
