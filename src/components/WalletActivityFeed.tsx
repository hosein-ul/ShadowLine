'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePublicClient } from 'wagmi';
import {
  useActivityFeed,
  useUserDecrypt,
  applyDecryptedValues,
  type ActivityItem,
} from '@zama-fhe/react-sdk';
import { isZeroHandle } from '@zama-fhe/sdk';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Tooltip from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { formatAddress, formatAmount } from '@/lib/utils';
import { classifyError } from '@/lib/errors';
import { CHAIN_CONFIG } from '@/config/chains';
import { type WrapperPair } from '@/config/contracts';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  ShieldOff,
  History,
  RefreshCw,
  BarChart2,
  ExternalLink,
  Unlock,
  ChevronDown,
} from 'lucide-react';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Returns true for any representation of the zero address or missing address. */
function isZeroAddr(addr: string | undefined | null): boolean {
  if (!addr) return true;
  try { return BigInt(addr) === 0n; } catch { return false; }
}

type WrapperLog = {
  address: `0x${string}`;
  topics: readonly `0x${string}`[];
  data: `0x${string}`;
  transactionHash?: `0x${string}` | null;
  blockNumber?: bigint | null;
  logIndex?: number | null;
};

/** How far back the initial fetch reaches (~2 months on Sepolia at 12s/block). */
const INITIAL_BLOCKS_BACK = 500_000n;
/** Each "Load older" extends ~6 months further. */
const OLDER_BLOCKS_STEP = 1_000_000n;
/** Below this span we stop splitting a failing range. */
const MIN_CHUNK_SPAN = 2_000n;

const BLOCKSCOUT_BASES: Record<number, string> = {
  11155111: 'https://eth-sepolia.blockscout.com',
  1: 'https://eth.blockscout.com',
};

/**
 * Fetch all logs for a contract from Blockscout, paginating until done.
 * Returns raw Blockscout log objects; caller filters for user relevance.
 */
/** Cap Blockscout pagination so a very active contract can't hang the fetch. */
const BLOCKSCOUT_MAX_PAGES = 30;

async function fetchBlockscoutLogs(
  chainId: number,
  contractAddress: string,
): Promise<{ blockNumber: string; transactionHash: string; topics: string[]; data: string; logIndex: string }[]> {
  const base = BLOCKSCOUT_BASES[chainId];
  if (!base) return [];
  const all: { blockNumber: string; transactionHash: string; topics: string[]; data: string; logIndex: string }[] = [];
  const build = (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    return `${base}/api/v2/addresses/${contractAddress}/logs?${q.toString()}`;
  };
  let url: string | null = build();
  let pages = 0;

  while (url && pages < BLOCKSCOUT_MAX_PAGES) {
    pages += 1;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const json = (await res.json()) as {
        items?: { block_number: number; transaction_hash: string; topics: string[]; data: string; index: number }[];
        next_page_params?: Record<string, string | number> | null;
      };
      for (const item of json.items ?? []) {
        all.push({
          blockNumber: String(item.block_number),
          transactionHash: item.transaction_hash,
          topics: item.topics,
          data: item.data,
          logIndex: String(item.index),
        });
      }
      const next = json.next_page_params;
      url = next ? build(next) : null;
    } catch {
      break;
    }
  }
  return all;
}

/** Complete history for one wrapper via Blockscout, in WrapperLog shape. */
async function fetchWrapperLogsBlockscout(
  chainId: number,
  wrapperAddress: `0x${string}`,
): Promise<WrapperLog[]> {
  const bs = await fetchBlockscoutLogs(chainId, wrapperAddress);
  return bs.map((l) => ({
    address: wrapperAddress,
    topics: l.topics as `0x${string}`[],
    data: l.data as `0x${string}`,
    transactionHash: (l.transactionHash || null) as `0x${string}` | null,
    blockNumber: l.blockNumber ? BigInt(l.blockNumber) : null,
    logIndex: l.logIndex ? Number(l.logIndex) : null,
  }));
}

/**
 * Fetch a log range for one address, recursively halving the range when the
 * RPC rejects it (public endpoints cap block spans and result counts).
 */
async function fetchLogsChunked(
  client: NonNullable<ReturnType<typeof usePublicClient>>,
  address: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<WrapperLog[]> {
  if (fromBlock > toBlock) return [];
  try {
    return (await client.getLogs({ address, fromBlock, toBlock })) as unknown as WrapperLog[];
  } catch {
    const span = toBlock - fromBlock;
    if (span < MIN_CHUNK_SPAN) return [];
    const mid = fromBlock + span / 2n;
    const [a, b] = await Promise.all([
      fetchLogsChunked(client, address, fromBlock, mid),
      fetchLogsChunked(client, address, mid + 1n, toBlock),
    ]);
    return [...a, ...b];
  }
}

/**
 * Accumulating multi-wrapper log fetcher with backwards pagination.
 * Initial fetch: most recent INITIAL_BLOCKS_BACK blocks.
 * loadOlder(): extends OLDER_BLOCKS_STEP further back.
 * loadAll(): pulls complete history from Blockscout (no block-range limit).
 */
function useWrapperLogs(
  address: `0x${string}` | undefined,
  wrappers: WrapperPair[],
  chainId: number,
  fullHistory: boolean,
): {
  logsByWrapper: Record<string, WrapperLog[]>;
  loading: boolean;
  loadingOlder: boolean;
  loadingAll: boolean;
  reachedStart: boolean;
  loadOlder: () => void;
  loadAll: () => void;
  refetch: () => void;
} {
  const client = usePublicClient({ chainId });
  const [logsByWrapper, setLogsByWrapper] = useState<Record<string, WrapperLog[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [reachedStart, setReachedStart] = useState(false);
  const [nonce, setNonce] = useState(0);
  const oldestFetchedRef = useRef<bigint | null>(null);
  const busyRef = useRef(false);

  const validWrappers = useMemo(
    () => wrappers.filter((p) => p.isValid !== false),
    [wrappers],
  );

  useEffect(() => {
    if (!client || !address || validWrappers.length === 0) return;
    let cancelled = false;

    // Full variant (Portfolio): pull COMPLETE history from Blockscout on mount
    // so the entire shield/unshield history shows without any extra click. The
    // RPC recent-window path is kept as a fallback (unknown chain, or Blockscout
    // returned nothing) and for the compact dashboard preview (fast first paint).
    const useBlockscout = fullHistory && !!BLOCKSCOUT_BASES[chainId];

    const run = async () => {
      setLoading(true);
      busyRef.current = true;
      try {
        if (useBlockscout) {
          const perWrapper = await Promise.all(
            validWrappers.map(async (p) => {
              const logs = await fetchWrapperLogsBlockscout(chainId, p.erc7984Address);
              return [p.erc7984Address.toLowerCase(), logs] as const;
            }),
          );
          const total = perWrapper.reduce((n, [, logs]) => n + logs.length, 0);
          if (!cancelled && total > 0) {
            setLogsByWrapper(Object.fromEntries(perWrapper));
            oldestFetchedRef.current = 0n;
            setReachedStart(true);
            return;
          }
          // Blockscout empty/unavailable → fall through to RPC window below.
        }

        const latest = await client.getBlockNumber();
        const fromBlock = latest > INITIAL_BLOCKS_BACK ? latest - INITIAL_BLOCKS_BACK : 0n;
        const perWrapper = await Promise.all(
          validWrappers.map(async (p) => {
            const logs = await fetchLogsChunked(client, p.erc7984Address, fromBlock, latest);
            return [p.erc7984Address.toLowerCase(), logs] as const;
          }),
        );
        if (!cancelled) {
          setLogsByWrapper(Object.fromEntries(perWrapper));
          oldestFetchedRef.current = fromBlock;
          setReachedStart(fromBlock === 0n);
        }
      } finally {
        busyRef.current = false;
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [client, address, validWrappers, chainId, nonce, fullHistory]);

  const loadOlder = React.useCallback(() => {
    if (!client || !address || busyRef.current) return;
    const upper = oldestFetchedRef.current;
    if (upper === null || upper === 0n) return;

    const run = async () => {
      setLoadingOlder(true);
      busyRef.current = true;
      try {
        const toBlock = upper - 1n;
        const fromBlock = toBlock > OLDER_BLOCKS_STEP ? toBlock - OLDER_BLOCKS_STEP : 0n;
        const perWrapper = await Promise.all(
          validWrappers.map(async (p) => {
            const logs = await fetchLogsChunked(client, p.erc7984Address, fromBlock, toBlock);
            return [p.erc7984Address.toLowerCase(), logs] as const;
          }),
        );
        setLogsByWrapper((prev) => {
          const next = { ...prev };
          for (const [key, older] of perWrapper) {
            next[key] = [...(next[key] ?? []), ...older];
          }
          return next;
        });
        oldestFetchedRef.current = fromBlock;
        if (fromBlock === 0n) setReachedStart(true);
      } finally {
        busyRef.current = false;
        setLoadingOlder(false);
      }
    };
    void run();
  }, [client, address, validWrappers]);

  /** Pull complete history from Blockscout — no block-range limit. */
  const loadAll = React.useCallback(() => {
    if (busyRef.current) return;
    const run = async () => {
      setLoadingAll(true);
      busyRef.current = true;
      try {
        const perWrapper = await Promise.all(
          validWrappers.map(async (p) => {
            const logs = await fetchWrapperLogsBlockscout(chainId, p.erc7984Address);
            return [p.erc7984Address.toLowerCase(), logs] as const;
          }),
        );
        setLogsByWrapper(Object.fromEntries(perWrapper));
        setReachedStart(true);
        oldestFetchedRef.current = 0n;
      } finally {
        busyRef.current = false;
        setLoadingAll(false);
      }
    };
    void run();
  }, [validWrappers, chainId]);

  return {
    logsByWrapper,
    loading,
    loadingOlder,
    loadingAll,
    reachedStart,
    loadOlder,
    loadAll,
    refetch: () => setNonce((n) => n + 1),
  };
}

/**
 * Single-wrapper feed hook — one useActivityFeed per wrapper (React hook rules).
 */
function WrapperFeedRow({
  wrapper,
  address,
  logs,
  onItems,
}: {
  wrapper: WrapperPair;
  address: `0x${string}`;
  logs: WrapperLog[];
  onItems: (wrapperAddr: string, items: ActivityItem[]) => void;
}) {
  const { data } = useActivityFeed({
    tokenAddress: wrapper.erc7984Address,
    userAddress: address,
    logs: logs as unknown as Parameters<typeof useActivityFeed>[0]['logs'],
    decrypt: false,
  });

  useEffect(() => {
    if (!data) return;
    onItems(wrapper.erc7984Address.toLowerCase(), data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return null;
}

// ── Classification ──────────────────────────────────────────────────────────
// The Zama SDK emits one item per log: a shield emits Wrapped + mint
// ConfidentialTransfer(from=0, to=user); an unshield emits UnwrapRequested
// + burn ConfidentialTransfer(from=user, to=0). We keep only:
//   • shield                → one "Shield" row (cleartext amount)
//   • unshield_requested    → one "Unshield" row (encrypted amount)
//   • genuine peer transfer → one "Transfer" row (neither side is 0 or wrapper)
// Everything else (unshield_started/finalized, mint/burn transfers) is dropped.

type FeedItem = ActivityItem & { wrapperAddr: string };

function involvesUser(item: ActivityItem, user: string): boolean {
  const u = user.toLowerCase();
  return (
    (item.from !== undefined && item.from.toLowerCase() === u) ||
    (item.to !== undefined && item.to.toLowerCase() === u)
  );
}

function isRealPeerTransfer(item: FeedItem): boolean {
  if (item.type !== 'transfer') return false;
  const from = item.from;
  const to = item.to;
  const wrapper = item.wrapperAddr.toLowerCase();
  // Drop if either side is absent, zero, or the wrapper contract itself.
  if (isZeroAddr(from) || isZeroAddr(to)) return false;
  if (from?.toLowerCase() === ZERO_ADDRESS || to?.toLowerCase() === ZERO_ADDRESS) return false;
  if (from?.toLowerCase() === wrapper || to?.toLowerCase() === wrapper) return false;
  return true;
}

function classifyFeed(items: FeedItem[], user: string): FeedItem[] {
  return items.filter((it) => {
    if (!involvesUser(it, user)) return false;
    if (it.type === 'shield') return true;
    if (it.type === 'unshield_requested') return true;
    if (it.type === 'unshield_started' || it.type === 'unshield_finalized') return false;
    if (it.type === 'transfer') return isRealPeerTransfer(it);
    return false;
  });
}

// ── Presentation ─────────────────────────────────────────────────────────────
// Calm, neutral palette — no yellow or orange.
// • Shield    → indigo  (trust, privacy, protection)
// • Unshield  → slate   (neutral, no strong valence)
// • Transfer In  → teal/cyan (positive, incoming)
// • Transfer Out → slate (neutral)

const COLORS = {
  shield: '#4f46e5',      // indigo-600
  unshield: '#64748b',    // slate-500
  transferIn: '#0891b2',  // cyan-600
  transferOut: '#64748b', // slate-500
} as const;

function typePresentation(item: FeedItem): {
  label: string;
  color: string;
  bgColor: string;
  Icon: React.ComponentType<{ size?: number | string }>;
} {
  switch (item.type) {
    case 'shield':
      return {
        label: 'Shield',
        color: COLORS.shield,
        bgColor: 'rgba(79,70,229,0.10)',
        Icon: Shield,
      };
    case 'unshield_requested':
      return {
        label: 'Unshield',
        color: COLORS.unshield,
        bgColor: 'rgba(100,116,139,0.10)',
        Icon: ShieldOff,
      };
    default:
      return item.direction === 'incoming'
        ? { label: 'Transfer In', color: COLORS.transferIn, bgColor: 'rgba(8,145,178,0.10)', Icon: ArrowDownLeft }
        : { label: 'Transfer Out', color: COLORS.transferOut, bgColor: 'rgba(100,116,139,0.10)', Icon: ArrowUpRight };
  }
}

function timeAgo(tsMs: number): string {
  const diff = Date.now() - tsMs;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

interface WalletActivityFeedProps {
  address: `0x${string}`;
  wrappers: WrapperPair[];
  chainId: number;
  variant?: 'full' | 'compact';
  maxRows?: number;
}

const PAGE_SIZE = 20;

export default function WalletActivityFeed({
  address,
  wrappers,
  chainId,
  variant = 'full',
  maxRows,
}: WalletActivityFeedProps) {
  const explorerBase =
    CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG]?.explorerUrl ?? 'https://eth.blockscout.com';
  const client = usePublicClient({ chainId });
  const { logsByWrapper, loading, loadingOlder, loadingAll, reachedStart, loadOlder, loadAll, refetch } =
    useWrapperLogs(address, wrappers, chainId, variant === 'full');
  const [itemsByWrapper, setItemsByWrapper] = useState<Record<string, ActivityItem[]>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const symbolByWrapper = useMemo(() => {
    const map: Record<string, { symbol: string; decimals: number; wrapperDecimals: number }> = {};
    for (const w of wrappers) {
      map[w.erc7984Address.toLowerCase()] = {
        symbol: w.symbol,
        decimals: w.decimals,
        wrapperDecimals: w.wrapperDecimals ?? 6,
      };
    }
    return map;
  }, [wrappers]);

  const handleItems = React.useCallback((wrapperAddr: string, items: ActivityItem[]) => {
    setItemsByWrapper((prev) => ({ ...prev, [wrapperAddr]: items }));
  }, []);

  const groupedItems = useMemo(() => {
    const all: FeedItem[] = [];
    for (const [wrapperAddr, items] of Object.entries(itemsByWrapper)) {
      for (const it of items) all.push({ ...it, wrapperAddr });
    }
    const classified = classifyFeed(all, address);
    classified.sort((a, b) => {
      const ab = a.metadata?.blockNumber ? BigInt(a.metadata.blockNumber) : 0n;
      const bb = b.metadata?.blockNumber ? BigInt(b.metadata.blockNumber) : 0n;
      return bb > ab ? 1 : bb < ab ? -1 : 0;
    });
    return classified;
  }, [itemsByWrapper, address]);

  // ── Amount decryption — explicit user gate ────────────────────────────────
  const { addToast } = useToast();
  const [decryptAmounts, setDecryptAmounts] = useState(false);
  const decryptErrorRef = useRef<string | null>(null);

  const encryptedHandles = useMemo(() => {
    const seen = new Set<string>();
    const handles: { handle: `0x${string}`; contractAddress: `0x${string}` }[] = [];
    for (const it of groupedItems) {
      if (it.amount?.type !== 'encrypted' || !it.amount.handle) continue;
      const handle = it.amount.handle as `0x${string}`;
      if (isZeroHandle(handle) || seen.has(handle)) continue;
      seen.add(handle);
      handles.push({ handle, contractAddress: it.wrapperAddr as `0x${string}` });
    }
    return handles;
  }, [groupedItems]);

  const {
    data: decryptedMap,
    error: decryptError,
    isFetching: isDecrypting,
  } = useUserDecrypt(
    { handles: encryptedHandles },
    {
      enabled: decryptAmounts && encryptedHandles.length > 0,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!decryptError) {
      decryptErrorRef.current = null;
      return;
    }
    const msg = decryptError.message ?? '';
    if (decryptErrorRef.current === msg) return;
    decryptErrorRef.current = msg;
    setDecryptAmounts(false);
    const classified = classifyError(decryptError);
    addToast({ variant: 'warning', title: classified.title, message: classified.message });
  }, [decryptError, addToast]);

  const allItems = useMemo(
    () => (decryptedMap ? (applyDecryptedValues(groupedItems, decryptedMap) as FeedItem[]) : groupedItems),
    [groupedItems, decryptedMap],
  );

  const isCompact = variant === 'compact';
  const rowCap = maxRows ?? (isCompact ? PAGE_SIZE : visibleCount);
  const visibleItems = allItems.slice(0, rowCap);
  const hasMoreLoaded = allItems.length > rowCap;

  // ── Block timestamps ──────────────────────────────────────────────────────
  const [blockTimes, setBlockTimes] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!client) return;
    const missing = new Set<bigint>();
    for (const it of visibleItems) {
      const bn = it.metadata?.blockNumber;
      if (bn === undefined || bn === null) continue;
      const key = String(bn);
      if (!(key in blockTimes)) missing.add(BigInt(bn));
      if (missing.size >= 40) break;
    }
    if (missing.size === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        [...missing].map(async (bn) => {
          try {
            const block = await client.getBlock({ blockNumber: bn });
            return [String(bn), Number(block.timestamp) * 1000] as const;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const fetched = entries.filter((e): e is readonly [string, number] => e !== null);
      if (fetched.length > 0) {
        setBlockTimes((prev) => ({ ...prev, ...Object.fromEntries(fetched) }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, visibleItems]);

  return (
    <>
      {/* Hidden per-wrapper hooks */}
      {wrappers
        .filter((w) => w.isValid !== false && (logsByWrapper[w.erc7984Address.toLowerCase()]?.length ?? 0) > 0)
        .map((w) => (
          <WrapperFeedRow
            key={`feed-${w.erc7984Address}`}
            wrapper={w}
            address={address}
            logs={logsByWrapper[w.erc7984Address.toLowerCase()] ?? []}
            onItems={handleItems}
          />
        ))}

      <Card
        variant={isCompact ? 'glass' : 'default'}
        padding={isCompact ? 'md' : 'lg'}
        style={{ marginTop: isCompact ? 'var(--sp-4)' : 'var(--sp-8)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--sp-4)',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <h3
            style={{
              fontWeight: 700,
              fontSize: isCompact ? 'var(--text-md)' : 'var(--text-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
            }}
          >
            <History size={isCompact ? 14 : 18} style={{ color: 'var(--text-secondary)' }} />
            {isCompact ? 'Recent Activity' : 'My Activity'}
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {encryptedHandles.length > 0 && !decryptedMap && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDecryptAmounts(true)}
                isLoading={isDecrypting}
                style={{ gap: 5 }}
              >
                <Unlock size={11} /> Decrypt amounts
              </Button>
            )}
            {!reachedStart && !isCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadAll}
                isLoading={loadingAll}
                style={{ gap: 5 }}
                title="Fetch complete history via Blockscout"
              >
                <ChevronDown size={11} /> Load all
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={refetch} isLoading={loading} style={{ gap: 5 }}>
              <RefreshCw size={11} /> Refresh
            </Button>
            {!isCompact && (
              <Link href="/app/analytics">
                <Button variant="secondary" size="sm" style={{ gap: 5 }}>
                  <BarChart2 size={11} /> Analytics
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {loading && visibleItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={isCompact ? 40 : 54} />)}
          </div>
        ) : visibleItems.length === 0 ? (
          <div style={{ padding: 'var(--sp-6) 0', textAlign: 'center' }}>
            <p className="text-sm text-muted">
              No shield / unshield activity found{reachedStart ? '.' : ' in the recent window.'}
            </p>
            {!reachedStart && !isCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={loadAll}
                isLoading={loadingAll}
                style={{ gap: 6, marginTop: 'var(--sp-3)' }}
              >
                <History size={12} /> Load full history from Blockscout
              </Button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? 6 : 8 }}>
            {visibleItems.map((ev, i) => {
              const meta = symbolByWrapper[ev.wrapperAddr] ?? { symbol: '?', decimals: 6, wrapperDecimals: 6 };
              const { label, color, bgColor, Icon } = typePresentation(ev);
              const isRealTransfer = ev.type === 'transfer';
              const counterparty = isRealTransfer
                ? ev.direction === 'outgoing' ? ev.to : ev.from
                : undefined;

              const amountStr = (() => {
                if (!ev.amount) return '';
                if (ev.amount.type === 'clear') {
                  return `${formatAmount(ev.amount.value, meta.decimals)} ${meta.symbol}`;
                }
                if (ev.amount.decryptedValue !== undefined) {
                  return `${formatAmount(ev.amount.decryptedValue, meta.wrapperDecimals)} ${meta.symbol}`;
                }
                return `Encrypted ${meta.symbol}`;
              })();

              const bn = ev.metadata?.blockNumber;
              const ts = bn !== undefined && bn !== null ? blockTimes[String(bn)] : undefined;

              return (
                <div
                  key={`${ev.metadata?.transactionHash ?? 'x'}-${ev.metadata?.logIndex ?? i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCompact ? 10 : 12,
                    padding: isCompact ? '8px 10px' : '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: isCompact ? 28 : 34,
                      height: isCompact ? 28 : 34,
                      borderRadius: '50%',
                      background: bgColor,
                      color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={isCompact ? 13 : 15} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: isCompact ? 12 : 13,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {label}
                      </span>
                      <Badge variant="default" size="sm" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {amountStr || meta.symbol}
                      </Badge>
                      {ev.amount?.type === 'encrypted' && ev.amount.decryptedValue === undefined && (
                        <Tooltip content="Amount is FHE-encrypted. Click 'Decrypt amounts' to reveal with a read-only EIP-712 permit." />
                      )}
                    </div>
                    {!isCompact && (
                      <div
                        className="text-xs text-muted"
                        style={{ marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}
                      >
                        <span>
                          Token: <code style={{ fontSize: 11 }}>{meta.symbol}</code>
                        </span>
                        {counterparty && (
                          <span>
                            {ev.direction === 'outgoing' ? 'To' : 'From'}:{' '}
                            <code style={{ fontSize: 11 }}>{formatAddress(counterparty)}</code>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: time + tx link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {ts !== undefined && (
                      <span
                        className="text-xs text-muted"
                        title={new Date(ts).toLocaleString()}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {timeAgo(ts)}
                      </span>
                    )}
                    {ev.metadata?.transactionHash && (
                      <a
                        href={`${explorerBase}/tx/${ev.metadata.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs"
                        style={{
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      >
                        Tx <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {!isCompact && !maxRows && (hasMoreLoaded || !reachedStart) && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {hasMoreLoaded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    style={{ gap: 6 }}
                  >
                    Show more ({allItems.length - rowCap} loaded)
                  </Button>
                )}
                {!reachedStart && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadOlder}
                    isLoading={loadingOlder}
                    style={{ gap: 6 }}
                  >
                    <History size={11} /> Load older
                  </Button>
                )}
                {!reachedStart && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadAll}
                    isLoading={loadingAll}
                    style={{ gap: 6 }}
                    title="Pull complete history from Blockscout (may take a moment)"
                  >
                    <ChevronDown size={11} /> All history
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
