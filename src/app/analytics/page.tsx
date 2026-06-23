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
import { formatAmount, formatAddress } from '@/lib/utils';
import { CHAIN_CONFIG } from '@/config/chains';
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
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface TokenTVL {
  symbol: string;
  tvlRaw: bigint;
  tvlFormatted: string;
  decimals: number;
  erc20Address: string;
  wrapperAddress: string;
  shieldCount: number;
  unshieldCount: number;
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
  maxTvl,
  explorerBase,
}: {
  token: TokenTVL;
  maxTvl: bigint;
  explorerBase: string;
}) {
  const pct = maxTvl > 0n
    ? Number((token.tvlRaw * 10000n) / maxTvl) / 100
    : 0;

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
        <div
          className="analytics-tvl-bar-fill"
          style={{ width: `${Math.max(pct, 0.5)}%` }}
        />
      </div>

      <div className="analytics-tvl-stats">
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', textAlign: 'right' }}>
          {token.tvlFormatted}
        </div>
        <div className="text-xs text-muted" style={{ textAlign: 'right' }}>
          {token.shieldCount}↑ {token.unshieldCount}↓
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
  const amount = formatUnits(event.amount, event.decimals);

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
            {amount} {event.symbol}
          </Badge>
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 2 }}>
          {isShield ? 'from' : 'to'}{' '}
          <code style={{ fontSize: 11 }}>{formatAddress(isShield ? event.from : event.to)}</code>
        </div>
      </div>

      <a
        href={`${explorerBase}/tx/${event.txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs"
        style={{ color: 'var(--accent)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        Tx <ExternalLink size={11} />
      </a>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

const BLOCK_LOOKBACK = 5000n; // ~17 hours on Sepolia (12s blocks)

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
      const fromBlock = latestBlock > BLOCK_LOOKBACK
        ? latestBlock - BLOCK_LOOKBACK
        : 0n;

      // Fetch all data in parallel per token
      const tokenResults = await Promise.all(
        pairs
          .filter((p) => p.isValid !== false)
          .map(async (pair) => {
            try {
              // TVL: underlying ERC-20 balance held by the wrapper
              const tvlRaw = await client.readContract({
                address: pair.erc20Address,
                abi: ERC20_BALANCE_ABI,
                functionName: 'balanceOf',
                args: [pair.erc7984Address],
              }) as bigint;

              // Shield events: Transfer(user → wrapper)
              const shieldLogs = await client.getLogs({
                address: pair.erc20Address,
                event: TRANSFER_ABI,
                args: { to: pair.erc7984Address },
                fromBlock,
                toBlock: latestBlock,
              });

              // Unshield events: Transfer(wrapper → user)
              const unshieldLogs = await client.getLogs({
                address: pair.erc20Address,
                event: TRANSFER_ABI,
                args: { from: pair.erc7984Address },
                fromBlock,
                toBlock: latestBlock,
              });

              const tokenTvl: TokenTVL = {
                symbol: pair.symbol,
                tvlRaw,
                tvlFormatted: formatAmount(tvlRaw, pair.decimals),
                decimals: pair.decimals,
                erc20Address: pair.erc20Address,
                wrapperAddress: pair.erc7984Address,
                shieldCount: shieldLogs.length,
                unshieldCount: unshieldLogs.length,
              };

              // Build activity events
              const shieldEvents: ActivityEvent[] = shieldLogs.slice(-10).map((log) => ({
                type: 'shield' as const,
                symbol: pair.symbol,
                amount: (log.args?.value as bigint) ?? 0n,
                decimals: pair.decimals,
                from: (log.args?.from as string) ?? '',
                to: (log.args?.to as string) ?? '',
                txHash: log.transactionHash ?? '',
                blockNumber: log.blockNumber ?? 0n,
              }));

              const unshieldEvents: ActivityEvent[] = unshieldLogs.slice(-10).map((log) => ({
                type: 'unshield' as const,
                symbol: pair.symbol,
                amount: (log.args?.value as bigint) ?? 0n,
                decimals: pair.decimals,
                from: (log.args?.from as string) ?? '',
                to: (log.args?.to as string) ?? '',
                txHash: log.transactionHash ?? '',
                blockNumber: log.blockNumber ?? 0n,
              }));

              return { tokenTvl, events: [...shieldEvents, ...unshieldEvents] };
            } catch {
              // If one token fails (e.g. no getLogs support), skip gracefully
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
        .slice(0, 30);

      setTvlData(allTvl.sort((a, b) => (b.tvlRaw > a.tvlRaw ? 1 : -1)));
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
  const maxTvl = tvlData.reduce((m, t) => (t.tvlRaw > m ? t.tvlRaw : m), 0n);
  const activePairs = tvlData.filter((t) => t.tvlRaw > 0n).length;

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
          Data sourced directly from Ethereum Transfer events — no indexer required.
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
          &nbsp;·&nbsp;Last {Number(BLOCK_LOOKBACK).toLocaleString()} blocks (~17h)
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
          label="Shields (last 17h)"
          value={isLoading && tvlData.length === 0 ? '…' : totalShields.toString()}
          color="var(--success)"
          loading={isLoading && tvlData.length === 0}
        />
        <StatCard
          icon={<Unlock size={18} />}
          label="Unshields (last 17h)"
          value={isLoading && tvlData.length === 0 ? '…' : totalUnshields.toString()}
          color="var(--warning)"
          loading={isLoading && tvlData.length === 0}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Unique Shielders"
          value={isLoading && tvlData.length === 0 ? '…' : uniqueShielders.toString()}
          sub="distinct addresses"
          color="#a78bfa"
          loading={isLoading && tvlData.length === 0}
        />
      </div>

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
            TVL by Token
          </h3>

          {isLoading && tvlData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={48} />
              ))}
            </div>
          ) : tvlData.length === 0 ? (
            <p className="text-sm text-muted" style={{ textAlign: 'center', padding: 'var(--sp-8) 0' }}>
              No data yet — connect wallet to load registry pairs.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {tvlData.map((t) => (
                <TVLBar key={t.symbol} token={t} maxTvl={maxTvl} explorerBase={explorerBase} />
              ))}
            </div>
          )}

          <p className="text-xs text-muted" style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)' }}>
            TVL = underlying ERC-20 balance held by each wrapper contract.
            Arrows show shield↑ / unshield↓ counts for the period.
          </p>
        </Card>

        {/* Recent Activity */}
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
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            Recent Activity
            {activity.length > 0 && (
              <Badge variant="default" size="sm" style={{ marginLeft: 'auto' }}>
                {activity.length} events
              </Badge>
            )}
          </h3>

          {isLoading && activity.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[1, 2, 3, 5].map((i) => (
                <Skeleton key={i} height={56} />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted" style={{ textAlign: 'center', padding: 'var(--sp-8) 0' }}>
              No shield or unshield events found in the last {Number(BLOCK_LOOKBACK).toLocaleString()} blocks.
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
