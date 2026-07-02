'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useListPairs } from '@zama-fhe/react-sdk';
import { KNOWN_WRAPPERS, type WrapperPair } from '@/config/contracts';
import { CUSTOM_PAIRS } from '@/config/custom-pairs';
import { type SupportedChainId } from '@/config/chains';
import { getTokenInfo } from '@/config/tokens';

/**
 * Result of useRegistryPairs.
 *
 * `pairs`        — current list of wrapper pairs to render.
 * `isLoading`    — true while the on-chain registry call is in flight AND no
 *                  fallback data is yet displayable.
 * `error`        — any error returned by the SDK call (null if the fallback
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
  total: number;
}

/**
 * Item shape returned by `useListPairs({ metadata: true })`. Declared
 * locally because the SDK does not re-export the type at a stable path; we
 * narrow at the boundary via the mapping function below.
 */
interface SdkPairItem {
  tokenAddress: `0x${string}`;
  confidentialTokenAddress: `0x${string}`;
  isValid?: boolean;
  underlying?: {
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  confidential?: {
    symbol?: string;
    name?: string;
    decimals?: number;
  };
}

/**
 * Map an SDK pair into the WrapperPair shape the rest of the app already
 * consumes. Metadata fields (symbol/name/decimals) are populated from the
 * registry's on-chain ERC-20 metadata when available, then enriched with the
 * local `TOKEN_INFO` table for display assets (logo, name overrides).
 *
 * Wrapper decimals default to 6 per the ERC-7984 / fhEVM convention
 * documented in memory.md — every confidential wrapper currently stores its
 * encrypted balance as `euint64` and scales the deposit by 10^(underlying-6).
 */
/**
 * Strip the `Mock` suffix from a token symbol. Sepolia mock underlyings
 * have on-chain symbols like `USDCMock`, `USDTMock`, etc.; the rest of the
 * app and all `/wrap?token=…` deep links use the unsuffixed form. We
 * normalize at the registry boundary so live and cached data round-trip
 * through the same identifiers.
 */
function normalizeSymbol(symbol: string | undefined): string {
  if (!symbol) return 'UNKNOWN';
  return symbol.replace(/Mock$/i, '');
}

function mapSdkPair(item: SdkPairItem): WrapperPair {
  const underlyingSym = normalizeSymbol(item.underlying?.symbol);
  const confidentialSym = item.confidential?.symbol;
  // Prefer the underlying's symbol; fall back to the confidential's
  // c-prefixed form (e.g. `cUSDCMock` → `USDC`).
  const rawSymbol =
    underlyingSym !== 'UNKNOWN'
      ? underlyingSym
      : normalizeSymbol(confidentialSym?.replace(/^c/, ''));

  // Display info fallback (logo / canonical name) keyed by symbol. This is
  // a UI enrichment layer ONLY; the addresses come from the registry.
  const display = getTokenInfo(rawSymbol);

  return {
    erc20Address: item.tokenAddress,
    erc7984Address: item.confidentialTokenAddress,
    symbol: rawSymbol,
    name: item.underlying?.name ?? display.name,
    decimals: item.underlying?.decimals ?? display.decimals,
    wrapperDecimals: item.confidential?.decimals ?? 6,
    isValid: item.isValid !== false,
    underlyingRawSymbol: item.underlying?.symbol,
  };
}

/**
 * True when this pair's underlying ERC-20 is a Zama-deployed mock with a
 * public `mint(address,uint256)` — i.e. the faucet can drip from it.
 *
 * Detection rules, in order of precedence:
 *  1. `underlyingRawSymbol` ends with `Mock` (case-insensitive) — this is
 *     the canonical signal from the SDK's metadata.
 *  2. As a fallback for the hardcoded snapshot (which doesn't carry the
 *     raw symbol), assume any Sepolia entry in the local list is mintable
 *     because the hardcoded list was curated to include mocks only.
 */
export function isMintablePair(pair: WrapperPair): boolean {
  const raw = pair.underlyingRawSymbol;
  if (typeof raw === 'string' && raw.length > 0) {
    return /mock$/i.test(raw);
  }
  // Hardcoded fallback — see KNOWN_WRAPPERS curation note in
  // src/config/contracts.ts. Only Sepolia mocks live there.
  return true;
}

/**
 * Blocklist: wrapper addresses that should be hidden from the UI even though
 * they appear in the on-chain registry. Each entry documents *why* it was
 * excluded so future maintainers can re-evaluate.
 *
 * The app reads the WrappersRegistry live — this is an intentional manual
 * override, not a limitation of the dynamic read. If Zama removes or
 * replaces these entries in the registry, this blocklist becomes a no-op.
 */
const BLOCKLISTED_WRAPPERS: Record<string, string> = {
  // cbbqTGBP on Mainnet — listed in Zama's official Mainnet address docs
  // (https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum)
  // but the name "bbqTGBP" does not correspond to any known asset, and the
  // underlying address (0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F) uses a
  // vanity hex pattern ("beeff"). This is very likely a Zama-internal
  // test/placeholder entry or a documentation typo. Displaying it would
  // confuse end-users. If Zama clarifies this entry in the future, remove
  // it from this blocklist.
  '0xba4cff6ed6f7cb2a58776deca4e984b498446762': 'Suspected test/placeholder entry (cbbqTGBP)',
};

function isBlocklisted(pair: WrapperPair): boolean {
  return pair.erc7984Address.toLowerCase() in BLOCKLISTED_WRAPPERS;
}

/**
 * Merge custom pairs from the local config into a live pair list.
 * De-duplication rule: if the same erc20Address already exists in `base`
 * (from the on-chain registry or the hardcoded snapshot), the onchain/snapshot
 * entry wins and the custom pair is silently dropped.
 *
 * This ensures that once a dev pair gets officially registered on-chain,
 * the registry version takes over automatically without any manual cleanup.
 */
function mergeCustomPairs(base: WrapperPair[]): WrapperPair[] {
  if (CUSTOM_PAIRS.length === 0) return base;
  const knownErc20 = new Set(base.map((p) => p.erc20Address.toLowerCase()));
  const knownErc7984 = new Set(base.map((p) => p.erc7984Address.toLowerCase()));
  const toAdd = CUSTOM_PAIRS.filter(
    (cp) =>
      !knownErc20.has(cp.erc20Address.toLowerCase()) &&
      !knownErc7984.has(cp.erc7984Address.toLowerCase()),
  );
  return [...base, ...toAdd];
}

/**
 * Read the on-chain WrappersRegistry for a given chain.
 *
 * Behaviour:
 *  - When the wallet is connected AND its chain matches `chainId`, calls
 *    `useListPairs` against the SDK's signer-bound registry and returns the
 *    live list (including pairs the hardcoded fallback does not know about).
 *    Blocklisted entries (see `BLOCKLISTED_WRAPPERS` above) are filtered out.
 *  - Otherwise (unconnected, chain mismatch, or SDK error), falls back to
 *    the local `KNOWN_WRAPPERS[chainId]` snapshot so unconnected visitors
 *    can still browse. The result is flagged `isFromCache: true` so the UI
 *    can communicate that the list may be incomplete or stale.
 *
 * Pagination: the hook currently asks for the first 200 entries. The
 * registry has 8 pairs as of audit time so this is generously sized. When
 * the registry grows past 200, this hook should be extended to loop until
 * `data.total` is exhausted.
 */
export function useRegistryPairs(chainId: SupportedChainId): RegistryPairsResult {
  const { isConnected, chain } = useAccount();

  const isChainAligned = isConnected && chain?.id === chainId;

  const sdkResult = useListPairs({
    page: 1,
    pageSize: 200,
    metadata: true,
  }) as unknown as {
    data?: { items?: SdkPairItem[]; total?: number };
    isLoading: boolean;
    error: Error | null;
  };

  return useMemo<RegistryPairsResult>(() => {
    const fallbackPairs = (KNOWN_WRAPPERS[chainId] ?? []).map((p) => ({ ...p, source: 'cache' as const }));

    if (isChainAligned && sdkResult.data?.items && sdkResult.data.items.length > 0) {
      const liveBase = sdkResult.data.items
        .map((item) => ({ ...mapSdkPair(item), source: 'registry' as const }))
        .filter((p) => !isBlocklisted(p));
      const merged = mergeCustomPairs(liveBase);
      return {
        pairs: merged,
        isLoading: false,
        error: null,
        isFromCache: false,
        total: merged.length,
      };
    }

    if (isChainAligned && sdkResult.isLoading) {
      const merged = mergeCustomPairs(fallbackPairs);
      return {
        pairs: merged,
        isLoading: true,
        error: null,
        isFromCache: true,
        total: merged.length,
      };
    }

    const merged = mergeCustomPairs(fallbackPairs);
    return {
      pairs: merged,
      isLoading: false,
      error: (isChainAligned ? sdkResult.error : null) as Error | null,
      isFromCache: true,
      total: merged.length,
    };
  }, [chainId, isChainAligned, sdkResult.data, sdkResult.isLoading, sdkResult.error]);
}

/**
 * Convenience: look up a single pair by underlying symbol on the active chain.
 * Returns `undefined` if no match is found. Used by pages that drive UI off a
 * `?token=` query-string parameter.
 */
export function findPairBySymbol(
  pairs: WrapperPair[],
  symbol: string | null | undefined,
): WrapperPair | undefined {
  if (!symbol) return undefined;
  const s = symbol.toLowerCase();
  return pairs.find((p) => p.symbol.toLowerCase() === s);
}
