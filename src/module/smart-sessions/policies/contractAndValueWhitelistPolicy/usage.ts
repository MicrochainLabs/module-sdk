

/*type Params = {
  token: Address
  limit: bigint
}[]*/
//pnpm add @zk-kit/imt -w || pnpm add poseidon-lite -w || pnpm add snarkjs -w
import { IMT } from "@zk-kit/imt"
import { poseidon2 } from "poseidon-lite"
import { Address, Hex } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { PROOF_SYSTEM_CONSTANTS } from "./constants"
// @ts-ignore
import * as snarkjs from 'snarkjs';
import { AbiCoder, hexlify } from "ethers";


export type ContractValueWhitelistState = {
  smartAccount: Address
  configId: string
  smartContractCalls: Address[]
  valueTransfers: Address[]
}

export type ContractValueWhitelistTrees = {
  smartContractCalls: IMT
  valueTransfers: IMT
}

/*type ContractValueWhitelistTransaction = {
  dest: Address,
  value: Hex,
  functionSelector: Hex,
  Erc20TransferTo: Address
}*/

export type ContractValueWhitelistTransaction = {
  dest: bigint,
  value: bigint,
  functionSelector: bigint,
  Erc20TransferTo: bigint
}

export const getContractAndValueWhitelistTrees = (
  contractValueWhitelistState: ContractValueWhitelistState, whitelistTreeDepth: number
): ContractValueWhitelistTrees => {
  const zeroValue = 0
  const arity = 2
  const smartContractCallsWhitelistTree = new IMT(poseidon2, whitelistTreeDepth, zeroValue, arity);
  const valueTransfersWhitelistTree = new IMT(poseidon2, whitelistTreeDepth, zeroValue, arity);
  for (let address of contractValueWhitelistState.smartContractCalls) {
    smartContractCallsWhitelistTree.insert(BigInt(address));
  }

  for (let address of contractValueWhitelistState.valueTransfers) {
    valueTransfersWhitelistTree.insert(BigInt(address));
  }

  return {
    smartContractCalls: smartContractCallsWhitelistTree,  
    valueTransfers: valueTransfersWhitelistTree      
  }
}

export const getContractValueWhitelistStateTree = (
  contractValueWhitelistState: ContractValueWhitelistState, contractValueWhitelistTrees: ContractValueWhitelistTrees
): IMT => {
  const zeroValue = 0
  const arity = 2
  const stateTree = new IMT(poseidon2, 2, zeroValue, arity);
  stateTree.insert(BigInt(contractValueWhitelistState.smartAccount))
  stateTree.insert(BigInt(contractValueWhitelistState.configId))
  stateTree.insert(BigInt(contractValueWhitelistTrees.smartContractCalls.root))
  stateTree.insert(BigInt(contractValueWhitelistTrees.valueTransfers.root))
  return stateTree
}

export const getCircuitInputs = (
  txs: ContractValueWhitelistTransaction[], userOpHash: Hex,
  contractValueWhitelistState: ContractValueWhitelistState, contractValueWhitelistTrees: ContractValueWhitelistTrees
) => {

  let op = BigInt(userOpHash)
  op %= PROOF_SYSTEM_CONSTANTS.SNARK_SCALAR_FIELD

  let configId = BigInt(contractValueWhitelistState.configId)
  configId %= PROOF_SYSTEM_CONSTANTS.SNARK_SCALAR_FIELD

  const circuitInputs = {
    smartAccount: BigInt(contractValueWhitelistState.smartAccount),
    configId: configId,
    contractWhitelistRoot: contractValueWhitelistTrees.smartContractCalls.root,
    valueWhitelistRoot: contractValueWhitelistTrees.valueTransfers.root,
    userOpHash: op,
    dest:[] as bigint[],
    value: [] as bigint[],
    functionSelector: [] as bigint[], 
    erc20TransferTo:[] as bigint[], 
    nativeCoinTransferSiblings: [] as number[][], 
    nativeCoinTransferIndices: [] as number[][],     
    smartContractCallSiblings: [] as number[][],
    smartContractCallPathIndices: [] as number[][],
    erc20TransferSiblings: [] as number[][],
    erc20TransferPathIndices: [] as number[][] 
  }

  const defaultArray = Array.from({ length: contractValueWhitelistTrees.smartContractCalls.depth }, () => 0)
  for(let tx of txs){
        
    circuitInputs.dest.push(tx.dest)
    circuitInputs.value.push(BigInt(tx.value))
    circuitInputs.functionSelector.push(BigInt(tx.functionSelector))
    circuitInputs.erc20TransferTo.push(BigInt(tx.Erc20TransferTo))
    if(tx.value != BigInt("0x0")){
      const index= contractValueWhitelistTrees.valueTransfers.indexOf(tx.dest);
      const nativeCoinTransferProof=  contractValueWhitelistTrees.valueTransfers.createProof(index);
      circuitInputs.nativeCoinTransferSiblings.push(nativeCoinTransferProof.siblings.map((s) => s[0]))
      circuitInputs.nativeCoinTransferIndices.push(nativeCoinTransferProof.pathIndices)
    }else{
      //static value
      circuitInputs.nativeCoinTransferSiblings.push(defaultArray)
      circuitInputs.nativeCoinTransferIndices.push(defaultArray)
    }

    if(tx.functionSelector != BigInt("0x0")){
      const index= contractValueWhitelistTrees.smartContractCalls.indexOf(tx.dest);
      const smartContractCallProof= contractValueWhitelistTrees.smartContractCalls.createProof(index);
      circuitInputs.smartContractCallSiblings.push(smartContractCallProof.siblings.map((s) => s[0]))
      circuitInputs.smartContractCallPathIndices.push(smartContractCallProof.pathIndices)
    }else{
      circuitInputs.smartContractCallSiblings.push(defaultArray)
      circuitInputs.smartContractCallPathIndices.push(defaultArray)
    }

    if(tx.functionSelector == BigInt("0xa9059cbb") && tx.Erc20TransferTo != BigInt("0x0")){
      const index= contractValueWhitelistTrees.valueTransfers.indexOf(tx.Erc20TransferTo);
      const erc20TransferProof= contractValueWhitelistTrees.valueTransfers.createProof(index);
      circuitInputs.erc20TransferSiblings.push(erc20TransferProof.siblings.map((s) => s[0]))
      circuitInputs.erc20TransferPathIndices.push(erc20TransferProof.pathIndices)
    }else{
      circuitInputs.erc20TransferSiblings.push(defaultArray)
      circuitInputs.erc20TransferPathIndices.push(defaultArray)
    }
  }

  return circuitInputs;
}

export const generateAndEncodeGroth16Proof = async (circuitInputs: any, witnessGenerationPath: string, provingKeyPath: string) => {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(circuitInputs, witnessGenerationPath, provingKeyPath);
  const defaultEncode= AbiCoder.defaultAbiCoder();
  const submittedProof = defaultEncode.encode(
        ["uint256","uint256","uint256","uint256","uint256","uint256","uint256","uint256","uint256"],
        [proof.pi_a[0], proof.pi_a[1], proof.pi_b[0][1], proof.pi_b[0][0], proof.pi_b[1][1], proof.pi_b[1][0], proof.pi_c[0], proof.pi_c[1], publicSignals[1]]);
  
  return submittedProof;
}

export const mockproof = "0x24d339928ff2ce552e8ecd9d98de24b0a84fae32b5d6b53f7033af0944c6a9da23bfb8304bd382e0b1ad896493f2e195c7f68791e43dc1a76ee7333d2c02eb8e180bea4a2346861e8efc9b3548cdf1323f0de8dff35d405e67162690af03623f2ddbfb4ca8d11104318354ddc25262343eb8c09de622cbb0d59f65649f5c640625b9045566b391d22952e9992a213e2604ec4235fc9a5d255eb0b52eb63fec0a267c80e3526ffd0363c5e5d0c5393366a877f682923c48f020ffffa989b7428a1a299495d594dda7d3258f78d3c34ee3eb1785e63d0bcba0e84f3598fed9484e137bb0eff1bdf71cad506e71ba6990161972075d640e5f8da435cc80c37fe83405a2007fc731228be65ef5d02f220928e18d71645f58c370f649544d824f94b0"
