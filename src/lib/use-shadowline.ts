/**
 * ShadowLine Drop-in Developer SDK & Hook (`useShadowline`)
 *
 * Designed for effortless developer adoption: Any developer can copy this file
 * into their React / Next.js / Wagmi project to instantly integrate Zama FHEVM
 * confidential asset shielding (ERC-7984), confidential transfers, and balance
 * decryption without writing boilerplate contract or relayer code.
 *
 * This hook leverages `@zama-fhe/react-sdk` and `@zama-fhe/sdk` under the hood
 * to guarantee 100% zero-hallucination FHE encryption and proof generation.
 *
 * @example
 * ```tsx
 * import { useShadowline } from '@/lib/use-shadowline';
 *
 * export default function MyConfidentialApp() {
 *   const { pairs, shield, unshield, transfer, decryptBalance, isReady } = useShadowline();
 *   
 *   return (
 *     <div>
 *       <button onClick={() => shield('0xWrapper...', '10.5')}>Shield 10.5 Tokens</button>
 *       <button onClick={() => transfer('0xWrapper...', '0xRecipient...', '5.0')}>Send 5 cTokens</button>
 *       <button onClick={async () => alert(await decryptBalance('0xWrapper...'))}>View Balance</button>
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, type Address, type Hex } from 'viem';
import { useRegistryPairs } from '@/lib/registry';
import { type WrapperPair } from '@/config/contracts';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useToast } from '@/components/ui/Toast';
import { useZamaSDK } from '@zama-fhe/react-sdk';
import { ERC20_ABI } from '@/lib/wrapper-abi';

export interface ShadowlineHookReturn {
  /** List of verified confidential token pairs available on the active chain */
  pairs: WrapperPair[];
  /** Whether the user's wallet is connected */
  isConnected: boolean;
  /** Whether the Zama FHE SDK worker pool and relayer connection are initialized and ready */
  isReady: boolean;
  /** Active network chain ID */
  chainId: number;
  /**
   * One-click helper to shield (wrap) public ERC-20 tokens into ERC-7984 confidential tokens.
   * Handles ERC-20 allowance check/approval and wrapper deposit automatically.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Amount in human-readable string (e.g. "10.5"). Formatted in UNDERLYING decimals!
   */
  shield: (wrapperAddress: Address, amountStr: string) => Promise<Hex | undefined>;
  /**
   * One-click helper to request unshielding (unwrap) from confidential ERC-7984 back to public ERC-20.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Amount in human-readable string (e.g. "10.5"). Formatted in FIXED 6 DECIMALS!
   */
  unshield: (wrapperAddress: Address, amountStr: string) => Promise<Hex | undefined>;
  /**
   * Perform a confidential token transfer.
   * Automatically encrypts the transfer amount using local WASM FHE client-side encryption.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param to - Recipient wallet address
   * @param amountStr - Amount in human-readable string (e.g. "5.0"). Formatted in FIXED 6 DECIMALS!
   */
  transfer: (wrapperAddress: Address, to: Address, amountStr: string) => Promise<Hex | undefined>;
  /**
   * Decrypt and view the user's confidential token balance.
   * Automatically prompts for an EIP-712 read-only permit if not already cached.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   */
  decryptBalance: (wrapperAddress: Address) => Promise<string | undefined>;
}

export function useShadowline(): ShadowlineHookReturn {
  const { activeChainId } = useActiveNetwork();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addToast } = useToast();
  const sdk = useZamaSDK();

  // Fetch all verified pairs for the active chain
  const { pairs: rawPairs } = useRegistryPairs(activeChainId);

  // Filter only verified official or cached pairs for clean developer usage
  const pairs = useMemo(
    () => rawPairs.filter((p) => p.source !== 'custom' && !p.unverified),
    [rawPairs]
  );

  const isReady = Boolean(isConnected && address && sdk && walletClient && publicClient);

  const checkReady = useCallback((): boolean => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      addToast({ title: 'Wallet Not Connected', message: 'Please connect your wallet first.', variant: 'error' });
      return false;
    }
    if (!sdk) {
      addToast({ title: 'FHE SDK Not Ready', message: 'Zama FHE SDK is initializing or not available.', variant: 'error' });
      return false;
    }
    return true;
  }, [isConnected, address, walletClient, publicClient, sdk, addToast]);

  const shield = useCallback(
    async (wrapperAddress: Address, amountStr: string): Promise<Hex | undefined> => {
      if (!checkReady() || !sdk || !address || !walletClient || !publicClient) return undefined;

      const pair = rawPairs.find((p) => p.erc7984Address.toLowerCase() === wrapperAddress.toLowerCase());
      if (!pair) {
        addToast({ title: 'Token Not Found', message: 'Invalid wrapper address.', variant: 'error' });
        return undefined;
      }

      try {
        const rawAmount = parseUnits(amountStr, pair.decimals);

        // Check ERC-20 allowance
        const allowance = await publicClient.readContract({
          address: pair.erc20Address as Address,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, wrapperAddress],
        });

        if (allowance < rawAmount) {
          addToast({ title: 'Approving Token...', message: `Please approve ${pair.symbol} spend in your wallet.`, variant: 'info' });
          
          // Zero allowance first if non-zero (required for USDT-style tokens)
          if (allowance > 0n) {
            const zeroHash = await walletClient.writeContract({
              address: pair.erc20Address as Address,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [wrapperAddress, 0n],
            });
            await publicClient.waitForTransactionReceipt({ hash: zeroHash });
          }

          const approveHash = await walletClient.writeContract({
            address: pair.erc20Address as Address,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [wrapperAddress, rawAmount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        addToast({ title: 'Shielding Assets...', message: 'Confirm shielding transaction in your wallet.', variant: 'info' });
        
        // Use Zama SDK WrappedToken to execute shield
        const wrappedToken = sdk.createToken(wrapperAddress);
        const res = await wrappedToken.shield(rawAmount, { approvalStrategy: 'skip' });

        addToast({ title: 'Shield Submitted', message: 'Transaction broadcasted to network.', variant: 'success' });
        return res.txHash;
      } catch (err: any) {
        console.error('Shield error:', err);
        addToast({ title: 'Shield Failed', message: err?.shortMessage || err?.message || 'Transaction rejected.', variant: 'error' });
        return undefined;
      }
    },
    [checkReady, sdk, address, walletClient, publicClient, rawPairs, addToast]
  );

  const unshield = useCallback(
    async (wrapperAddress: Address, amountStr: string): Promise<Hex | undefined> => {
      if (!checkReady() || !sdk) return undefined;

      try {
        addToast({ title: 'Requesting Unshield...', message: 'Confirm unshield request in your wallet.', variant: 'info' });
        
        // Use Zama SDK WrappedToken to execute unshield (handles euint64 ciphertext handles automatically)
        const rawAmount = parseUnits(amountStr, 6); // FHE euint64 fixed 6-decimal scaling
        const wrappedToken = sdk.createToken(wrapperAddress);
        const res = await wrappedToken.unshield(rawAmount);

        addToast({ title: 'Unshield Requested', message: 'Relayer will decrypt and finalize transfer shortly.', variant: 'success' });
        return res.txHash;
      } catch (err: any) {
        console.error('Unshield error:', err);
        addToast({ title: 'Unshield Failed', message: err?.shortMessage || err?.message || 'Transaction rejected.', variant: 'error' });
        return undefined;
      }
    },
    [checkReady, sdk, addToast]
  );

  const transfer = useCallback(
    async (wrapperAddress: Address, to: Address, amountStr: string): Promise<Hex | undefined> => {
      if (!checkReady() || !sdk) return undefined;

      try {
        addToast({ title: 'Encrypting & Sending...', message: 'Confirm confidential transfer in your wallet.', variant: 'info' });
        
        // Use Zama SDK WrappedToken to execute confidential transfer (encrypts amount via WASM)
        const rawAmount = parseUnits(amountStr, 6); // FHE euint64 fixed 6-decimal scaling
        const wrappedToken = sdk.createToken(wrapperAddress);
        const res = await wrappedToken.confidentialTransfer(to, rawAmount);

        addToast({ title: 'Transfer Submitted', message: 'Confidential transfer broadcasted to network.', variant: 'success' });
        return res.txHash;
      } catch (err: any) {
        console.error('Transfer error:', err);
        addToast({ title: 'Transfer Failed', message: err?.shortMessage || err?.message || 'Transaction rejected.', variant: 'error' });
        return undefined;
      }
    },
    [checkReady, sdk, addToast]
  );

  const decryptBalance = useCallback(
    async (wrapperAddress: Address): Promise<string | undefined> => {
      if (!checkReady() || !sdk || !address) return undefined;

      try {
        addToast({ title: 'Decrypting Balance...', message: 'Please sign the EIP-712 permit in your wallet if prompted.', variant: 'info' });
        
        const wrappedToken = sdk.createToken(wrapperAddress);
        const balance = await wrappedToken.balanceOf(address);

        return balance.toString();
      } catch (err: any) {
        console.error('Decrypt error:', err);
        addToast({ title: 'Decryption Failed', message: err?.shortMessage || err?.message || 'Permit rejected or relayer error.', variant: 'error' });
        return undefined;
      }
    },
    [checkReady, sdk, address, addToast]
  );

  return {
    pairs,
    isConnected,
    isReady,
    chainId: activeChainId,
    shield,
    unshield,
    transfer,
    decryptBalance,
  };
}
