

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


type ContractValueWhitelistState = {
  smartAccount: Address
  configId: string
  smartContractCalls: Address[]
  valueTransfers: Address[]
  sessionOwnerPk: Hex
}

type ContractValueWhitelistTree = {
  smartContractCalls: IMT
  valueTransfers: IMT
}

/*type ContractValueWhitelistTransaction = {
  dest: Address,
  value: Hex,
  functionSelector: Hex,
  Erc20TransferTo: Address
}*/

type ContractValueWhitelistTransaction = {
  dest: bigint,
  value: bigint,
  functionSelector: bigint,
  Erc20TransferTo: bigint
}

export const getContractValueWhitelistStateTree = (
  contractValueWhitelistState: ContractValueWhitelistState, whitelistTreeDepth: number
): ContractValueWhitelistTree => {
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

export const getCircuitInputs = (
  txs: ContractValueWhitelistTransaction[], userOpHash: Hex, 
  contractValueWhitelistState: ContractValueWhitelistState, contractValueWhitelistTree: ContractValueWhitelistTree
) => {

  const sessionOwner = privateKeyToAccount(contractValueWhitelistState.sessionOwnerPk)

  let op = BigInt(userOpHash)
  op %= PROOF_SYSTEM_CONSTANTS.SNARK_SCALAR_FIELD

  const circuitInputs = {
    smartAccount: BigInt(contractValueWhitelistState.smartAccount),
    configId: BigInt(sessionOwner.address),
    contractWhitelistRoot: contractValueWhitelistTree.smartContractCalls.root,
    valueWhitelistRoot: contractValueWhitelistTree.valueTransfers.root,
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

  const defaultArray = Array.from({ length: contractValueWhitelistTree.smartContractCalls.depth }, () => 0)
  for(let tx of txs){
        
    circuitInputs.dest.push(tx.dest)
    circuitInputs.value.push(BigInt(tx.value))
    circuitInputs.functionSelector.push(BigInt(tx.functionSelector))
    circuitInputs.erc20TransferTo.push(BigInt(tx.Erc20TransferTo))
    if(tx.value != BigInt("0x0")){
      const index= contractValueWhitelistTree.valueTransfers.indexOf(tx.dest);
      const nativeCoinTransferProof=  contractValueWhitelistTree.valueTransfers.createProof(index);
      circuitInputs.nativeCoinTransferSiblings.push(nativeCoinTransferProof.siblings.map((s) => s[0]))
      circuitInputs.nativeCoinTransferIndices.push(nativeCoinTransferProof.pathIndices)
    }else{
      //static value
      circuitInputs.nativeCoinTransferSiblings.push(defaultArray)
      circuitInputs.nativeCoinTransferIndices.push(defaultArray)
    }

    if(tx.functionSelector != BigInt("0x0")){
      const index= contractValueWhitelistTree.smartContractCalls.indexOf(tx.dest);
      const smartContractCallProof= contractValueWhitelistTree.smartContractCalls.createProof(index);
      circuitInputs.smartContractCallSiblings.push(smartContractCallProof.siblings.map((s) => s[0]))
      circuitInputs.smartContractCallPathIndices.push(smartContractCallProof.pathIndices)
    }else{
      circuitInputs.smartContractCallSiblings.push(defaultArray)
      circuitInputs.smartContractCallPathIndices.push(defaultArray)
    }

    if(tx.functionSelector == BigInt("0xa9059cbb") && tx.Erc20TransferTo != BigInt("0x0")){
      const index= contractValueWhitelistTree.valueTransfers.indexOf(tx.Erc20TransferTo);
      const erc20TransferProof= contractValueWhitelistTree.valueTransfers.createProof(index);
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
