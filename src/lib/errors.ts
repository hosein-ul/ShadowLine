/**
 * Centralised error classification for Zama SDK errors.
 *
 * Uses `matchZamaError` from `@zama-fhe/sdk` to map every known SDK error
 * code to a user-friendly toast message. Call `classifyError(err)` in any
 * catch block to get a `{ title, message }` pair ready for `addToast`.
 *
 * Ref: https://docs.zama.org/protocol/sdk/api-references/sdk/errors
 */

import { matchZamaError } from '@zama-fhe/sdk';

export interface ClassifiedError {
  title: string;
  message: string;
  /** When true the operation can be retried immediately (e.g. user rejected signature). */
  retryable: boolean;
}

/**
 * Classify an unknown thrown value into a user-friendly error.
 *
 * Handles:
 * - All `ZamaError` subtypes via `matchZamaError`
 * - Plain `Error` objects (wallet / RPC / generic JS errors)
 * - Non-Error thrown values (strings, nulls, etc.)
 */
export function classifyError(error: unknown): ClassifiedError {
  // Try Zama SDK error classification first
  const zamaResult = matchZamaError(error, {
    SIGNING_REJECTED: () => ({
      title: 'Signature Declined',
      message: 'You declined the signature request in your wallet. You can try again whenever you are ready.',
      retryable: true,
    }),
    SIGNING_FAILED: (e) => ({
      title: 'Wallet Signing Failed',
      message: `Your wallet could not complete the signature: ${e.message}. Check your wallet connection and try again.`,
      retryable: true,
    }),
    ENCRYPTION_FAILED: () => ({
      title: 'Encryption Failed',
      message: 'FHE encryption failed. Make sure your browser supports WebAssembly and try again.',
      retryable: true,
    }),
    DECRYPTION_FAILED: () => ({
      title: 'Decryption Failed',
      message: 'Could not decrypt your balance. Your session permit may have expired — try decrypting again.',
      retryable: true,
    }),
    TRANSACTION_REVERTED: (e) => ({
      title: 'Transaction Reverted',
      message: `The transaction failed on-chain: ${e.message}. Check your balance and approval, then try again.`,
      retryable: true,
    }),
    INVALID_KEYPAIR: () => ({
      title: 'Session Key Rejected',
      message: 'Your session key was rejected by the relayer. Please sign again to generate a fresh key.',
      retryable: true,
    }),
    KEYPAIR_EXPIRED: () => ({
      title: 'Session Expired',
      message: 'Your session key has expired. Sign again to continue.',
      retryable: true,
    }),
    NO_CIPHERTEXT: () => ({
      title: 'No Confidential Balance',
      message: 'This account has never shielded tokens for this wrapper. Shield some tokens first to create a confidential balance.',
      retryable: false,
    }),
    RELAYER_REQUEST_FAILED: () => ({
      title: 'Relayer Unavailable',
      message: 'The Zama relayer is temporarily unavailable. Please wait a moment and try again.',
      retryable: true,
    }),
    CONFIGURATION: (e) => ({
      title: 'Configuration Error',
      message: `SDK configuration issue: ${e.message}. This is likely a bug — please report it.`,
      retryable: false,
    }),
    INSUFFICIENT_CONFIDENTIAL_BALANCE: () => ({
      title: 'Insufficient Confidential Balance',
      message: 'Your encrypted balance is lower than the amount you are trying to unshield or transfer.',
      retryable: false,
    }),
    INSUFFICIENT_ERC20_BALANCE: () => ({
      title: 'Insufficient Token Balance',
      message: 'You do not have enough public tokens to shield the requested amount.',
      retryable: false,
    }),
    BALANCE_CHECK_UNAVAILABLE: () => ({
      title: 'Balance Check Unavailable',
      message: 'Could not verify your balance. Sign a permit first, or try again.',
      retryable: true,
    }),
    ERC20_READ_FAILED: () => ({
      title: 'Token Read Failed',
      message: 'Could not read your token balance. Check your network connection and try again.',
      retryable: true,
    }),
    ACL_PAUSED: () => ({
      title: 'Protocol Paused',
      message: 'The confidential token system is temporarily paused for maintenance. Please try again later.',
      retryable: false,
    }),
    APPROVAL_FAILED: (e) => ({
      title: 'Approval Failed',
      message: `Token approval failed: ${e.message}. Check your balance and try again.`,
      retryable: true,
    }),
    _: (e) => ({
      title: 'Unexpected Error',
      message: `An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`,
      retryable: true,
    }),
  });

  if (zamaResult) return zamaResult;

  // Fallback for non-Zama errors (wallet rejections, network errors, etc.)
  const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error');

  // Common wallet rejection patterns (MetaMask, WalletConnect, etc.)
  if (
    msg.includes('user rejected') ||
    msg.includes('User denied') ||
    msg.includes('ACTION_REJECTED') ||
    msg.includes('user cancelled')
  ) {
    return {
      title: 'Request Cancelled',
      message: 'You cancelled the request in your wallet.',
      retryable: true,
    };
  }

  return {
    title: 'Transaction Failed',
    message: msg || 'The operation failed. Please try again.',
    retryable: true,
  };
}
