import { UserDeployerWhitelist } from "loom-js/dist/contracts"
import { UserDeployerState } from "loom-js/dist/proto/user_deployer_whitelist_pb"
import { BareActionContext } from "vuex-typex"
import { HasPlasmaState } from "../plasma/types"
import { Address } from "loom-js"

export interface HasWhiteListState extends HasPlasmaState {
  whiteList: WhiteListState
}

export interface WhiteListState {
  userDeployerWhitelist: UserDeployerWhitelist | null
  userDeployersAddress: DeployerAddress[] | [],
  whiteListContractAddress: Address | null,
  tiers: Tier[]
}

export interface Tier {
    id: number,
    fee: number,
    name: string,
    enabled: boolean,
}

export interface DeployerAddress {
  address: Address
  hex: string,
  tier: number,
  base64: string,
  defaultFormat: "hex" | "base64"
}

// helper/shorthand for plasma module action context
export declare type WhiteListContext = BareActionContext<
  WhiteListState,
  HasWhiteListState
>
