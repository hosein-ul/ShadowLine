/**
 * ABI for the ERC7984ERC20Wrapper contract.
 * Covers both the ERC-7984 confidential token interface and the wrapper-specific methods.
 * Supports both legacy depositFor/withdrawTo and Zama's official wrap/unwrap/finalizeUnwrap methods.
 */
export const WRAPPER_ABI = [
  // === ERC-20 Underlying ===
  {
    name: 'underlyingToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'isWrapper',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },

  // === ERC-7984 Token Metadata ===
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },

  // === Zama Official Wrap / Unwrap ===
  {
    name: 'wrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'unwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'finalizeUnwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'unwrapRequestId', type: 'bytes32' },
      { name: 'cleartextAmount', type: 'uint64' },
      { name: 'decryptionProof', type: 'bytes' },
    ],
    outputs: [],
  },

  // === Legacy/Alternate Wrap / Unwrap ===
  {
    name: 'depositFor',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'withdrawTo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },

  // === Confidential Balance ===
  {
    name: 'confidentialBalanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'confidentialTotalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },

  // === Standard ERC-20 (for the underlying token interaction) ===
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // === Events ===
  {
    name: 'Wrap',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'roundedAmount', type: 'uint256', indexed: false },
      { name: 'encryptedWrappedAmount', type: 'uint64', indexed: false },
    ],
  },
  {
    name: 'UnwrapRequested',
    type: 'event',
    inputs: [
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'unwrapRequestId', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'uint64', indexed: false },
    ],
  },
  {
    name: 'UnwrapFinalized',
    type: 'event',
    inputs: [
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'unwrapRequestId', type: 'bytes32', indexed: true },
      { name: 'encryptedAmount', type: 'uint64', indexed: false },
      { name: 'cleartextAmount', type: 'uint64', indexed: false },
    ],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Approval',
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * Standard ERC-20 ABI for the underlying tokens.
 */
export const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'supportsInterface',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Minimal ERC-165 ABI — only supportsInterface.
 * Used by the wallet scanner to check if a contract is ERC-7984 compliant.
 * ERC-7984 interface ID: 0x4958f2a4
 */
export const ERC165_ABI = [
  {
    name: 'supportsInterface',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * ERC-7984 interface ID as defined by the Zama Protocol.
 * All official ERC-7984 confidential tokens support this interface.
 * Used with ERC-165 supportsInterface to distinguish ERC-7984 contracts
 * from plain ERC-20 contracts during wallet scanning.
 *
 * Reference: https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry
 */
export const ERC7984_INTERFACE_ID = '0x4958f2a4' as const;
