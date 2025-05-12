import { GLOBAL_CONSTANTS } from '../../../../constants'
import { Policy } from '../types'
import { encodeAbiParameters } from 'viem'

type Params = {
  onChainBehaviorStateTreeRoot: bigint
}

export const getContractAndValueWhitelistPolicy = (params: Params): Policy => {
  return {
    policy: GLOBAL_CONSTANTS.CONTRACT_AND_VALUE_WHITELIST_POLICY_ADDRESS,
    address: GLOBAL_CONSTANTS.CONTRACT_AND_VALUE_WHITELIST_POLICY_ADDRESS,
    initData: encodeAbiParameters([{ type: 'uint256' }], [params.onChainBehaviorStateTreeRoot]),
  }
}
