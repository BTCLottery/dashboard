import { DashboardConfig } from "@/types"

export default {
  name: "production",
  plasma: {
    networkId: "plasma",
    chainId: "default",
    endpoint: "wss://plasma.dappchains.com",
    blockExplorer: "http://plasma-blockexplorer.dappchains.com",
  },
  ethereum: {
    networkId: "1",
    networkName: "mainnet",
    chainId: "eth",
    endpoint: "wss://mainnet.infura.io/ws",
    blockExplorer: "https://etherscan.com",
    contracts: {
      gateway: "0xE57e0793f953684Bc9D2EF3D795408afb4a100c3",
      loomGateway: "0x76c41effc2871e73f42b2eae5eaf8efe50bdbf73",
    },
  },
  coinDataUrl: "",
  disabled: ["transfer-asset", "binance", "dev-deploy"],
  chains: ["ethereum"],
} as DashboardConfig
