/**
 * ABI for the ERC7984ERC20Wrapper contract.
 * Covers both the ERC-7984 confidential token interface and the wrapper-specific
 * methods. Signatures are aligned with the on-chain contract source at
 * https://github.com/zama-ai/protocol-apps/tree/main/contracts/confidential-wrapper
 * (`ERC7984ERC20WrapperUpgradeable.sol` and the base `ERC7984Upgradeable.sol`).
 *
 * At runtime the app calls Zama's SDK hooks (`useShield`, `useUnshield`, etc.)
 * for state-changing operations. WRAPPER_ABI is used for direct read-only calls
 * (`underlyingToken`, `balanceOf`, `symbol`, `name`, `decimals`, `allowance`)
 * and for event decoding.
 *
 * Encrypted amount handles (`euint64`) are ABI-encoded as `bytes32`.
 * External encrypted amounts (`externalEuint64`) are also `bytes32`.
 */
export const WRAPPER_ABI = [
  // === Underlying accessors ===
  {
    // OpenZeppelin IERC7984ERC20Wrapper name for the underlying ERC-20.
    name: 'underlying',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    // Compat alias — some early Zama wrappers expose this synonym.
    // Reads that revert here fall back to `underlying` at the call site.
    name: 'underlyingToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    // Fixed scaling factor from wrapper units → underlying units.
    // See `ERC7984ERC20WrapperUpgradeable.wrap`: transferred amount is rounded
    // down to the nearest multiple of `rate()` before minting confidential units.
    name: 'rate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
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

  // === Zama Official Wrap / Unwrap / Finalize ===
  {
    // wrap(to, amount) → euint64 (encoded as bytes32)
    name: 'wrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    // unwrap(from, to, amount) — the `amount` is an already-ACL-approved
    // euint64 handle (bytes32). Returns the unwrap request id.
    name: 'unwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'bytes32' },
    ],
    outputs: [{ name: 'unwrapRequestId', type: 'bytes32' }],
  },
  {
    // unwrap(from, to, encryptedAmount, inputProof) — overload accepting an
    // externalEuint64 + zk-proof, used when the amount wasn't pre-ACL'd.
    name: 'unwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'encryptedAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
    ],
    outputs: [{ name: 'unwrapRequestId', type: 'bytes32' }],
  },
  {
    // finalizeUnwrap(unwrapRequestId, cleartextAmount, decryptionProof)
    name: 'finalizeUnwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'unwrapRequestId', type: 'bytes32' },
      { name: 'unwrapAmountCleartext', type: 'uint64' },
      { name: 'decryptionProof', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    // unwrapRequester(bytes32) → address — used to look up who the pending
    // finalize will pay out to.
    name: 'unwrapRequester',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'unwrapRequestId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
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

  // === Public ERC-20 side (underlying reads via the wrapper's underlying()) ===
  // The wrapper does NOT expose a public ERC-20 balanceOf on itself in the
  // strict sense, but callers point at the underlying token's ABI. Keeping
  // these entries here means we can hand WRAPPER_ABI to callers uniformly.
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
    // Emitted by wrap(). Only `to` is indexed. `encryptedWrappedAmount` is
    // an euint64 handle (bytes32 at the ABI level).
    name: 'Wrap',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'roundedAmount', type: 'uint256', indexed: false },
      { name: 'encryptedWrappedAmount', type: 'bytes32', indexed: false },
    ],
  },
  {
    // Emitted by unwrap(). Per the IERC7984ERC20Wrapper interface, both
    // `to` and `unwrapRequestId` are indexed. `amount` is an euint64 handle.
    name: 'UnwrapRequested',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'unwrapRequestId', type: 'bytes32', indexed: true },
      { name: 'amount', type: 'bytes32', indexed: false },
    ],
  },
  {
    // Emitted by finalizeUnwrap(). Both `to` and `unwrapRequestId` are indexed.
    // `unwrapAmount` is an euint64 handle (bytes32). `unwrapAmountCleartext`
    // is the decrypted public value.
    name: 'UnwrapFinalized',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'unwrapRequestId', type: 'bytes32', indexed: true },
      { name: 'unwrapAmount', type: 'bytes32', indexed: false },
      { name: 'unwrapAmountCleartext', type: 'uint64', indexed: false },
    ],
  },
  {
    // ERC-20 Transfer event for the public side (underlying token).
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
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
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
 * ERC-7984 interface ID, verified on-chain in the Confidential Token
 * Wrappers Registry (`_validateERC7984` in
 * ConfidentialTokenWrappersRegistry.sol). All official ERC-7984 confidential
 * tokens support this interface via ERC-165.
 */
export const ERC7984_INTERFACE_ID = '0x4958f2a4' as const;

import type { PublicClient } from 'viem';

/**
 * Robust ERC-7984 detection.
 *
 * The ERC-165 `supportsInterface` check is the fast path, but it is NOT
 * sufficient on its own: some real, fully-functional ERC-7984 confidential
 * tokens do not implement ERC-165 and their `supportsInterface` call *reverts*
 * (verified live on Sepolia — e.g. `FUSD` at
 * `0xED3dFca7299341f9637617F5615Aa456b42b3D85` reverts on `supportsInterface`
 * yet answers `confidentialBalanceOf`). Gating on ERC-165 alone wrongly
 * rejects those tokens both in the wallet auto-scan and the Add-Pair form.
 *
 * So: try ERC-165 first; on `false`/revert, fall back to a behavioral probe —
 * a genuine ERC-7984 returns a 32-byte handle from `confidentialBalanceOf`
 * instead of reverting. A plain ERC-20 or EOA reverts and is rejected.
 */
export async function isErc7984Contract(
  client: Pick<PublicClient, 'readContract'>,
  address: `0x${string}`,
): Promise<boolean> {
  try {
    const ok = await client.readContract({
      address,
      abi: ERC165_ABI,
      functionName: 'supportsInterface',
      args: [ERC7984_INTERFACE_ID],
    });
    if (ok === true) return true;
  } catch {
    /* not ERC-165 compliant — fall through to the behavioral probe */
  }
  try {
    const handle = await client.readContract({
      address,
      abi: WRAPPER_ABI,
      functionName: 'confidentialBalanceOf',
      args: [address],
    });
    // bytes32 handle = '0x' + 64 hex chars. Any 32-byte answer (incl. the zero
    // handle for an account with no balance) proves the ERC-7984 method exists.
    return typeof handle === 'string' && handle.startsWith('0x') && handle.length === 66;
  } catch {
    return false;
  }
}
