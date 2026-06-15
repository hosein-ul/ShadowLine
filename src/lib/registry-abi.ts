/**
 * ABI for the ConfidentialTokenWrappersRegistry contract.
 * Used to enumerate all registered ERC-20 ↔ ERC-7984 wrapper pairs.
 */
export const REGISTRY_ABI = [
  // Read functions
  {
    name: 'getWrapper',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'erc20', type: 'address' }],
    outputs: [{ name: 'wrapper', type: 'address' }],
  },
  {
    name: 'getUnderlying',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'wrapper', type: 'address' }],
    outputs: [{ name: 'erc20', type: 'address' }],
  },
  {
    name: 'isRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getAllWrappers',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'erc20s', type: 'address[]' },
      { name: 'wrappers', type: 'address[]' },
    ],
  },
  {
    name: 'getWrapperCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events
  {
    name: 'WrapperRegistered',
    type: 'event',
    inputs: [
      { name: 'erc20', type: 'address', indexed: true },
      { name: 'wrapper', type: 'address', indexed: true },
    ],
  },
  {
    name: 'WrapperRemoved',
    type: 'event',
    inputs: [
      { name: 'erc20', type: 'address', indexed: true },
      { name: 'wrapper', type: 'address', indexed: true },
    ],
  },
] as const;
