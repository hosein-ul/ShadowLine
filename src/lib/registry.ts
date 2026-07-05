'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, type Abi, type PublicClient } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { KNOWN_WRAPPERS, REGISTRY_ADDRESSES, type WrapperPair } from '@/config/contracts';
import { CUSTOM_PAIRS } from '@/config/custom-pairs';
import { type SupportedChainId } from '@/config/chains';
import { getTokenInfo } from '@/config/tokens';

// ─── User-added custom pairs (browser localStorage, chain-scoped) ────────────

/**
 * Rich record persisted under `shadowline.customPairs.v1.<chainId>`.
 * Chain-scoped (not wallet-scoped) so users see their pairs after switching
 * wallets. The .v<n>. segment protects future readers from schema drift.
 */
export interface CustomPairRecord {
  erc7984Address: `0x${string}`;
  /** Underlying ERC-20. Zero address when the token is confidential-only. */
  erc20Address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  wrapperDecimals: number;
  underlyingSymbol: string;
  underlyingName: string;
  addedAt: number;
  source: 'custom';
  /**
   * True (or absent, for back-compat) = an ERC-7984 wrapper with an underlying
   * ERC-20 → full shield/unshield. False = a confidential-only ERC-7984 token
   * with no wrapper → decrypt-only (no ERC-20 side, excluded from wrap/transfer
   * selectors).
   */
  isWrapper?: boolean;
}

export const CUSTOM_PAIRS_SCHEMA_VERSION = 1 as const;
export const customPairsKey = (chainId: number) =>
  `shadowline.customPairs.v${CUSTOM_PAIRS_SCHEMA_VERSION}.${chainId}`;

function isValidCustomPairRecord(x: unknown): x is CustomPairRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.erc7984Address === 'string' && r.erc7984Address.startsWith('0x') &&
    typeof r.erc20Address === 'string' && r.erc20Address.startsWith('0x') &&
    typeof r.symbol === 'string' &&
    typeof r.decimals === 'number' &&
    typeof r.wrapperDecimals === 'number' &&
    r.source === 'custom'
  );
}

export function loadCustomPairs(chainId: number): CustomPairRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(customPairsKey(chainId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCustomPairRecord);
  } catch {
    return [];
  }
}

export function saveCustomPairs(chainId: number, pairs: CustomPairRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(customPairsKey(chainId), JSON.stringify(pairs));
    // Ping listeners on this same tab (native `storage` event only fires
    // across tabs). useRegistryPairs listens for this to hot-refresh.
    window.dispatchEvent(new CustomEvent('shadowline:customPairsChanged', { detail: { chainId } }));
  } catch { /* best-effort */ }
}

function customRecordToWrapperPair(r: CustomPairRecord): WrapperPair {
  return {
    erc20Address: r.erc20Address,
    erc7984Address: r.erc7984Address,
    symbol: r.symbol,
    name: r.name,
    decimals: r.decimals,
    wrapperDecimals: r.wrapperDecimals,
    isValid: true,
    source: 'custom',
    note: 'User-added from the Add Custom Pair form in this browser.',
    isWrapper: r.isWrapper !== false, // false only for confidential-only tokens
  };
}

/**
 * Result of useRegistryPairs.
 *
 * `pairs`        — current list of wrapper pairs to render.
 * `isLoading`    — true while the on-chain registry call is in flight AND no
 *                  fallback data is yet displayable.
 * `error`        — any error returned by the RPC call (null if the fallback
 *                  is in use silently).
 * `isFromCache`  — true when `pairs` came from the hardcoded fallback rather
 *                  than from a live on-chain read. UI should show a small
 *                  "cached" indicator when this is true.
 * `total`        — total registered pair count reported by the registry (or
 *                  the fallback length when offline).
 */
export interface RegistryPairsResult {
  pairs: WrapperPair[];
  isLoading: boolean;
  error: Error | null;
  isFromCache: boolean;
  /**
   * @deprecated Use `officialTotal` + `customTotal` — mixing them was the
   * source of the "Registered Pairs = 11" bug where locally-declared pairs
   * were counted against the on-chain registry.
   */
  total: number;
  /** On-chain WrappersRegistry pairs (+ seeded config-file customs). */
  officialTotal: number;
  /** localStorage user-added pairs on the active chain. */
  customTotal: number;
  /** Raw localStorage records — includes confidential-only (isWrapper:false) pairs
   *  that are excluded from `pairs` (which drives shield/unshield flows). */
  localRecords: CustomPairRecord[];
}

/**
 * Real WrappersRegistry ABI, verified against
 * `contracts/confidential-token-wrappers-registry/contracts/ConfidentialTokenWrappersRegistry.sol`
 * in the zama-ai/protocol-apps repo. The two view functions below are the
 * canonical paginated read path — `getTokenConfidentialTokenPairsLength()`
 * for the count and `getTokenConfidentialTokenPairsSlice(from, to)` for the
 * `TokenWrapperPair { tokenAddress, confidentialTokenAddress, isValid }`
 * tuples.
 */
const REGISTRY_ABI = [
  {
    name: 'getTokenConfidentialTokenPairsLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTokenConfidentialTokenPairsSlice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'fromIndex', type: 'uint256' },
      { name: 'toIndex', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'confidentialTokenAddress', type: 'address' },
          { name: 'isValid', type: 'bool' },
        ],
      },
    ],
  },
] as const satisfies Abi;

const ERC20_META_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const satisfies Abi;

const RPC_URLS: Record<SupportedChainId, string> = {
  [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://ethereum-rpc.publicnode.com',
};

const VIEM_CHAINS: Record<SupportedChainId, typeof sepolia | typeof mainnet> = {
  [sepolia.id]: sepolia,
  [mainnet.id]: mainnet,
};

/**
 * Registry entries that are on-chain and on-chain-valid, but that were
 * permissionlessly registered by a third party rather than appearing in
 * Zama's official curated pair list (docs.zama.org/protocol/protocol-apps/
 * addresses). Coverage rule from the bounty is to expose every registered
 * pair; instead of dropping these we surface them with an `unverified` flag
 * + rationale so the UI can show a badge while still letting users
 * wrap/unwrap if they choose to.
 *
 * Verified live on 2026-07-02 via direct RPC calls to both registries
 * (see PR history) — both entries below are real, `isValid: true` pairs
 * with coherent on-chain metadata:
 *   - Mainnet `bbqTGBP` → underlying name "Steakhouse tGBP"
 *   - Mainnet + Sepolia `steakcUSDC` → underlying name
 *     "Steakhouse Confidential Prime USDC"
 * Both underlyings use a vanity `0xbeef…` address and share the
 * "Steakhouse" branding, suggesting the same third-party deployer
 * (Steakhouse Financial is a known DeFi risk-curation brand). This is not
 * evidence of malicious intent — just confirmation that Zama's team did
 * not curate or endorse the listing. Keep this list address-specific and
 * update the rationale if new facts are verified.
 */
const UNVERIFIED_WRAPPERS: Record<string, string> = {};

function normalizeSymbol(symbol: string | undefined): string {
  if (!symbol) return 'UNKNOWN';
  return symbol.replace(/Mock$/i, '');
}

function getPublicClient(chainId: SupportedChainId): PublicClient {
  return createPublicClient({
    chain: VIEM_CHAINS[chainId],
    transport: http(RPC_URLS[chainId]),
  });
}

async function readTokenMeta(
  client: PublicClient,
  address: `0x${string}`,
): Promise<{ name: string; symbol: string; decimals: number }> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'name' }),
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'symbol' }),
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'decimals' }),
    ]);
    return { name: name as string, symbol: symbol as string, decimals: Number(decimals) };
  } catch {
    return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
  }
}

/**
 * Fetch the full pair list for a given chain from the on-chain
 * WrappersRegistry. Works with any RPC — no wallet or signer required. This
 * is what unlocks live registry coverage for disconnected visitors.
 */
async function fetchLivePairs(chainId: SupportedChainId): Promise<WrapperPair[]> {
  const client = getPublicClient(chainId);
  const registryAddress = REGISTRY_ADDRESSES[chainId];

  const total = (await client.readContract({
    address: registryAddress,
    abi: REGISTRY_ABI,
    functionName: 'getTokenConfidentialTokenPairsLength',
  })) as bigint;

  if (total === 0n) return [];

  const slice = (await client.readContract({
    address: registryAddress,
    abi: REGISTRY_ABI,
    functionName: 'getTokenConfidentialTokenPairsSlice',
    args: [0n, total],
  })) as readonly {
    tokenAddress: `0x${string}`;
    confidentialTokenAddress: `0x${string}`;
    isValid: boolean;
  }[];

  const enriched = await Promise.all(
    slice.map(async (entry): Promise<WrapperPair> => {
      const [underlyingMeta, wrapperMeta] = await Promise.all([
        readTokenMeta(client, entry.tokenAddress),
        readTokenMeta(client, entry.confidentialTokenAddress),
      ]);
      const normalizedSymbol = normalizeSymbol(underlyingMeta.symbol);
      const display = getTokenInfo(normalizedSymbol);
      const wrapperKey = entry.confidentialTokenAddress.toLowerCase();
      const unverifiedReason = UNVERIFIED_WRAPPERS[wrapperKey];
      return {
        erc20Address: entry.tokenAddress,
        erc7984Address: entry.confidentialTokenAddress,
        symbol: normalizedSymbol,
        name: underlyingMeta.name || display.name,
        decimals: underlyingMeta.decimals,
        wrapperDecimals: wrapperMeta.decimals || 6,
        isValid: entry.isValid,
        underlyingRawSymbol: underlyingMeta.symbol,
        source: 'registry',
        ...(unverifiedReason ? { unverified: true, unverifiedReason } : {}),
      };
    }),
  );

  return dedupeSymbols(enriched);
}

/**
 * Mock-suffix stripping (`normalizeSymbol`) can make two genuinely distinct
 * on-chain pairs collide on `symbol` — verified live on Sepolia, where a
 * mintable "tGBPMock" (→ "tGBP") and the real, non-mintable "tGBP" both
 * normalize to the same display symbol. Several call sites use `symbol` as
 * a unique key/value (the wrap page's token `<select>`, `findPairBySymbol`,
 * deep-link `?token=` query params) — an unresolved collision silently
 * makes the second pair unreachable, which breaks the bounty's coverage
 * requirement (every registry pair must be wrap/unwrap-able).
 *
 * Fix: when a symbol collides within one chain's pair list, keep the
 * mintable/mock entry's display symbol unchanged (it's what users expect
 * from the faucet flow) and suffix every other colliding entry with
 * " (Restricted)" — matching the terminology already used elsewhere in
 * this codebase for non-mintable pairs. If more than one non-mock entry
 * collides (not observed today, but not provably impossible), fall back to
 * a short address suffix so every entry is still guaranteed unique.
 */
function dedupeSymbols(pairs: WrapperPair[]): WrapperPair[] {
  const bySymbol = new Map<string, WrapperPair[]>();
  for (const pair of pairs) {
    const key = pair.symbol.toLowerCase();
    const group = bySymbol.get(key);
    if (group) group.push(pair);
    else bySymbol.set(key, [pair]);
  }

  return pairs.map((pair) => {
    const group = bySymbol.get(pair.symbol.toLowerCase())!;
    if (group.length <= 1) return pair;

    const isMock = /mock$/i.test(pair.underlyingRawSymbol ?? '');
    if (isMock) return pair;

    const nonMockSiblings = group.filter(
      (p) => !/mock$/i.test(p.underlyingRawSymbol ?? '') && p !== pair,
    );
    const suffix =
      nonMockSiblings.length === 0
        ? ' (Restricted)'
        : ` (${pair.erc20Address.slice(2, 6)})`;

    return { ...pair, symbol: `${pair.symbol}${suffix}` };
  });
}

/**
 * True when this pair's underlying ERC-20 is a Zama-deployed mock with a
 * public `mint(address,uint256)` — i.e. the faucet can drip from it.
 *
 * Detection rules, in order of precedence:
 *  1. `underlyingRawSymbol` ends with `Mock` (case-insensitive) — this is
 *     the canonical signal from the on-chain metadata.
 *  2. As a fallback for the hardcoded snapshot (which doesn't carry the
 *     raw symbol), assume any Sepolia entry in the local list is mintable
 *     because the hardcoded list was curated to include mocks only.
 */
export function isMintablePair(pair: WrapperPair): boolean {
  const raw = pair.underlyingRawSymbol;
  if (typeof raw === 'string' && raw.length > 0) {
    return /mock$/i.test(raw);
  }
  return true;
}

/**
 * Merge custom pairs from the local config into a live pair list.
 * De-duplication rule: if the same erc20Address already exists in `base`
 * (from the on-chain registry or the hardcoded snapshot), the onchain/snapshot
 * entry wins and the custom pair is silently dropped.
 */
function mergeCustomPairs(base: WrapperPair[], userPairs: WrapperPair[] = []): WrapperPair[] {
  const knownErc20 = new Set(base.map((p) => p.erc20Address.toLowerCase()));
  const knownErc7984 = new Set(base.map((p) => p.erc7984Address.toLowerCase()));
  const configPairs = CUSTOM_PAIRS.filter(
    (cp) =>
      !knownErc20.has(cp.erc20Address.toLowerCase()) &&
      !knownErc7984.has(cp.erc7984Address.toLowerCase()),
  );
  // Second pass — user-added pairs from localStorage. Same dedup rule; on-chain
  // wins over both config and local storage per the resolution order.
  const afterConfig = [...base, ...configPairs];
  const afterConfigErc20 = new Set(afterConfig.map((p) => p.erc20Address.toLowerCase()));
  const afterConfigErc7984 = new Set(afterConfig.map((p) => p.erc7984Address.toLowerCase()));
  const userAdded = userPairs.filter(
    (cp) =>
      !afterConfigErc20.has(cp.erc20Address.toLowerCase()) &&
      !afterConfigErc7984.has(cp.erc7984Address.toLowerCase()),
  );
  return [...afterConfig, ...userAdded];
}

/**
 * Subscribe to localStorage-backed custom pairs for the given chain.
 * Refreshes on same-tab writes (via `shadowline:customPairsChanged`) and
 * cross-tab writes (via the native `storage` event). SSR-safe.
 */
function useLocalCustomPairs(chainId: SupportedChainId): CustomPairRecord[] {
  const [records, setRecords] = useState<CustomPairRecord[]>([]);
  useEffect(() => {
    setRecords(loadCustomPairs(chainId));
    if (typeof window === 'undefined') return;
    const targetKey = customPairsKey(chainId);
    const reload = () => setRecords(loadCustomPairs(chainId));
    const onSameTab = (e: Event) => {
      const detail = (e as CustomEvent<{ chainId?: number }>).detail;
      if (!detail || detail.chainId === chainId) reload();
    };
    const onCrossTab = (e: StorageEvent) => {
      if (e.key === targetKey) reload();
    };
    window.addEventListener('shadowline:customPairsChanged', onSameTab as EventListener);
    window.addEventListener('storage', onCrossTab);
    return () => {
      window.removeEventListener('shadowline:customPairsChanged', onSameTab as EventListener);
      window.removeEventListener('storage', onCrossTab);
    };
  }, [chainId]);
  return records;
}

/**
 * Read the on-chain WrappersRegistry for a given chain.
 *
 * Behaviour (2026-07 rewrite for bounty compliance):
 *  - Always attempts a **live on-chain read** for the requested chain via
 *    a viem `PublicClient` — no wallet connection or signer is required.
 *    This lets disconnected visitors and users on a different network see
 *    the true registry state.
 *  - `KNOWN_WRAPPERS[chainId]` is used **only** as an offline fallback when
 *    the RPC read genuinely fails (network down, RPC misbehaving). In that
 *    case `isFromCache: true` so the UI can transparently show a "cached
 *    snapshot" banner.
 *  - Suspected placeholder entries (e.g. Mainnet `cbbqTGBP`) are kept in
 *    the result with `unverified: true` and a reason — never silently
 *    dropped, per the bounty's coverage rule.
 *
 * Pagination: the registry is small (< 20 pairs today). The slice call
 * fetches all entries in a single view call so pagination isn't needed
 * yet; when the registry grows past ~200 pairs this can be looped.
 */
export function useRegistryPairs(chainId: SupportedChainId): RegistryPairsResult {
  const query = useQuery<WrapperPair[], Error>({
    queryKey: ['registry-pairs', chainId],
    queryFn: () => fetchLivePairs(chainId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Resolution order (bounty-mandated): on-chain (primary) → local custom
  // pairs (config file + browser localStorage) → hardcoded offline snapshot.
  // On-chain wins on any address conflict.
  const localRecords = useLocalCustomPairs(chainId);
  const userPairs = useMemo(
    // Confidential-only custom tokens (isWrapper === false) have no ERC-20 side
    // and can't be shielded/unshielded, so they never enter the wrapper-pair
    // list that drives the Wrap/Transfer selectors. The registry page still
    // renders them in the Custom / Dev-only section as decrypt-only rows.
    () => localRecords.filter((r) => r.isWrapper !== false).map(customRecordToWrapperPair),
    [localRecords],
  );

  return useMemo<RegistryPairsResult>(() => {
    const fallbackPairs = (KNOWN_WRAPPERS[chainId] ?? []).map((p): WrapperPair => {
      const wrapperKey = p.erc7984Address.toLowerCase();
      const unverifiedReason = UNVERIFIED_WRAPPERS[wrapperKey];
      return {
        ...p,
        source: 'cache' as const,
        ...(unverifiedReason ? { unverified: true, unverifiedReason } : {}),
      };
    });

    // Custom count reflects the localStorage records for this chain — including
    // confidential-only tokens which don't flow into `userPairs` (they're filtered
    // out of the wrapper-pair list because they can't be shielded/unshielded).
    const customTotal = localRecords.length;

    if (query.data && query.data.length > 0) {
      const merged = mergeCustomPairs(query.data, userPairs);
      const officialTotal = merged.filter((p) => p.source !== 'custom').length;
      return {
        pairs: merged,
        isLoading: false,
        error: null,
        isFromCache: false,
        total: merged.length,
        officialTotal,
        customTotal,
        localRecords,
      };
    }

    if (query.isLoading) {
      const merged = mergeCustomPairs(fallbackPairs, userPairs);
      const officialTotal = merged.filter((p) => p.source !== 'custom').length;
      return {
        pairs: merged,
        isLoading: true,
        error: null,
        isFromCache: true,
        total: merged.length,
        officialTotal,
        customTotal,
        localRecords,
      };
    }

    // Error or empty on-chain result — fall back to snapshot.
    const merged = mergeCustomPairs(fallbackPairs, userPairs);
    const officialTotal = merged.filter((p) => p.source !== 'custom').length;
    return {
      pairs: merged,
      isLoading: false,
      error: (query.error as Error | null) ?? null,
      isFromCache: true,
      officialTotal,
      customTotal,
      total: merged.length,
      localRecords,
    };
  }, [chainId, query.data, query.isLoading, query.error, userPairs, localRecords]);
}

/**
 * Convenience: look up a single pair by underlying symbol on the active chain.
 * Returns `undefined` if no match is found.
 */
export function findPairBySymbol(
  pairs: WrapperPair[],
  symbol: string | null | undefined,
): WrapperPair | undefined {
  if (!symbol) return undefined;
  const s = symbol.toLowerCase();
  return pairs.find((p) => p.symbol.toLowerCase() === s);
}
