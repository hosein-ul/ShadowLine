'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import TokenIcon from '@/components/ui/TokenIcon';
import BlurIn from '@/components/ui/BlurIn';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useRegistryPairs } from '@/lib/registry';
import { formatAddress } from '@/lib/utils';
import {
  BarChart2,
  TrendingUp,
  Shield,
  Unlock,
  Users,
  RefreshCw,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Zap,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface TokenTVL {
  symbol: string;
  tvlRaw: bigint;
  tvlCompact: string;   // "23.0M", "5.1K", "412"
  tvlHuman: number;     // normalized float (for sorting & bar width)
  decimals: number;
  erc20Address: string;
  wrapperAddress: string;
  shieldCount: number;
  unshieldCount: number;
  shieldVolume: bigint;   // total amount shielded (underlying decimals)
  unshieldVolume: bigint; // total amount unshielded
}

interface ActivityEvent {
  type: 'shield' | 'unshield';
  symbol: string;
  amount: bigint;
  decimals: number;
  from: string;
  to: string;
  txHash: string;
  blockNumber: bigint;
  timeAgo: string; // pre-computed
}

const TRANSFER_ABI = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

/** Format a token amount into compact notation: "23.0M", "5.1K", "412.35" */
function formatTVLCompact(raw: bigint, decimals: number): string {
  if (raw === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = Number(raw / divisor);
  const frac = Number(raw % divisor) / Math.pow(10, decimals);
  const value = whole + frac;

  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2).replace(/\.00$/, '');
}

/**
 * Estimate how long ago an event happened without extra RPC calls.
 * Uses: fetchTimestamp - (latestBlock - eventBlock) × blockTimeMs
 */
function estimateTimeAgo(
  eventBlock: bigint,
  latestBlock: bigint,
  fetchTimestamp: number,
  blockTimeMs = 12_000,
): string {
  const blocksDiff = Number(latestBlock - eventBlock);
  const msAgo = Date.now() - (fetchTimestamp - blocksDiff * blockTimeMs);
  const sec = Math.max(0, Math.floor(msAgo / 1000));

  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/* ─── Stat card ───────────────────────────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'var(--accent)',
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <Card variant="default" padding="md" hover>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-xs text-muted" style={{ marginBottom: 2 }}>{label}</div>
          {loading ? (
            <Skeleton height={24} width={80} />
          ) : (
            <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
              {value}
            </div>
          )}
          {sub && !loading && (
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>{sub}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─── TVL bar ────────────────────────────────────────────────────────────────── */
function TVLBar({
  token,
  maxTvlHuman,
  explorerBase,
}: {
  token: TokenTVL;
  maxTvlHuman: number;
  explorerBase: string;
}) {
  const pct = maxTvlHuman > 0
    ? Math.max((token.tvlHuman / maxTvlHuman) * 100, 0.5)
    : 0;

  const volCompact = formatTVLCompact(token.shieldVolume, token.decimals);

  return (
    <div className="analytics-tvl-row">
      <div className="analytics-tvl-info">
        <TokenIcon symbol={token.symbol} size={24} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{token.symbol}</div>
          <div className="text-xs text-muted">c{token.symbol}</div>
        </div>
      </div>

      <div className="analytics-tvl-bar-wrap">
        <div className="analytics-tvl-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="analytics-tvl-stats">
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', textAlign: 'right' }}>
          {token.tvlCompact}
        </div>
        <div className="text-xs text-muted" style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--success)' }}>{token.shieldCount}↑</span>{' '}
          <span style={{ color: 'var(--warning)' }}>{token.unshieldCount}↓</span>
          {token.shieldVolume > 0n && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
              · vol {volCompact}
            </span>
          )}
        </div>
      </div>

      <a
        href={`${explorerBase}/address/${token.wrapperAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
        title="View wrapper on Blockscout"
      >
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

/* ─── Activity row ───────────────────────────────────────────────────────────── */
function ActivityRow({
  event,
  explorerBase,
}: {
  event: ActivityEvent;
  explorerBase: string;
}) {
  const isShield = event.type === 'shield';
  const color = isShield ? 'var(--success)' : 'var(--warning)';
  const Icon = isShield ? ArrowUpRight : ArrowDownLeft;
  const amountStr = Number(formatUnits(event.amount, event.decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

  return (
    <div className="analytics-activity-row">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-full)',
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {isShield ? 'Shield' : 'Unshield'}
          </span>
          <Badge variant={isShield ? 'success' : 'warning'} size="sm">
            {amountStr} {event.symbol}
          </Badge>
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>
            {isShield ? 'from' : 'to'}{' '}
            <code style={{ fontSize: 11 }}>{formatAddress(isShield ? event.from : event.to)}</code>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
            <Clock size={10} /> {event.timeAgo}
          </span>
        </div>
      </div>

      <a
        href={`${explorerBase}/tx/${event.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs"
        style={{ color: 'var(--accent)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        title="View on Blockscout"
      >
        Tx <ExternalLink size={11} />
      </a>
    </div>
  );
}

/* ─── Wrap/Unwrap ratio bar ──────────────────────────────────────────────────── */
function RatioBar({ shields, unshields }: { shields: number; unshields: number }) {
  const total = shields + unshields;
  if (total === 0) return <div className="text-xs text-muted">No events yet</div>;
  const shieldPct = Math.round((shields / total) * 100);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="text-xs" style={{ color: 'var(--success)', fontWeight: 600 }}>
          Shields {shieldPct}%
        </span>
        <span className="text-xs" style={{ color: 'var(--warning)', fontWeight: 600 }}>
          {100 - shieldPct}% Unshields
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          background: `linear-gradient(to right, var(--warning) 0%, var(--warning) ${100 - shieldPct}%, var(--success) ${100 - shieldPct}%, var(--success) 100%)`,
          display: 'flex',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="text-xs text-muted">{unshields} txs</span>
        <span className="text-xs text-muted">{shields} txs</span>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

const BLOCK_TIME_MS = 12_000;  // ~12 seconds per block

function getBlocksSinceMidnightUTC(): bigint {
  const now = Date.now();
  const midnightUTC = new Date();
  midnightUTC.setUTCHours(0, 0, 0, 0);
  const msSinceMidnight = now - midnightUTC.getTime();
  const blocks = Math.ceil(msSinceMidnight / BLOCK_TIME_MS);
  return BigInt(Math.max(blocks, 1));
}

export default function AnalyticsPage() {
  const { activeChainId, isTestnet } = useActiveNetwork();
  const { pairs } = useRegistryPairs(activeChainId);
  const client = usePublicClient({ chainId: activeChainId });
  const explorerBase = isTestnet
    ? 'https://eth-sepolia.blockscout.com'
    : 'https://eth.blockscout.com';

  const [tvlData, setTvlData] = useState<TokenTVL[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!client || pairs.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const latestBlock = await client.getBlockNumber();
      const fetchTimestamp = Date.now();
      const blockLookback = getBlocksSinceMidnightUTC();
      const fromBlock = latestBlock > blockLookback
        ? latestBlock - blockLookback
        : 0n;

      const tokenResults = await Promise.all(
        pairs
          .filter((p) => p.isValid !== false)
          .map(async (pair) => {
            try {
              // TVL
              const tvlRaw = await client.readContract({
                address: pair.erc20Address,
                abi: ERC20_BALANCE_ABI,
                functionName: 'balanceOf',
                args: [pair.erc7984Address],
              }) as bigint;

              // Shield events
              const shieldLogs = await client.getLogs({
                address: pair.erc20Address,
                event: TRANSFER_ABI,
                args: { to: pair.erc7984Address },
                fromBlock,
                toBlock: latestBlock,
              });

              // Unshield events
              const unshieldLogs = await client.getLogs({
                address: pair.erc20Address,
                event: TRANSFER_ABI,
                args: { from: pair.erc7984Address },
                fromBlock,
                toBlock: latestBlock,
              });

              const shieldVolume = shieldLogs.reduce(
                (sum, log) => sum + ((log.args?.value as bigint) ?? 0n), 0n,
              );
              const unshieldVolume = unshieldLogs.reduce(
                (sum, log) => sum + ((log.args?.value as bigint) ?? 0n), 0n,
              );

              // Compute human-readable TVL (float) for normalized sorting & bar width.
              // Using raw bigint directly for sort is WRONG because decimals differ:
              // 22.98M ZAMA (18 dec) raw >> 22.89M USDC (6 dec) raw, despite similar value.
              const divisor = 10n ** BigInt(pair.decimals);
              const tvlHuman = Number(tvlRaw / divisor) + Number(tvlRaw % divisor) / Math.pow(10, pair.decimals);

              const tokenTvl: TokenTVL = {
                symbol: pair.symbol,
                tvlRaw,
                tvlCompact: formatTVLCompact(tvlRaw, pair.decimals),
                tvlHuman,
                decimals: pair.decimals,
                erc20Address: pair.erc20Address,
                wrapperAddress: pair.erc7984Address,
                shieldCount: shieldLogs.length,
                unshieldCount: unshieldLogs.length,
                shieldVolume,
                unshieldVolume,
              };

              // Build activity events (latest 8 per token)
              const makeEvents = (
                logs: typeof shieldLogs,
                type: 'shield' | 'unshield',
              ): ActivityEvent[] =>
                [...logs]
                  .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
                  .slice(0, 8)
                  .map((log) => ({
                    type,
                    symbol: pair.symbol,
                    amount: (log.args?.value as bigint) ?? 0n,
                    decimals: pair.decimals,
                    from: (log.args?.from as string) ?? '',
                    to: (log.args?.to as string) ?? '',
                    txHash: log.transactionHash ?? '',
                    blockNumber: log.blockNumber ?? 0n,
                    timeAgo: estimateTimeAgo(
                      log.blockNumber ?? latestBlock,
                      latestBlock,
                      fetchTimestamp,
                      BLOCK_TIME_MS,
                    ),
                  }));

              return {
                tokenTvl,
                events: [
                  ...makeEvents(shieldLogs, 'shield'),
                  ...makeEvents(unshieldLogs, 'unshield'),
                ],
              };
            } catch {
              return null;
            }
          }),
      );

      const validResults = tokenResults.filter((r): r is NonNullable<typeof r> => r !== null);
      const allTvl = validResults.map((r) => r.tokenTvl);
      const allEvents = validResults
        .flatMap((r) => r.events)
        .filter((e) => e.txHash && e.amount > 0n)
        .sort((a, b) => Number(b.blockNumber - a.blockNumber))
        .slice(0, 25);

      // Sort by human-readable value (normalized by decimals), not raw bigint.
      setTvlData(allTvl.sort((a, b) => b.tvlHuman - a.tvlHuman));
      setActivity(allEvents);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Analytics fetch failed:', err);
      setError('Failed to load analytics data. Check your RPC connection.');
    } finally {
      setIsLoading(false);
    }
  }, [client, pairs]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived stats
  const totalShields = tvlData.reduce((s, t) => s + t.shieldCount, 0);
  const totalUnshields = tvlData.reduce((s, t) => s + t.unshieldCount, 0);
  const uniqueShielders = new Set(
    activity.filter((e) => e.type === 'shield').map((e) => e.from.toLowerCase()),
  ).size;
  const maxTvlHuman = tvlData.reduce((m, t) => (t.tvlHuman > m ? t.tvlHuman : m), 0);
  const activePairs = tvlData.filter((t) => t.tvlRaw > 0n).length;

  // Most active token by tx count
  const mostActive = tvlData.length > 0
    ? [...tvlData].sort((a, b) => (b.shieldCount + b.unshieldCount) - (a.shieldCount + a.unshieldCount))[0]
    : null;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      {/* ── Header ── */}
      <div className="page-header" style={{ textAlign: 'center' }}>
        <Badge variant="accent" style={{ marginBottom: 'var(--sp-3)' }}>
          <BarChart2 size={12} style={{ marginRight: 4 }} />
          {isTestnet ? 'Sepolia' : 'Mainnet'} · Live
        </Badge>
        <h1>
          <BlurIn text="Protocol Analytics" duration={600} />
        </h1>
        <p style={{ maxWidth: 520, margin: 'var(--sp-2) auto 0' }}>
          On-chain metrics for all registered ERC-7984 confidential wrappers.
          Sourced directly from Transfer events — no indexer required.
        </p>
      </div>

      {/* ── Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-6)',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString()}`
            : 'Loading…'}
          &nbsp;·&nbsp;Since 00:00 UTC today
          &nbsp;·&nbsp;Showing up to 25 recent events
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchAnalytics}
          isLoading={isLoading}
          style={{ gap: 'var(--sp-2)' }}
        >
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {error && (
        <Card
          variant="glass"
          padding="sm"
          style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)', marginBottom: 'var(--sp-6)' }}
        >
          <span className="text-sm" style={{ color: 'var(--error)' }}>{error}</span>
        </Card>
      )}

      {/* ── Stat Cards ── */}
      <div className="analytics-stats-grid">
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Active Pairs"
          value={isLoading ? '…' : `${activePairs} / ${tvlData.length}`}
          sub="pairs with TVL > 0"
          loading={isLoading && tvlData.length === 0}
        />
        <StatCard
          icon={<Shield size={18} />}
          label="Shields (last 24h)"
          value={isLoading && tvlData.length === 0 ? '…' : totalShields.toLocaleString()}
          color="var(--success)"
          loading={isLoading && tvlData.length === 0}
        />
        <StatCard
          icon={<Unlock size={18} />}
          label="Unshields (last 24h)"
          value={isLoading && tvlData.length === 0 ? '…' : totalUnshields.toLocaleString()}
          color="var(--warning)"
          loading={isLoading && tvlData.length === 0}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Unique Shielders"
          value={isLoading && tvlData.length === 0 ? '…' : uniqueShielders.toString()}
          sub="distinct addresses (period)"
          color="#a78bfa"
          loading={isLoading && tvlData.length === 0}
        />
      </div>

      {/* ── Extra insight row ── */}
      {!isLoading && tvlData.length > 0 && (
        <div className="analytics-insights-grid">
          {/* Wrap/Unshield ratio */}
          <Card variant="default" padding="md">
            <h4 style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale size={14} style={{ color: 'var(--accent)' }} />
              Shield vs Unshield Ratio
            </h4>
            <RatioBar shields={totalShields} unshields={totalUnshields} />
          </Card>

          {/* Most active token */}
          <Card variant="default" padding="md">
            <h4 style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} style={{ color: 'var(--warning)' }} />
              Most Active Token
            </h4>
            {mostActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <TokenIcon symbol={mostActive.symbol} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{mostActive.symbol}</div>
                  <div className="text-xs text-muted">
                    {(mostActive.shieldCount + mostActive.unshieldCount).toLocaleString()} txs ·{' '}
                    TVS {mostActive.tvlCompact}
                  </div>
                </div>
                <Badge variant="accent" style={{ marginLeft: 'auto' }}>
                  #{tvlData.indexOf(mostActive) + 1} TVS rank
                </Badge>
              </div>
            ) : (
              <span className="text-muted text-sm">No data</span>
            )}
          </Card>
        </div>
      )}

      {/* ── Main grid: TVL + Activity ── */}
      <div className="analytics-main-grid">
        {/* TVL by token */}
        <Card variant="default" padding="lg">
          <h3
            style={{
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              marginBottom: 'var(--sp-5)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BarChart2 size={18} style={{ color: 'var(--accent)' }} />
            TVS by Token
          </h3>

          {isLoading && tvlData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={48} />)}
            </div>
          ) : tvlData.length === 0 ? (
            <p className="text-sm text-muted" style={{ textAlign: 'center', padding: 'var(--sp-8) 0' }}>
              No data yet — connect wallet or wait for registry to load.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {tvlData.map((t) => (
                <TVLBar key={t.symbol} token={t} maxTvlHuman={maxTvlHuman} explorerBase={explorerBase} />
              ))}
            </div>
          )}

          <p className="text-xs text-muted" style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
            TVS (Total Value Shielded) = underlying ERC-20 held by wrapper. Bar = relative share.
            <span style={{ color: 'var(--success)' }}> ↑</span> shield count ·{' '}
            <span style={{ color: 'var(--warning)' }}>↓</span> unshield count · vol = period volume
          </p>
        </Card>

        {/* Recent Activity */}
        <Card variant="default" padding="lg">
          <h3
            style={{
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              marginBottom: 'var(--sp-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            Recent Activity
            {activity.length > 0 && (
              <Badge variant="default" size="sm" style={{ marginLeft: 'auto' }}>
                {activity.length} events
              </Badge>
            )}
          </h3>
          <p className="text-xs text-muted" style={{ marginBottom: 'var(--sp-5)' }}>
            Latest shield &amp; unshield events across all tokens · since 00:00 UTC · up to 25 shown
          </p>

          {isLoading && activity.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={56} />)}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted" style={{ textAlign: 'center', padding: 'var(--sp-8) 0' }}>
              No shield/unshield events since 00:00 UTC today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {activity.map((event, i) => (
                <ActivityRow
                  key={`${event.txHash}-${i}`}
                  event={event}
                  explorerBase={explorerBase}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
