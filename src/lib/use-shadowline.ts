/**
 * ShadowLine Drop-in Developer SDK & Hook (`useShadowline`)
 *
 * Designed for effortless developer adoption: Any developer can copy this file
 * into their React / Next.js / Wagmi project to instantly integrate Zama FHEVM
 * confidential asset shielding (ERC-7984) without writing boilerplate contract or relayer code.
 *
 * @example
 * ```tsx
 * import { useShadowline } from '@/lib/use-shadowline';
 *
 * export default function MyConfidentialApp() {
 *   const { pairs, shield, unshield, isWorking } = useShadowline();
 *   
 *   return (
 *     <button onClick={() => shield('0x123...', '10.5')}>
 *       Shield 10.5 Tokens Confidentially
 *     </button>
 *   );
 * }
 * ```
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, type Address } from 'viem';
import { useRegistryPairs, type WrapperPairRecord } from '@/lib/registry';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useToast } from '@/components/ui/Toast';

export interface ShadowlineHookReturn {
  /** List of verified confidential token pairs available on the active chain */
  pairs: WrapperPairRecord[];
  /** Whether the user's wallet is connected */
  isConnected: boolean;
  /** Active network chain ID */
  chainId: number;
  /**
   * One-click helper to shield (wrap) public ERC-20 tokens into ERC-7984 confidential tokens.
   * Handles ERC-20 allowance check/approval and wrapper deposit automatically.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Amount in human-readable string (e.g. "10.5")
   */
  shield: (wrapperAddress: Address, amountStr: string) => Promise<`0x${string}` | undefined>;
  /**
   * One-click helper to request unshielding (unwrap) from confidential ERC-7984 back to public ERC-20.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Amount in human-readable string (e.g. "10.5")
   */
  unshield: (wrapperAddress: Address, amountStr: string) => Promise<`0x${string}` | undefined>;
}

export function useShadowline(): ShadowlineHookReturn {
  const { activeChainId } = useActiveNetwork();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addToast } = useToast();

  // Fetch all verified pairs for the active chain
  const { pairs: rawPairs } = useRegistryPairs(activeChainId);

  // Filter only verified official or cached pairs for clean developer usage
  const pairs = useMemo(
    () => rawPairs.filter((p) => p.source !== 'custom' && !p.unverified),
    [rawPairs]
  );

  const shield = useCallback(
    async (wrapperAddress: Address, amountStr: string): Promise<`0x${string}` | undefined> => {
      if (!isConnected || !address || !walletClient || !publicClient) {
        addToast({ title: 'Wallet Not Connected', description: 'Please connect your wallet first.', variant: 'error' });
        return;
      }

      const pair = rawPairs.find((p) => p.erc7984Address.toLowerCase() === wrapperAddress.toLowerCase());
      if (!pair) {
        addToast({ title: 'Token Not Found', description: 'Invalid wrapper address.', variant: 'error' });
        return;
      }

      try {
        const rawAmount = parseUnits(amountStr, pair.decimals);

        // Check ERC-20 allowance
        const allowance = await publicClient.readContract({
          address: pair.erc20Address as Address,
          abi: [
            {
              name: 'allowance',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ] as const,
          functionName: 'allowance',
          args: [address, wrapperAddress],
        });

        if (allowance < rawAmount) {
          addToast({ title: 'Approving Token...', description: `Please approve ${pair.symbol} spend in your wallet.`, variant: 'info' });
          const approveHash = await walletClient.writeContract({
            address: pair.erc20Address as Address,
            abi: [
              {
                name: 'approve',
                type: 'function',
                stateMutability: 'nonpayable',
                inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
                outputs: [{ name: '', type: 'bool' }],
              },
            ] as const,
            functionName: 'approve',
            args: [wrapperAddress, rawAmount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        addToast({ title: 'Shielding Assets...', description: 'Confirm shielding transaction in your wallet.', variant: 'info' });
        const shieldHash = await walletClient.writeContract({
          address: wrapperAddress,
          abi: [
            {
              name: 'depositFor',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
              outputs: [{ name: '', type: 'bool' }],
            },
          ] as const,
          functionName: 'depositFor',
          args: [address, rawAmount],
        });

        addToast({ title: 'Shield Submitted', description: 'Transaction broadcasted to network.', variant: 'success' });
        return shieldHash;
      } catch (err: any) {
        console.error('Shield error:', err);
        addToast({ title: 'Shield Failed', description: err?.shortMessage || err?.message || 'Transaction rejected.', variant: 'error' });
        return undefined;
      }
    },
    [isConnected, address, walletClient, publicClient, rawPairs, addToast]
  );

  const unshield = useCallback(
    async (wrapperAddress: Address, amountStr: string): Promise<`0x${string}` | undefined> => {
      if (!isConnected || !address || !walletClient) {
        addToast({ title: 'Wallet Not Connected', description: 'Please connect your wallet first.', variant: 'error' });
        return;
      }

      const pair = rawPairs.find((p) => p.erc7984Address.toLowerCase() === wrapperAddress.toLowerCase());
      if (!pair) {
        addToast({ title: 'Token Not Found', description: 'Invalid wrapper address.', variant: 'error' });
        return;
      }

      try {
        // FHE confidential wrappers use fixed 6 decimals scale for ciphertexts
        const scaledAmount = parseUnits(amountStr, 6);

        addToast({ title: 'Requesting Unshield...', description: 'Confirm unshield request in your wallet.', variant: 'info' });
        const unshieldHash = await walletClient.writeContract({
          address: wrapperAddress,
          abi: [
            {
              name: 'requestWithdraw',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [{ name: 'amount', type: 'uint64' }],
              outputs: [{ name: '', type: 'uint256' }],
            },
          ] as const,
          functionName: 'requestWithdraw',
          args: [scaledAmount as unknown as bigint],
        });

        addToast({ title: 'Unshield Requested', description: 'Relayer will decrypt and finalize transfer shortly.', variant: 'success' });
        return unshieldHash;
      } catch (err: any) {
        console.error('Unshield error:', err);
        addToast({ title: 'Unshield Failed', description: err?.shortMessage || err?.message || 'Transaction rejected.', variant: 'error' });
        return undefined;
      }
    },
    [isConnected, address, walletClient, rawPairs, addToast]
  );

  return {
    pairs,
    isConnected,
    chainId: activeChainId,
    shield,
    unshield,
  };
}
