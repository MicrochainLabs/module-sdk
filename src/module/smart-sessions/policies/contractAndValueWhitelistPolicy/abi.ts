export const abi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "_userOpPolicyVerifier",
          "type": "address",
          "internalType": "contract IUserOpZkPolicyVerifier"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "_decodeProof",
      "inputs": [
        {
          "name": "proof",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [
        {
          "name": "decodedProof",
          "type": "tuple",
          "internalType": "struct ContractValueWhitelistPolicy.Groth16Proof",
          "components": [
            {
              "name": "a",
              "type": "uint256[2]",
              "internalType": "uint256[2]"
            },
            {
              "name": "b",
              "type": "uint256[2][2]",
              "internalType": "uint256[2][2]"
            },
            {
              "name": "c",
              "type": "uint256[2]",
              "internalType": "uint256[2]"
            },
            {
              "name": "opProof",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "pure"
    },
    {
      "type": "function",
      "name": "checkUserOpZkPolicy",
      "inputs": [
        {
          "name": "id",
          "type": "bytes32",
          "internalType": "ConfigId"
        },
        {
          "name": "op",
          "type": "tuple",
          "internalType": "struct PackedUserOperation",
          "components": [
            { "name": "sender", "type": "address", "internalType": "address" },
            { "name": "nonce", "type": "uint256", "internalType": "uint256" },
            { "name": "initCode", "type": "bytes", "internalType": "bytes" },
            { "name": "callData", "type": "bytes", "internalType": "bytes" },
            { "name": "accountGasLimits", "type": "bytes32", "internalType": "bytes32" },
            { "name": "preVerificationGas", "type": "uint256", "internalType": "uint256" },
            { "name": "gasFees", "type": "bytes32", "internalType": "bytes32" },
            { "name": "paymasterAndData", "type": "bytes", "internalType": "bytes" },
            { "name": "signature", "type": "bytes", "internalType": "bytes" }
          ]
        },
        {
          "name": "userOpHash",
          "type": "bytes32",
          "internalType": "bytes32"
        },
        {
          "name": "proof",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getStateTreeRoot",
      "inputs": [
        {
          "name": "configId",
          "type": "bytes32",
          "internalType": "ConfigId"
        },
        {
          "name": "multiplexer",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "smartAccount",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "initializeWithMultiplexer",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "configId",
          "type": "bytes32",
          "internalType": "ConfigId"
        },
        {
          "name": "initData",
          "type": "bytes",
          "internalType": "bytes"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "supportsInterface",
      "inputs": [
        {
          "name": "interfaceID",
          "type": "bytes4",
          "internalType": "bytes4"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "pure"
    },
    {
      "type": "event",
      "name": "PolicySet",
      "inputs": [
        {
          "name": "id",
          "type": "bytes32",
          "indexed": false,
          "internalType": "ConfigId"
        },
        {
          "name": "multiplexer",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "account",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "NoExecutionsInBatch",
      "inputs": []
    },
    {
      "type": "error",
      "name": "PolicyNotInitialized",
      "inputs": [
        {
          "name": "id",
          "type": "bytes32",
          "internalType": "ConfigId"
        },
        {
          "name": "multiplexer",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "UnsupportedCallType",
      "inputs": [
        {
          "name": "callType",
          "type": "bytes1",
          "internalType": "CallType"
        }
      ]
    }
  ]
  