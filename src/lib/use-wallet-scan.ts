'use client';

import { useState, useEffect, useCallback } from 'react';
import { type PublicClient, parseAbiItem } from 'viem';
import { ERC165_ABI, ERC20_ABI, ERC7984_INTERFACE_ID } from './wrapper-abi';
import { CHAIN_CONFIG, type SupportedChainId } from '@/config/chains';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetectedErc7984Token {
  /** On-chain address of the ERC-7984 contract */
  address: `0x${string}`;
  /** Token symbol — fetched from contract or derived */
  symbol: string;
  /** Full display name — fetched from contract */
  name: string;
  /** Wrapper decimals (should be 6 for official Zama wrappers) */
  decimals: number;
  /** True if this address is already covered by the official registry */
  isRegistryPair: boolean;
}

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

export interface WalletErc7984ScanResult {
  /** All ERC-7984 tokens detected in the wallet (includes registry ones) */
  detected: DetectedErc7984Token[];
  /** Only non-registry ERC-7984 tokens detected */
  extra: DetectedErc7984Token[];
  status: ScanStatus;
  error: string | null;
  /** Call this to re-run the scan */
  rescan: () => void;
}

// ─── ERC-7984 Interface ID ────────────────────────────────────────────────────
// Transfer event ABI — ERC-7984 wrappers emit standard ERC-20 Transfer events
// when tokens are minted (shield) or burned (unshield). We scan these events
// to discover which ERC-7984 contracts a wallet has interacted with.
const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Batch-check ERC-165 supportsInterface for many contract addresses */
async function filterErc7984Contracts(
  client: PublicClient,
  addresses: `0x${string}`[],
): Promise<`0x${string}`[]> {
  if (addresses.length === 0) return [];

  // Run checks in parallel — publicClients deduplicate identical RPC calls
  const results = await Promise.allSettled(
    addresses.map((addr) =>
      client.readContract({
        address: addr,
        abi: ERC165_ABI,
        functionName: 'supportsInterface',
        args: [ERC7984_INTERFACE_ID],
      }),
    ),
  );

  return addresses.filter((_, i) => {
    const r = results[i];
    return r.status === 'fulfilled' && r.value === true;
  });
}

/** Fetch symbol, name, decimals for an ERC-7984 contract */
async function fetchTokenMeta(
  client: PublicClient,
  address: `0x${string}`,
): Promise<{ symbol: string; name: string; decimals: number }> {
  const [symbolResult, nameResult, decimalsResult] = await Promise.allSettled([
    client.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }),
    client.readContract({ address, abi: ERC20_ABI, functionName: 'name' }),
    client.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
  ]);

  const symbol =
    symbolResult.status === 'fulfilled' ? String(symbolResult.value) : 'ERC-7984';
  const name =
    nameResult.status === 'fulfilled' ? String(nameResult.value) : symbol;
  const decimals =
    decimalsResult.status === 'fulfilled'
      ? Number(decimalsResult.value)
      : 6;

  return { symbol, name, decimals };
}

/** Fetch from Blockscout Token List API */
async function fetchBlockscoutTokens(
  explorerUrl: string,
  walletAddress: `0x${string}`,
): Promise<`0x${string}`[]> {
  const url = `${explorerUrl}/api?module=account&action=tokenlist&address=${walletAddress}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Blockscout API returned status ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== '1' || !Array.isArray(data.result)) {
    throw new Error(data.message || 'Invalid Blockscout API response');
  }
  return data.result
    .map((item: any) => item.contractAddress)
    .filter(
      (addr: any): addr is `0x${string}` =>
        typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42,
    );
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

/**
 * Scans the connected wallet's history using a hybrid approach to auto-detect
 * all ERC-7984 confidential tokens — including ones NOT in the official registry.
 *
 * Hybrid pipeline:
 *  1. [L1] Fast API: Query Blockscout Token List API for instant response.
 *  2. [L2] RPC fallback: If L1 fails or is on localhost, scan both incoming
 *          and outgoing Transfer events from the RPC node directly.
 *  3. [Verification] On-chain check: Run supportsInterface(0x4958f2a4) against
 *     all gathered unique contract addresses to ensure ERC-7984 compliance.
 *  4. Fetch metadata (symbol, name, decimals) for compliant tokens.
 *
 * @param walletAddress   Connected wallet address (0x...)
 * @param client          A viem PublicClient for the current chain
 * @param registryAddresses  Set of ERC-7984 addresses already shown by the registry UI
 */
export function useWalletErc7984Scan(
  walletAddress: `0x${string}` | undefined,
  client: PublicClient | undefined,
  registryAddresses: Set<string>,
): WalletErc7984ScanResult {
  const [detected, setDetected] = useState<DetectedErc7984Token[]>([]);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scanTick, setScanTick] = useState(0);

  const rescan = useCallback(() => setScanTick((t) => t + 1), []);

  useEffect(() => {
    if (!walletAddress || !client) {
      setDetected([]);
      setStatus('idle');
      return;
    }

    let cancelled = false;

    async function run() {
      if (!client || !walletAddress) return;
      setStatus('scanning');
      setError(null);

      const chainId = client.chain?.id;
      const chainConfig = chainId ? CHAIN_CONFIG[chainId as SupportedChainId] : undefined;
      const explorerUrl = chainConfig?.explorerUrl;

      let rawContracts: `0x${string}`[] = [];
      let apiSucceeded = false;

      // ── Step 1: L1 - Blockscout API Scan ────────────────────────────────
      if (explorerUrl) {
        try {
          rawContracts = await fetchBlockscoutTokens(explorerUrl, walletAddress);
          apiSucceeded = true;
          console.log(`[useWalletErc7984Scan] Blockscout API detected ${rawContracts.length} tokens`);
        } catch (apiErr) {
          console.warn('[useWalletErc7984Scan] Blockscout API failed, falling back to RPC logs:', apiErr);
        }
      }

      // ── Step 2: L2 - RPC getLogs fallback (if API failed or returned empty) ──
      if (!apiSucceeded && !cancelled) {
        try {
          const latestBlock = await client.getBlockNumber();
          let logs: any[] = [];

          // Try 500k, 100k, then 10k block ranges to handle RPC limit limits
          for (const lookback of [500_000n, 100_000n, 10_000n]) {
            try {
              const fromBlock = latestBlock > lookback ? latestBlock - lookback : 0n;
              const [incoming, outgoing] = await Promise.all([
                client.getLogs({
                  event: TRANSFER_EVENT,
                  args: { to: walletAddress },
                  fromBlock,
                  toBlock: 'latest',
                }),
                client.getLogs({
                  event: TRANSFER_EVENT,
                  args: { from: walletAddress },
                  fromBlock,
                  toBlock: 'latest',
                }),
              ]);
              logs = [...incoming, ...outgoing];
              break; // successfully queried
            } catch (err) {
              // Range too large for this RPC node, retry with smaller lookback
            }
          }

          rawContracts = [
            ...new Set(logs.map((l) => l.address.toLowerCase())),
          ] as `0x${string}`[];
          console.log(`[useWalletErc7984Scan] RPC scan detected ${rawContracts.length} unique contracts`);
        } catch (rpcErr) {
          if (!cancelled) {
            setError(rpcErr instanceof Error ? rpcErr.message : 'Scan failed');
            setStatus('error');
            return;
          }
        }
      }

      if (cancelled) return;

      // Ensure all addresses are in correct checksum/lowercase format
      const uniqueContracts = [
        ...new Set(rawContracts.map((c) => c.toLowerCase())),
      ] as `0x${string}`[];

      if (uniqueContracts.length === 0) {
        if (!cancelled) {
          setDetected([]);
          setStatus('done');
        }
        return;
      }

      try {
        // ── Step 3: Verify ERC-7984 compliance on-chain ────────────────────
        const verifiedAddrs = await filterErc7984Contracts(client, uniqueContracts);

        if (cancelled) return;
        if (verifiedAddrs.length === 0) {
          setDetected([]);
          setStatus('done');
          return;
        }

        // ── Step 4: Fetch metadata ──────────────────────────────────────────
        const tokenData = await Promise.all(
          verifiedAddrs.map(async (addr) => {
            const meta = await fetchTokenMeta(client, addr);
            return {
              address: addr,
              ...meta,
              isRegistryPair: registryAddresses.has(addr.toLowerCase()),
            };
          }),
        );

        if (!cancelled) {
          // Sort: registry pairs first, then detected pairs
          tokenData.sort((a, b) => {
            if (a.isRegistryPair !== b.isRegistryPair)
              return a.isRegistryPair ? -1 : 1;
            return a.symbol.localeCompare(b.symbol);
          });
          setDetected(tokenData);
          setStatus('done');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Verification failed');
          setStatus('error');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, client, scanTick]);

  const extra = detected.filter((t) => !t.isRegistryPair);

  return { detected, extra, status, error, rescan };
}
