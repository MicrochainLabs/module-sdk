

/*type Params = {
  token: Address
  limit: bigint
}[]*/
//pnpm add @zk-kit/imt -w
import { Address } from "viem"

type ContractValueWhitelistState = {
    smartAccount: Address
    configId: string
    smartContractCalls: Address[]
    valueTransfers: Address[]
}

export const getContractValueWhitelistStateTree = (
  contractValueWhitelistState: ContractValueWhitelistState, whitelistTreeDepth: number
)/*: Policy*/ => {

}

export const getInputs = () => {}

export const generateProof = () => {}