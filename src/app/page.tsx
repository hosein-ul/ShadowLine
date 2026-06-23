'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import TokenIcon from '@/components/ui/TokenIcon';
import Skeleton from '@/components/ui/Skeleton';
import Tooltip from '@/components/ui/Tooltip';
import { formatAddress, formatAmount } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useRegistryPairs, isMintablePair, type RegistryPairsResult } from '@/lib/registry';
import { type WrapperPair } from '@/config/contracts';
import { ERC20_ABI } from '@/lib/wrapper-abi';
import BlurIn from '@/components/ui/BlurIn';
import { useAccount, useReadContract } from 'wagmi';
import { useConfidentialBalance } from '@zama-fhe/react-sdk';
import {
  Search,
  Lock,
  Unlock,
  Shield,
  ExternalLink,
  Info,
  AlertTriangle,
  AlertCircle,
  Database,
  Settings2,
} from 'lucide-react';

// ─── Tooltip content constants ────────────────────────────────────────────────
// Centralised here so copy can be revised without hunting through JSX.

const TIP = {
  erc7984: 'ERC-7984 wrapper stores your balance as on-chain ciphertext via FHE — unreadable by anyone without your cryptographic permit.',
  confidentialBadge: 'Balances are encrypted on-chain via FHE. Only you can decrypt them by signing an EIP-712 permit.',
  publicBalance: 'Your unencrypted ERC-20 balance, visible to anyone on-chain. Shield it to make it private.',
  confidentialBalance: 'Encrypted balance. Click Decrypt to sign a read-only EIP-712 permit — no tokens are spent, your private key stays in your wallet.',
  mockBadge: 'Testnet mock token deployed by Zama. Has a public mint() — get free tokens from the Faucet page.',
  shield: (sym: string) => `Convert public ${sym} into encrypted c${sym}. Requires ERC-20 approval then the shield transaction.`,
  unshield: (sym: string) => `Burn encrypted c${sym} and retrieve public ${sym}. Two-step: on-chain unwrap + Gateway proof finalization.`,
  permit: 'Read-only off-chain signature (EIP-712). Authorises Zama Gateway to decrypt your balance for this session. Does not spend tokens or approve contracts.',
};

// ─── Per-row component ────────────────────────────────────────────────────────

function RegistryTokenRow({
  wrapper,
  explorerBase,
  isTestnet,
}: {
  wrapper: WrapperPair;
  explorerBase: string;
  isTestnet: boolean;
}) {
  const { address, isConnected } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);

  // Public ERC-20 balance
  const { data: rawPublicBalance } = useReadContract({
    abi: ERC20_ABI,
    address: wrapper.erc20Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });
  const publicBalance = rawPublicBalance as bigint | undefined;

  // Confidential balance — only fires after explicit user click
  const {
    data: confidentialBalance,
    isLoading: isDecrypting,
    error: decryptError,
    refetch: refetchConfidential,
  } = useConfidentialBalance(
    { tokenAddress: wrapper.erc7984Address },
    { enabled: decryptRequested && isConnected && !!address },
  );

  const isRevoked = wrapper.isValid === false;
  const cleanName = wrapper.name.replace(/\s*\(Mock\)\s*/gi, '').trim();
  const isMock = isMintablePair(wrapper) && isTestnet;
  const confidentialSymbol = `c${wrapper.symbol}`;

  const handleDecrypt = () => {
    setDecryptRequested(true);
    refetchConfidential();
  };

  return (
    <tr style={isRevoked ? { opacity: 0.55 } : undefined}>

      {/* ── Token ─────────────────────────────────────────────────────────── */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenIcon symbol={wrapper.symbol} size={28} />
          <div>
            {/* Name + badges on one line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {cleanName}
              {isMock && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Badge variant="default" size="sm" style={{ fontSize: 9 }}>Mock</Badge>
                  <Tooltip content={TIP.mockBadge} />
                </div>
              )}
              {isRevoked && (
                <Badge variant="error" size="sm" style={{ gap: 3 }}>
                  <AlertTriangle size={9} /> Revoked
                </Badge>
              )}
            </div>
            <div className="text-muted text-xs">{wrapper.symbol}</div>
          </div>
        </div>
      </td>

      {/* ── ERC-20 Address ────────────────────────────────────────────────── */}
      <td>
        <div className="table-address">
          <a
            href={`${explorerBase}/address/${wrapper.erc20Address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
            aria-label={`View ${wrapper.symbol} on explorer`}
            title={wrapper.erc20Address}
            style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {formatAddress(wrapper.erc20Address, 6)}
            <ExternalLink size={11} />
          </a>
          <CopyButton text={wrapper.erc20Address} />
        </div>
      </td>

      {/* ── ERC-7984 Wrapper ──────────────────────────────────────────────── */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Badge variant="accent" size="sm" style={{ gap: 3, alignSelf: 'flex-start' }}>
              <Lock size={9} /> Confidential
            </Badge>
            <Tooltip content={TIP.confidentialBadge} />
          </div>
          <div className="table-address">
            <a
              href={`${explorerBase}/address/${wrapper.erc7984Address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
              aria-label={`View ${confidentialSymbol} on explorer`}
              title={wrapper.erc7984Address}
              style={{ color: 'var(--accent)', transition: 'opacity 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {formatAddress(wrapper.erc7984Address, 6)}
              <ExternalLink size={11} style={{ color: 'var(--accent)' }} />
            </a>
            <CopyButton text={wrapper.erc7984Address} />
          </div>
          <div className="text-xs text-muted">{confidentialSymbol}</div>
        </div>
      </td>

      {/* ── Public Balance ────────────────────────────────────────────────── */}
      <td>
        {!isConnected ? (
          <span className="text-xs text-muted">—</span>
        ) : publicBalance !== undefined ? (
          <span className="text-sm">
            {formatAmount(publicBalance, wrapper.decimals)}{' '}
            <span className="text-xs text-muted">{wrapper.symbol}</span>
          </span>
        ) : (
          <Skeleton width={64} height={14} />
        )}
      </td>

      {/* ── Confidential Balance ──────────────────────────────────────────── */}
      <td>
        {!isConnected ? (
          <span className="text-xs text-muted">—</span>
        ) : confidentialBalance !== undefined && confidentialBalance !== null ? (
          <span className="flex items-center gap-1 text-sm">
            {formatAmount(confidentialBalance, wrapper.wrapperDecimals)}{' '}
            <span className="text-xs text-muted">{confidentialSymbol}</span>
            <Lock size={10} style={{ color: 'var(--accent)' }} />
          </span>
        ) : isDecrypting ? (
          <span className="text-xs text-muted">Awaiting signature…</span>
        ) : decryptError ? (
          <button
            onClick={handleDecrypt}
            className="flex items-center gap-1"
            style={{ color: 'var(--color-danger, #ef4444)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: 0 }}
            title={`Decryption failed: ${decryptError.message}`}
            aria-label={`Retry decrypt ${confidentialSymbol}`}
          >
            <AlertCircle size={11} /> Retry
          </button>
        ) : (
          <span className="flex items-center gap-1">
            <button
              onClick={handleDecrypt}
              className="flex items-center gap-1"
              style={{
                color: 'var(--accent)',
                border: '1px solid var(--border-accent, var(--accent))',
                background: 'var(--accent-subtle, rgba(255,210,8,0.08))',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              aria-label={`Decrypt ${confidentialSymbol} balance`}
            >
              <Unlock size={10} /> Decrypt
            </button>
            <Tooltip content={TIP.permit} />
          </span>
        )}
      </td>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <td style={{ textAlign: 'right' }}>
        {isRevoked ? (
          <span className="text-xs text-muted" title="This pair has been revoked from the registry">
            Unavailable
          </span>
        ) : (
          <div className="flex justify-end items-center gap-2">
            <Link href={`/wrap?token=${wrapper.symbol}&action=wrap`}>
              <Button variant="primary" size="sm" style={{ gap: 4 }} aria-label={`Shield ${wrapper.symbol}`}>
                <Shield size={12} /> Shield
              </Button>
            </Link>
            <Tooltip content={TIP.shield(wrapper.symbol)} />
            <Link href={`/wrap?token=${wrapper.symbol}&action=unwrap`}>
              <Button variant="secondary" size="sm" aria-label={`Unshield ${confidentialSymbol}`}>
                Unshield
              </Button>
            </Link>
            <Tooltip content={TIP.unshield(wrapper.symbol)} />
            <Link href={`/wrap?token=${wrapper.symbol}`}>
              <Button variant="ghost" size="sm" style={{ gap: 4 }} aria-label={`Manage ${wrapper.symbol}`} title={`Manage ${wrapper.symbol}`}>
                <Settings2 size={12} /> Manage
              </Button>
            </Link>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRevoked, setShowRevoked] = useState(false);
  const { isTestnet, activeChainId } = useActiveNetwork();

  const { pairs, isLoading, isFromCache, total }: RegistryPairsResult =
    useRegistryPairs(activeChainId);

  const visibleWrappers = useMemo(
    () => (showRevoked ? pairs : pairs.filter(p => p.isValid !== false)),
    [pairs, showRevoked],
  );
  const revokedCount = useMemo(() => pairs.filter(p => p.isValid === false).length, [pairs]);

  const filteredWrappers = useMemo(() => {
    if (!searchQuery) return visibleWrappers;
    const q = searchQuery.toLowerCase();
    return visibleWrappers.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.symbol.toLowerCase().includes(q) ||
        w.erc20Address.toLowerCase().includes(q) ||
        w.erc7984Address.toLowerCase().includes(q),
    );
  }, [visibleWrappers, searchQuery]);

  const explorerBase = isTestnet ? 'https://eth-sepolia.blockscout.com' : 'https://eth.blockscout.com';

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      {/* Header */}
      <div className="page-header" style={{ position: 'relative', zIndex: 2 }}>
        <h1><BlurIn text="Confidential Wrapper Registry" duration={600} /></h1>
        <p style={{ marginTop: 'var(--sp-2)' }}>
          <BlurIn
            text="Discover all verified ERC-20 ↔ ERC-7984 confidential wrapper pairs on Ethereum and Sepolia. Wrap standard assets using FHE to privatize balances."
            duration={800}
            delay={200}
          />
        </p>
      </div>

      {/* Cached-snapshot banner */}
      {isFromCache && (
        <Card variant="glass" padding="sm" style={{ marginBottom: 'var(--sp-4)', position: 'relative', zIndex: 2 }}>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
              <Database size={14} />
            </span>
            <span>
              Showing a cached snapshot. Connect a wallet on{' '}
              {isTestnet ? 'Sepolia' : 'Ethereum Mainnet'} to read the live on-chain
              WrappersRegistry — the live list may include newer pairs.
            </span>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-3 gap-4" style={{ marginBottom: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>Registered Pairs</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }} className="text-gradient">
            {isLoading && pairs.length === 0 ? <Skeleton width={48} height={36} /> : total}
          </div>
          {revokedCount > 0 && <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-1)' }}>{revokedCount} revoked</div>}
        </Card>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>Active Network</div>
          <Badge variant={isTestnet ? 'warning' : 'success'} dot>
            {isTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
          </Badge>
        </Card>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>FHE Security</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }} className="flex items-center gap-2">
            <span>ERC-7984 Standard</span>
            <Tooltip content={TIP.erc7984} />
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center gap-4" style={{ marginBottom: 'var(--sp-6)', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'inline-flex' }}>
            <Search size={16} />
          </span>
          <input
            type="search"
            className="input"
            placeholder="Search by token, symbol, or address…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 40 }}
            aria-label="Search registered wrapper pairs"
          />
        </div>
        {revokedCount > 0 && (
          <label className="flex items-center gap-2 text-xs text-muted" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={showRevoked} onChange={e => setShowRevoked(e.target.checked)} aria-label="Show revoked pairs" />
            Show revoked ({revokedCount})
          </label>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">ERC-20 Address</th>
              <th scope="col">
                <span className="flex items-center gap-1">
                  ERC-7984 Wrapper
                  <Tooltip content={TIP.erc7984} />
                </span>
              </th>
              <th scope="col">
                <span className="flex items-center gap-1">
                  Public Balance
                  <Tooltip content={TIP.publicBalance} />
                </span>
              </th>
              <th scope="col">
                <span className="flex items-center gap-1">
                  Confidential Balance
                  <Tooltip content={TIP.confidentialBalance} />
                </span>
              </th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && filteredWrappers.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan={6}><Skeleton height={44} /></td>
                </tr>
              ))
            ) : filteredWrappers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: 'var(--sp-12) var(--sp-8)' }}>
                    <div className="empty-state-icon" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                      <Search size={32} />
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--sp-4)' }}>
                      {searchQuery ? 'No tokens match your search query' : 'No registered wrappers found on this network'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWrappers.map(wrapper => (
                <RegistryTokenRow
                  key={wrapper.erc20Address}
                  wrapper={wrapper}
                  explorerBase={explorerBase}
                  isTestnet={isTestnet}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Banner */}
      <Card variant="glass" padding="md" style={{ marginTop: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
        <div className="flex items-start gap-4">
          <div style={{ color: 'var(--accent)', display: 'inline-flex', marginTop: 2 }}>
            <Info size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Underlying Mechanism</span>
              <Lock size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-muted text-sm" style={{ lineHeight: 'var(--lh-relaxed)' }}>
              Confidential wrappers convert standard public tokens into ERC-7984 tokens
              utilizing Fully Homomorphic Encryption (FHE) on the fhEVM. On-chain values
              (like account balances and transfer amounts) are encrypted into cryptographic
              handles — protecting transaction details from public ledger scraping.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
