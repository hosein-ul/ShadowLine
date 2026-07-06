'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import {
  useRegistryPairs,
  loadCustomPairs,
  saveCustomPairs,
  type RegistryPairsResult,
  type CustomPairRecord,
} from '@/lib/registry';
import { type WrapperPair } from '@/config/contracts';
import { ERC20_ABI, WRAPPER_ABI, isErc7984Contract } from '@/lib/wrapper-abi';
import BlurIn from '@/components/ui/BlurIn';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useConfidentialBalance, useConfidentialBalances } from '@zama-fhe/react-sdk';
import { useWalletErc7984Scan } from '@/lib/use-wallet-scan';
import { useSessionReset } from '@/lib/reset-session';
import { classifyError } from '@/lib/errors';
import { useToast } from '@/components/ui/Toast';
import { isAddress, getAddress } from 'viem';
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
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';

// ─── Tooltip content constants ────────────────────────────────────────────────
// Centralised here so copy can be revised without hunting through JSX.

const TIP = {
  erc7984: 'ERC-7984 wrapper stores your balance as on-chain ciphertext via FHE — unreadable by anyone without your cryptographic permit.',
  confidentialBalance: 'Encrypted balance. Click Decrypt to sign a read-only EIP-712 permit — no tokens are spent, your private key stays in your wallet.',
};

// ─── Per-row component ────────────────────────────────────────────────────────

function shortName(name: string, maxLen = 24): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen).trimEnd() + '…';
}

function RegistryTokenRow({
  wrapper,
  explorerBase,
  isTestnet,
  batchedValue,
  batchedError,
}: {
  wrapper: WrapperPair;
  explorerBase: string;
  isTestnet: boolean;
  /** Value from the parent's batched useConfidentialBalances (one signature for all). */
  batchedValue?: bigint;
  /** Per-token error from the batched decrypt, if any. */
  batchedError?: Error;
}) {
  const { address, isConnected } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);
  // When true, the per-row Decrypt was clicked — bypass any batched value from
  // Decrypt-All so this click is authoritative. `??` preserves 0n on the left,
  // so a stale batched 0n would otherwise short-circuit the per-row query and
  // the button would feel unresponsive.
  const [preferSingle, setPreferSingle] = useState(false);
  const decryptErrorRef = useRef<string | null>(null);
  const { resetToken } = useSessionReset();

  // Public ERC-20 balance
  const { data: rawPublicBalance } = useReadContract({
    abi: ERC20_ABI,
    address: wrapper.erc20Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });
  const publicBalance = rawPublicBalance as bigint | undefined;

  // Per-row single-token decrypt — only fires after explicit user click.
  // retry: false — a rejected permit signature must NOT re-prompt the wallet.
  const {
    data: singleBalance,
    isLoading: isSingleDecrypting,
    error: singleError,
    refetch: refetchConfidential,
  } = useConfidentialBalance(
    { tokenAddress: wrapper.erc7984Address },
    {
      enabled: decryptRequested && isConnected && !!address && (preferSingle || batchedValue === undefined),
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // preferSingle overrides the batched value once the user clicks the per-row
  // Decrypt button. Otherwise, batched value from useConfidentialBalances wins
  // (one Decrypt-All signature covers everything).
  const confidentialBalance = preferSingle ? singleBalance : (batchedValue ?? singleBalance);
  const isDecrypting = isSingleDecrypting;
  const decryptError = preferSingle ? singleError : (batchedError ?? singleError);

  const isRevoked = wrapper.isValid === false;
  const cleanName = shortName(wrapper.name.replace(/\s*\(Mock\)\s*/gi, '').trim());
  // Every Sepolia registry pair is a Zama-deployed testnet mock — real mainnet
  // assets don't exist on Sepolia. (isMintablePair's on-chain symbol() check is
  // kept for the Faucet's actual mint-button gating, a separate concern; it's
  // unreliable as a *label* since some mocks' symbol() doesn't end in "Mock".)
  const isMock = isTestnet && !wrapper.name.toLowerCase().includes('restricted') && !wrapper.symbol.toLowerCase().includes('restricted');
  const confidentialSymbol = `c${wrapper.symbol}`;

  // App-wide session reset — re-arm the button so the next click prompts for
  // a fresh EIP-712 signature (IndexedDB is empty after reset).
  useEffect(() => {
    if (resetToken > 0) {
      setDecryptRequested(false);
      setPreferSingle(false);
    }
  }, [resetToken]);

  // Fire-once: on decrypt error (incl. signature rejection), disable the query
  // so it can't re-fire on remount/focus. The Decrypt button re-arms itself.
  useEffect(() => {
    if (!singleError) {
      decryptErrorRef.current = null;
      return;
    }
    const msg = singleError.message ?? '';
    if (decryptErrorRef.current === msg) return;
    decryptErrorRef.current = msg;
    setDecryptRequested(false);
  }, [singleError]);

  const handleDecrypt = () => {
    setPreferSingle(true);
    setDecryptRequested(true);
    void refetchConfidential();
  };

  const rowOpacity = isRevoked ? { opacity: 0.55 } : undefined;

  return (
    <div className="registry-pair-card" style={rowOpacity}>
      {/* ── Public token row ──────────────────────────────────────────────── */}
      <div className="registry-pair-row registry-pair-columns">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenIcon symbol={wrapper.symbol} size={28} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {wrapper.symbol}
              {isMock && <Badge variant="default" size="sm" style={{ fontSize: 9 }}>Mock</Badge>}
              {isRevoked && (
                <Badge variant="error" size="sm" style={{ gap: 3 }}>
                  <AlertTriangle size={9} /> Revoked
                </Badge>
              )}
              {wrapper.unverified && (
                <Badge variant="warning" size="sm" style={{ fontSize: 9, gap: 2 }}>
                  <AlertTriangle size={8} /> Unverified
                </Badge>
              )}
            </div>
            <div
              className="text-muted text-xs"
              title={wrapper.name}
              style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {cleanName}
            </div>
          </div>
        </div>
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
        <span className="text-sm">{wrapper.decimals}</span>
        <div>
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
        </div>
        <div style={{ textAlign: 'right' }}>
          {isRevoked ? (
            <span className="text-xs text-muted" title="This pair has been revoked from the registry">
              Unavailable
            </span>
          ) : (
            <div className="flex justify-end items-center gap-2">
              <Link href={`/app/wrapper?token=${wrapper.symbol}&action=wrap`}>
                <Button variant="primary" size="sm" style={{ gap: 4 }} aria-label={`Shield ${wrapper.symbol}`}>
                  <Shield size={12} /> Shield
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Confidential wrapper row ──────────────────────────────────────── */}
      <div className="registry-pair-row registry-pair-columns">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenIcon symbol={wrapper.symbol} size={28} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {confidentialSymbol}
              {isMock && <Badge variant="default" size="sm" style={{ fontSize: 9 }}>Mock</Badge>}
            </div>
            <div
              className="text-muted text-xs"
              style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              Confidential {cleanName}
            </div>
          </div>
        </div>
        <div className="table-address">
          <a
            href={`${explorerBase}/address/${wrapper.erc7984Address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
            aria-label={`View ${confidentialSymbol} on explorer`}
            title={wrapper.erc7984Address}
            style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {formatAddress(wrapper.erc7984Address, 6)}
            <ExternalLink size={11} />
          </a>
          <CopyButton text={wrapper.erc7984Address} />
        </div>
        <span className="flex items-center gap-1">
          <span className="text-sm">{wrapper.wrapperDecimals}</span>
          <span className="text-xs text-muted">FHE</span>
          <Tooltip content="FHE ciphertexts use a fixed euint64 scale (6 decimals), independent of the underlying token's decimals." />
        </span>
        <div>
          {!isConnected ? (
            <span className="text-xs text-muted">—</span>
          ) : confidentialBalance !== undefined && confidentialBalance !== null ? (
            confidentialBalance === 0n ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted" title="Confidential balance is empty — no ciphertext exists on-chain for this token, so no permit is needed.">
                  No confidential balance yet
                </span>
                <button
                  onClick={handleDecrypt}
                  className="flex items-center gap-1 btn-decrypt"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                  aria-label="Refresh confidential balance"
                  title="Re-check on-chain"
                >
                  <RefreshCw size={9} />
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm">
                {formatAmount(confidentialBalance, wrapper.wrapperDecimals)}{' '}
                <span className="text-xs text-muted">{confidentialSymbol}</span>
                <Lock size={10} style={{ color: 'var(--text-secondary)' }} />
              </span>
            )
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
            <button
              onClick={handleDecrypt}
              className="flex items-center gap-1 btn-decrypt"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              aria-label={`Decrypt ${confidentialSymbol} balance`}
            >
              <Unlock size={10} /> Decrypt
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {isRevoked ? (
            <span className="text-xs text-muted" title="This pair has been revoked from the registry">
              Unavailable
            </span>
          ) : (
            <div className="flex justify-end items-center gap-2">
              <Link href={`/app/wrapper?token=${wrapper.symbol}&action=unwrap`}>
                <Button variant="secondary" size="sm" aria-label={`Unshield ${confidentialSymbol}`}>
                  Unshield
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detected Token Row (For Wallet Scan Auto-Detection) ──────────────────────

interface CustomTokenEntry {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  isAutoDetected: boolean;
}

function DetectedTokenRow({
  token,
  explorerBase,
  onRemove,
  batchedValue,
  batchedError,
}: {
  token: CustomTokenEntry;
  explorerBase: string;
  onRemove?: () => void;
  batchedValue?: bigint;
  batchedError?: Error;
}) {
  const { address, isConnected } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);
  // Force the per-row query to win over a stale batched 0n — same rationale as
  // in RegistryTokenRow. Clicking Decrypt is authoritative.
  const [preferSingle, setPreferSingle] = useState(false);
  const { resetToken } = useSessionReset();

  // 1. Read the underlying ERC-20 via the canonical `underlying()` getter
  // (OpenZeppelin IERC7984ERC20Wrapper — verified on-chain: real registry
  // wrappers revert on the legacy `underlyingToken()` alias).
  const { data: rawUnderlyingAddress } = useReadContract({
    abi: WRAPPER_ABI,
    address: token.address,
    functionName: 'underlying',
    query: { enabled: isConnected && !!address },
  });
  const underlyingAddress = rawUnderlyingAddress as `0x${string}` | undefined;
  const isWrapper = !!underlyingAddress && underlyingAddress !== '0x0000000000000000000000000000000000000000';

  // 2. Query public balance of the underlying token (if it is a wrapper)
  const { data: rawPublicBalance } = useReadContract({
    abi: ERC20_ABI,
    address: isWrapper ? underlyingAddress : undefined,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && isWrapper },
  });
  const publicBalance = rawPublicBalance as bigint | undefined;

  // 3. Confidential balance — only decrypted on explicit user action.
  // Prefer the parent's batched value (one signature covers everything).
  // retry: false — a rejected permit signature must NOT re-prompt the wallet.
  const {
    data: singleBalance,
    isLoading: isSingleDecrypting,
    error: singleError,
  } = useConfidentialBalance(
    { tokenAddress: token.address },
    {
      enabled: decryptRequested && isConnected && !!address && (preferSingle || batchedValue === undefined),
      retry: false,
      refetchOnWindowFocus: false,
    },
  );
  const confidentialBalance = preferSingle ? singleBalance : (batchedValue ?? singleBalance);
  const isDecrypting = isSingleDecrypting;
  const decryptError = preferSingle ? singleError : (batchedError ?? singleError);

  const cleanName = shortName(token.name.replace(/\s*\(Mock\)\s*/gi, '').trim());
  const confidentialSymbol = `c${token.symbol}`;

  // App-wide reset — re-arm the button.
  useEffect(() => {
    if (resetToken > 0) {
      setDecryptRequested(false);
      setPreferSingle(false);
    }
  }, [resetToken]);

  // Fire-once: on decrypt error, disable the query so it can't re-fire.
  const decryptErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!singleError) {
      decryptErrorRef.current = null;
      return;
    }
    const msg = singleError.message ?? '';
    if (decryptErrorRef.current === msg) return;
    decryptErrorRef.current = msg;
    setDecryptRequested(false);
  }, [singleError]);

  const handleDecrypt = () => {
    setPreferSingle(true);
    setDecryptRequested(true);
    // State transition alone enables the query; calling refetch() before the
    // re-render means it fires against the still-disabled query and is a no-op.
  };

  return (
    <div className="registry-pair-card">
      {/* ── Public token row ──────────────────────────────────────────────── */}
      <div className="registry-pair-row registry-pair-columns">
        {isWrapper ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TokenIcon symbol={token.symbol} size={28} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {token.symbol}
                <Badge variant={token.isAutoDetected ? 'warning' : 'accent'} size="sm" style={{ fontSize: 9 }}>
                  {token.isAutoDetected ? 'Detected' : 'Custom'}
                </Badge>
              </div>
              <div className="text-muted text-xs">{cleanName}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TokenIcon symbol={token.symbol} size={28} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {token.symbol}
                <Badge variant="default" size="sm" style={{ fontSize: 9, gap: 3 }}>
                  <Unlock size={8} /> Decrypt-only
                </Badge>
              </div>
              <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>Native FHE asset — no ERC-20</span>
            </div>
          </div>
        )}
        <div className="registry-addr-col">
          {isWrapper && underlyingAddress ? (
            <div className="table-address">
              <a
                href={`${explorerBase}/address/${underlyingAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
                aria-label={`View underlying on explorer`}
                title={underlyingAddress}
                style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {formatAddress(underlyingAddress, 6)}
                <ExternalLink size={11} />
              </a>
              <CopyButton text={underlyingAddress} />
            </div>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </div>
        <span>{isWrapper ? <span className="text-sm">{token.decimals}</span> : <span className="text-xs text-muted">—</span>}</span>
        <div>
          {!isConnected ? (
            <span className="text-xs text-muted">—</span>
          ) : !isWrapper ? (
            <span className="text-xs text-muted">—</span>
          ) : publicBalance !== undefined ? (
            <span className="text-sm">
              {formatAmount(publicBalance, token.decimals)}{' '}
              <span className="text-xs text-muted">{token.symbol}</span>
            </span>
          ) : (
            <Skeleton width={64} height={14} />
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {isWrapper ? (
            <div className="flex justify-end items-center gap-2">
              <Link href={`/app/wrapper?token=${token.address}&action=wrap`}>
                <Button variant="primary" size="sm" style={{ gap: 4 }}>
                  <Shield size={12} /> Shield
                </Button>
              </Link>
            </div>
          ) : (
            <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>Direct Transfer Only</span>
          )}
        </div>
      </div>

      {/* ── Confidential wrapper row ──────────────────────────────────────── */}
      <div className="registry-pair-row registry-pair-columns">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenIcon symbol={token.symbol} size={28} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{confidentialSymbol}</div>
            <div className="text-muted text-xs">Confidential {cleanName}</div>
          </div>
        </div>
        <div className="table-address">
          <a
            href={`${explorerBase}/address/${token.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
            aria-label={`View confidential token on explorer`}
            title={token.address}
            style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {formatAddress(token.address, 6)}
            <ExternalLink size={11} />
          </a>
          <CopyButton text={token.address} />
        </div>
        <span className="flex items-center gap-1">
          <span className="text-sm">6</span>
          <span className="text-xs text-muted">FHE</span>
          <Tooltip content="FHE ciphertexts use a fixed euint64 scale (6 decimals), independent of the underlying token's decimals." />
        </span>
        <div>
          {!isConnected ? (
            <span className="text-xs text-muted">—</span>
          ) : confidentialBalance !== undefined && confidentialBalance !== null ? (
            confidentialBalance === 0n ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted" title="Confidential balance is empty — no ciphertext exists on-chain, so no permit is needed.">
                  No confidential balance yet
                </span>
                <button
                  onClick={handleDecrypt}
                  className="flex items-center gap-1 btn-decrypt"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                  aria-label="Refresh confidential balance"
                  title="Re-check on-chain"
                >
                  <RefreshCw size={9} />
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm">
                {/* wrapperDecimals (euint64 = 6) not token.decimals — the encrypted
                    balance is in wrapper units, and the underlying scale would
                    show 0 for high-decimal underlyings. */}
                {formatAmount(confidentialBalance, 6)}{' '}
                <span className="text-xs text-muted">{confidentialSymbol}</span>
                <Lock size={10} style={{ color: 'var(--text-secondary)' }} />
              </span>
            )
          ) : isDecrypting ? (
            <span className="text-xs text-muted">Awaiting signature…</span>
          ) : decryptError ? (
            <button
              onClick={handleDecrypt}
              className="flex items-center gap-1"
              style={{ color: 'var(--color-danger, #ef4444)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: 0 }}
              title={`Decryption failed: ${decryptError.message}`}
              aria-label={`Retry decrypt`}
            >
              <AlertCircle size={11} /> Retry
            </button>
          ) : (
            <button
              onClick={handleDecrypt}
              className="flex items-center gap-1 btn-decrypt"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              aria-label={`Decrypt balance`}
            >
              <Unlock size={10} /> Decrypt
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="flex justify-end items-center gap-2">
            {isWrapper && (
              <Link href={`/app/wrapper?token=${token.address}&action=unwrap`}>
                <Button variant="secondary" size="sm">
                  Unshield
                </Button>
              </Link>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                style={{ color: '#ef4444', padding: '6px 8px', minWidth: 'auto' }}
                title="Remove manually added custom token"
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRevoked, setShowRevoked] = useState(false);
  const customTokenSectionRef = useRef<HTMLDivElement>(null);
  const { isTestnet, activeChainId } = useActiveNetwork();
  const { addToast } = useToast();
  const { resetToken } = useSessionReset();

  const { pairs, isLoading, isFromCache, officialTotal, customTotal }: RegistryPairsResult =
    useRegistryPairs(activeChainId);

  const { address, isConnected } = useAccount();
  // Pin the client to the app's active network — without the explicit chainId,
  // wagmi follows the wallet's chain, so validation reads could silently hit
  // the wrong network (e.g. wallet on Mainnet while the UI shows Sepolia).
  const client = usePublicClient({ chainId: activeChainId });

  const registryAddresses = useMemo(() => {
    return new Set(pairs.map((p) => p.erc7984Address.toLowerCase()));
  }, [pairs]);

  const {
    extra: detectedExtras,
    status: scanStatus,
    rescan,
  } = useWalletErc7984Scan(address, client, registryAddresses);

  // === Persistent Local Custom Pairs (chain-scoped, versioned) ===
  const [customPairs, setCustomPairs] = useState<CustomPairRecord[]>([]);

  // Client-side load (SSR-safe — window is only touched in the effect).
  useEffect(() => {
    setCustomPairs(loadCustomPairs(activeChainId));
  }, [activeChainId]);

  // Adapt CustomPairRecord[] → CustomTokenEntry[] for the existing row UI.
  const localCustomTokens = useMemo<CustomTokenEntry[]>(
    () => customPairs.map((p) => ({
      address: p.erc7984Address,
      symbol: p.symbol,
      name: p.name,
      decimals: p.wrapperDecimals,
      isAutoDetected: false,
    })),
    [customPairs],
  );

  // === Add Custom Pair — one input, on-chain validation ===
  const [inputAddress, setInputAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressInfo, setAddressInfo] = useState<string | null>(null);
  const [previewPair, setPreviewPair] = useState<CustomPairRecord | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const validationTokenRef = useRef(0);

  // Duplicate-check data is read through a ref so the validation effect below
  // does NOT depend on `pairs` / `customPairs` / `detectedExtras` identities.
  // With them in the dependency array, any unrelated re-render (balance
  // refetch, scan status, decrypt state) re-ran the effect, cancelled the
  // debounce timer, discarded the in-flight validation (token bump) and wiped
  // the preview — the visible symptom was a stuck "Checking wrapper on-chain…"
  // and a pair that could never be added.
  const dedupDataRef = useRef({ pairs, customPairs, detectedExtras });
  useEffect(() => {
    dedupDataRef.current = { pairs, customPairs, detectedExtras };
  }, [pairs, customPairs, detectedExtras]);

  // Debounced on-chain validation. Runs against a wallet-independent viem
  // PublicClient — works even before a wallet is connected.
  useEffect(() => {
    setAddressError('');
    setAddressInfo(null);
    setPreviewPair(null);
    const paste = inputAddress.trim();
    if (!paste) return;
    if (!isAddress(paste)) {
      // Distinguish a checksum failure (right shape, wrong EIP-55 casing —
      // viem's strict isAddress rejects it) from a malformed string, so the
      // user gets an actionable message instead of a generic one.
      setAddressError(
        /^0x[0-9a-fA-F]{40}$/.test(paste)
          ? 'Address checksum is invalid (EIP-55 mixed-case mismatch) — re-copy it from the explorer or paste it in all-lowercase.'
          : 'Not a valid Ethereum address (0x-prefixed, 42 chars).',
      );
      return;
    }
    const wrapperAddr = getAddress(paste) as `0x${string}`;
    if (wrapperAddr === '0x0000000000000000000000000000000000000000') {
      setAddressError('Cannot add the zero address.');
      return;
    }
    if (!client) {
      setAddressError('No RPC client available for this network — try reloading.');
      return;
    }

    const token = ++validationTokenRef.current;
    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        // 1) Contract check.
        const code = await client.getCode({ address: wrapperAddr });
        if (token !== validationTokenRef.current) return;
        if (!code || code === '0x') {
          setAddressError('Not a contract on this network.');
          return;
        }

        // 2) ERC-7984 check — robust: ERC-165 fast path, then a behavioral
        // `confidentialBalanceOf` probe so tokens that don't implement ERC-165
        // (but ARE real ERC-7984s) are still accepted. See isErc7984Contract.
        const isErc7984 = await isErc7984Contract(client, wrapperAddr);
        if (token !== validationTokenRef.current) return;
        if (!isErc7984) {
          setAddressError('Not an ERC-7984 confidential token (no ERC-165 support and no confidentialBalanceOf).');
          return;
        }

        // 3) underlying() — canonical name, with the legacy underlyingToken()
        // alias as a fallback. A token with NO underlying is a valid
        // confidential-only ERC-7984 (not a wrapper): we still add it, as a
        // decrypt-only token with no shield/unshield side.
        let underlyingAddr: `0x${string}` | null = null;
        try {
          underlyingAddr = (await client.readContract({
            address: wrapperAddr,
            abi: WRAPPER_ABI,
            functionName: 'underlying',
          })) as `0x${string}`;
        } catch {
          try {
            underlyingAddr = (await client.readContract({
              address: wrapperAddr,
              abi: WRAPPER_ABI,
              functionName: 'underlyingToken',
            })) as `0x${string}`;
          } catch { underlyingAddr = null; }
        }
        if (token !== validationTokenRef.current) return;

        const isWrapper =
          !!underlyingAddr &&
          underlyingAddr !== '0x0000000000000000000000000000000000000000' &&
          underlyingAddr.toLowerCase() !== wrapperAddr.toLowerCase();

        // 4) Wrapper metadata is always read; underlying metadata only when it's
        // an actual wrapper.
        const [wSymRaw, wNameRaw, wDecRaw] = await Promise.all([
          client.readContract({ address: wrapperAddr, abi: WRAPPER_ABI, functionName: 'symbol' }).catch(() => null),
          client.readContract({ address: wrapperAddr, abi: WRAPPER_ABI, functionName: 'name' }).catch(() => null),
          client.readContract({ address: wrapperAddr, abi: WRAPPER_ABI, functionName: 'decimals' }).catch(() => null),
        ]);
        if (token !== validationTokenRef.current) return;
        if (wSymRaw == null || wNameRaw == null || wDecRaw == null) {
          setAddressError('Failed to read token metadata from the contract.');
          return;
        }
        const wrapperSymbol = String(wSymRaw);
        const wrapperName = String(wNameRaw);
        const wrapperDecimals = Number(wDecRaw);

        let underlyingSymbol = '';
        let underlyingName = '';
        let underlyingDecimals = wrapperDecimals;
        if (isWrapper && underlyingAddr) {
          const [uSymRaw, uNameRaw, uDecRaw] = await Promise.all([
            client.readContract({ address: underlyingAddr, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => null),
            client.readContract({ address: underlyingAddr, abi: ERC20_ABI, functionName: 'name' }).catch(() => null),
            client.readContract({ address: underlyingAddr, abi: ERC20_ABI, functionName: 'decimals' }).catch(() => null),
          ]);
          if (token !== validationTokenRef.current) return;
          if (uSymRaw == null || uNameRaw == null || uDecRaw == null) {
            setAddressError('Failed to read underlying ERC-20 metadata.');
            return;
          }
          underlyingSymbol = String(uSymRaw);
          underlyingName = String(uNameRaw);
          underlyingDecimals = Number(uDecRaw);
        }

        // 5) Duplicate check (latest data via ref — see above).
        const { pairs: allPairs, customPairs: existingCustom } = dedupDataRef.current;
        const wLower = wrapperAddr.toLowerCase();
        const uLower = underlyingAddr?.toLowerCase();
        const registryHitByWrapper = allPairs.find(
          (p) => p.source !== 'custom' && p.erc7984Address.toLowerCase() === wLower,
        );
        const registryHitByUnderlying = isWrapper
          ? allPairs.find((p) => p.source !== 'custom' && p.erc20Address.toLowerCase() === uLower)
          : undefined;
        if (registryHitByWrapper) {
          if (registryHitByWrapper.isValid === false) {
            setAddressError('This wrapper is revoked in the on-chain registry.');
            return;
          }
          setAddressInfo(`This pair is already Official (${registryHitByWrapper.symbol}) — no need to add it.`);
          setPreviewPair(null);
          return;
        }
        if (registryHitByUnderlying) {
          setAddressError(`The underlying ${underlyingSymbol} is already in the Official registry (paired with ${registryHitByUnderlying.symbol}).`);
          return;
        }
        if (existingCustom.some((p) => {
          if (p.erc7984Address.toLowerCase() === wLower) return true;
          // erc20 collision check only when both sides have a non-zero underlying —
          // avoids false collisions between distinct confidential-only tokens
          // (both stored with erc20 = zero address).
          if (!isWrapper || !uLower) return false;
          const pu = p.erc20Address.toLowerCase();
          if (pu === '0x0000000000000000000000000000000000000000') return false;
          return pu === uLower;
        })) {
          setAddressError('This token has already been added.');
          return;
        }
        // Scanner-detected tokens are NOT a blocker for adding — the user is
        // promoting an auto-detected token to a first-class custom pair, which
        // saves it to localStorage and gets it out of the "detected" bucket.
        // (Duplicate row prevention lives in allCustomTokens dedup.)

        // All checks passed — build the preview.
        setPreviewPair({
          erc7984Address: wrapperAddr,
          erc20Address: isWrapper && underlyingAddr
            ? (getAddress(underlyingAddr) as `0x${string}`)
            : '0x0000000000000000000000000000000000000000',
          symbol: wrapperSymbol,
          name: wrapperName,
          decimals: underlyingDecimals,
          wrapperDecimals,
          underlyingSymbol,
          underlyingName,
          addedAt: Date.now(),
          source: 'custom',
          isWrapper,
        });
      } catch (err) {
        if (token !== validationTokenRef.current) return;
        const classified = classifyError(err);
        setAddressError(classified.message || 'Validation failed.');
      } finally {
        if (token === validationTokenRef.current) setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
    // Dedup data intentionally read via dedupDataRef (kept in sync above) so
    // identity churn on pairs/scan results can't cancel an in-flight check.
  }, [inputAddress, client]);

  const handleAddCustomToken = () => {
    if (!previewPair) return;
    // Backstop dedup at add time — the validation snapshot may be stale if the
    // registry/scan updated while the preview was showing.
    //
    // Comparing erc20Address only makes sense when it's non-zero. For a
    // confidential-only ERC-7984 the underlying is the zero address, and
    // comparing zero-vs-zero against ANY prior confidential-only entry would
    // false-collide — that was the "This pair already exists" bug on a second
    // confidential-only add.
    const wLower = previewPair.erc7984Address.toLowerCase();
    const uLower = previewPair.erc20Address.toLowerCase();
    const hasUnderlying = uLower !== '0x0000000000000000000000000000000000000000';
    const collides = (p: { erc7984Address: string; erc20Address: string }) => {
      if (p.erc7984Address.toLowerCase() === wLower) return true;
      if (!hasUnderlying) return false;
      const pu = p.erc20Address.toLowerCase();
      if (pu === '0x0000000000000000000000000000000000000000') return false;
      return pu === uLower;
    };
    if (
      customPairs.some(collides) ||
      pairs.some((p) => p.source !== 'custom' && collides(p))
    ) {
      setPreviewPair(null);
      setAddressError('This pair already exists in the registry or your custom list.');
      return;
    }
    const next = [...customPairs, previewPair];
    setCustomPairs(next);
    saveCustomPairs(activeChainId, next);
    setInputAddress('');
    setPreviewPair(null);
    setAddressError('');
    setAddressInfo(null);
    inputRef.current?.focus();
    addToast({
      variant: 'success',
      title: previewPair.isWrapper === false ? 'Confidential Token Added' : 'Custom Pair Added',
      message: previewPair.isWrapper === false
        ? `${previewPair.symbol} is now available to decrypt in the Custom / Dev-only section.`
        : `${previewPair.symbol} ↔ ${previewPair.underlyingSymbol} is now available for shield/unshield/decrypt.`,
    });
  };

  const handleRemoveCustomToken = (tokenAddress: string) => {
    const next = customPairs.filter(
      (p) => p.erc7984Address.toLowerCase() !== tokenAddress.toLowerCase(),
    );
    setCustomPairs(next);
    saveCustomPairs(activeChainId, next);
  };

  // ── Export / Import custom pairs (JSON) — survives a browser-cache wipe ──
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleExportCustomPairs = () => {
    const payload = JSON.stringify(
      { app: 'shadowline', kind: 'custom-pairs', version: 1, chainId: activeChainId, pairs: customPairs },
      null,
      2,
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowline-custom-pairs-${activeChainId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCustomPairs = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          chainId?: number;
          pairs?: CustomPairRecord[];
        };
        const incoming = Array.isArray(parsed.pairs) ? parsed.pairs : [];
        // Schema check per record — drop anything malformed instead of crashing.
        const valid = incoming.filter(
          (p) =>
            p &&
            isAddress(p.erc7984Address ?? '') &&
            isAddress(p.erc20Address ?? '') &&
            typeof p.symbol === 'string' &&
            typeof p.decimals === 'number' &&
            typeof p.wrapperDecimals === 'number',
        );
        if (parsed.chainId !== undefined && parsed.chainId !== activeChainId) {
          addToast({
            variant: 'warning',
            title: 'Chain Mismatch',
            message: `This file was exported for chain ${parsed.chainId}, but the active network is ${activeChainId}. Import skipped.`,
          });
          return;
        }
        const known = new Set([
          ...customPairs.map((p) => p.erc7984Address.toLowerCase()),
          ...pairs.map((p) => p.erc7984Address.toLowerCase()),
        ]);
        const fresh = valid.filter((p) => !known.has(p.erc7984Address.toLowerCase()));
        if (fresh.length === 0) {
          addToast({
            variant: 'info',
            title: 'Nothing to Import',
            message: valid.length > 0 ? 'All pairs in the file already exist.' : 'No valid pair records found in the file.',
          });
          return;
        }
        const next = [...customPairs, ...fresh];
        setCustomPairs(next);
        saveCustomPairs(activeChainId, next);
        addToast({
          variant: 'success',
          title: 'Pairs Imported',
          message: `${fresh.length} custom pair${fresh.length === 1 ? '' : 's'} restored from file.`,
        });
      } catch {
        addToast({ variant: 'error', title: 'Import Failed', message: 'The file is not valid ShadowLine custom-pairs JSON.' });
      }
    };
    reader.readAsText(file);
  };

  // Combine auto-detected extras and manual custom tokens, deduplicating by address
  const allCustomTokens = useMemo(() => {
    const merged = localCustomTokens.map((t) => ({ ...t, isAutoDetected: false }));
    const existing = new Set(merged.map((t) => t.address.toLowerCase()));

    for (const token of detectedExtras) {
      if (!existing.has(token.address.toLowerCase())) {
        merged.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          isAutoDetected: true,
        });
      }
    }
    return merged;
  }, [localCustomTokens, detectedExtras]);

  // The main table is the "Official — Zama Registry" section: custom pairs are
  // excluded here and rendered exclusively in the "Custom / Dev-only" section
  // below (they still flow to wrap/transfer/portfolio via useRegistryPairs).
  const visibleWrappers = useMemo(() => {
    const official = pairs.filter(p => p.source !== 'custom');
    return showRevoked ? official : official.filter(p => p.isValid !== false);
  }, [pairs, showRevoked]);
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

  // ── Batched Decrypt All (ONE EIP-712 signature covers every listed token) ──
  // useConfidentialBalances (plural) calls credentials.allow(...addresses) once.
  // Populate `batchAddresses` on click; empty array = disabled (no popup).
  // Result gets distributed to both RegistryTokenRow and DetectedTokenRow via
  // the `batchedValue` / `batchedError` props — rows fall back to their own
  // single-token decrypt for the per-row "Decrypt" button.
  const [batchAddresses, setBatchAddresses] = useState<`0x${string}`[]>([]);
  const batchErrorRef = useRef<string | null>(null);

  const {
    data: batchResult,
    isFetching: isBatchDecrypting,
    error: batchError,
  } = useConfidentialBalances(
    { tokenAddresses: batchAddresses },
    { enabled: batchAddresses.length > 0, retry: false, refetchOnWindowFocus: false },
  );

  // Reset on app-wide session reset — disarm the batch query.
  useEffect(() => {
    if (resetToken > 0) {
      setBatchAddresses([]);
      batchErrorRef.current = null;
    }
  }, [resetToken]);

  // Fire-once on batch failure (incl. rejected signature): disarm + one toast.
  useEffect(() => {
    if (!batchError) {
      batchErrorRef.current = null;
      return;
    }
    const msg = batchError.message ?? '';
    if (batchErrorRef.current === msg) return;
    batchErrorRef.current = msg;
    setBatchAddresses([]);
    const classified = classifyError(batchError);
    addToast({ variant: 'warning', title: classified.title, message: classified.message });
  }, [batchError, addToast]);

  // Fast address→bigint lookup for the row prop.
  const batchValueByAddress = useMemo(() => {
    const map = new Map<string, bigint>();
    if (batchResult?.results instanceof Map) {
      for (const [addr, val] of batchResult.results.entries()) {
        if (typeof val === 'bigint') map.set(addr.toLowerCase(), val);
      }
    }
    return map;
  }, [batchResult]);

  const batchErrorByAddress = useMemo(() => {
    const map = new Map<string, Error>();
    if (batchResult?.errors instanceof Map) {
      for (const [addr, err] of batchResult.errors.entries()) {
        if (err instanceof Error) map.set(addr.toLowerCase(), err);
      }
    }
    return map;
  }, [batchResult]);

  const handleDecryptAll = () => {
    if (!isConnected) return;
    const addresses: `0x${string}`[] = [];
    for (const w of filteredWrappers) {
      if (w.isValid !== false) addresses.push(w.erc7984Address);
    }
    for (const t of allCustomTokens) {
      addresses.push(t.address);
    }
    if (addresses.length === 0) return;
    setBatchAddresses(addresses);
  };

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

      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          marginBottom: 'var(--sp-8)',
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}
      >
        {/* Pairs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--sp-3) var(--sp-5)', borderRight: '1px solid var(--border)', flex: '1 1 160px' }}>
          <Database size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, lineHeight: 1.1 }}>
              {isLoading ? <Skeleton width={28} height={20} /> : officialTotal}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>
              Wrapper Pairs
              {revokedCount > 0 && <span style={{ marginLeft: 5, opacity: 0.6 }}>· {revokedCount} revoked</span>}
            </div>
          </div>
        </div>

        {/* Network */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--sp-3) var(--sp-5)', borderRight: '1px solid var(--border)', flex: '1 1 180px' }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: isTestnet ? '#f59e0b' : 'var(--success)',
            boxShadow: isTestnet ? '0 0 7px #f59e0b' : '0 0 7px var(--success)',
          }} />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.1 }}>
              {isTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>Active Network</div>
          </div>
        </div>

        {/* Standard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--sp-3) var(--sp-5)', borderRight: '1px solid var(--border)', flex: '1 1 170px' }}>
          <Lock size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.1 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>ERC-7984</span>
              <Tooltip content={TIP.erc7984} />
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>Confidential Standard</div>
          </div>
        </div>

        {/* Encryption layer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--sp-3) var(--sp-5)', flex: '1 1 160px' }}>
          <Shield size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.1 }}>fhEVM · Zama</div>
            <div className="text-xs text-muted" style={{ marginTop: 3 }}>Encryption Layer</div>
          </div>
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex justify-between items-center gap-4" style={{ marginBottom: 'var(--sp-6)', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
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
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {revokedCount > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={showRevoked} onChange={e => setShowRevoked(e.target.checked)} aria-label="Show revoked pairs" />
              Show revoked ({revokedCount})
            </label>
          )}
          {isConnected && filteredWrappers.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDecryptAll}
              isLoading={isBatchDecrypting}
              style={{ gap: 6 }}
            >
              <Unlock size={13} /> Decrypt All
            </Button>
          )}
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => customTokenSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ gap: 6 }}
            >
              <Plus size={13} /> Add Token
            </Button>
          )}
        </div>
      </div>

      {/* ── Section: Official — Zama Registry ─────────────────────────────── */}
      <div style={{ marginBottom: 'var(--sp-4)', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: 'var(--success, #10b981)' }} />
          <span>Official Registry</span>
        </h2>
        <p className="text-muted text-xs" style={{ marginTop: 2 }}>
          Verified on-chain by the Confidential Token Wrappers Registry.
          {isTestnet && ' Most Sepolia pairs are Zama mock tokens with a public mint — grab free test tokens from the Faucet page.'}
        </p>
      </div>

      {/* Pair list */}
      <div className="registry-grid-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className="registry-grid-header registry-pair-columns">
          <span>Token</span>
          <span className="registry-addr-col">Address</span>
          <span>Decimals</span>
          <span className="flex items-center gap-1">
            Balance
            <Tooltip content={TIP.confidentialBalance} />
          </span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        {isLoading && filteredWrappers.length === 0 ? (
          <div className="registry-pair-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} height={92} />
            ))}
          </div>
        ) : filteredWrappers.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-12) var(--sp-8)' }}>
            <div className="empty-state-icon" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
              <Search size={32} />
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--sp-4)' }}>
              {searchQuery ? 'No tokens match your search query' : 'No registered wrappers found on this network'}
            </div>
          </div>
        ) : (
          <div className="registry-pair-list">
            {filteredWrappers.map(wrapper => (
              <RegistryTokenRow
                key={wrapper.erc20Address}
                wrapper={wrapper}
                explorerBase={explorerBase}
                isTestnet={isTestnet}
                batchedValue={batchValueByAddress.get(wrapper.erc7984Address.toLowerCase())}
                batchedError={batchErrorByAddress.get(wrapper.erc7984Address.toLowerCase())}
              />
            ))}
          </div>
        )}
      </div>

      {/* Auto-Detected & Custom Tokens Section */}
      {isConnected && (
        <div ref={customTokenSectionRef} style={{ marginTop: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={16} style={{ color: 'var(--accent)' }} />
                <span>Custom / Dev-only Tokens</span>
              </h2>
              <p className="text-muted text-xs" style={{ marginTop: 2 }}>
                Added locally in this browser · not in the official registry. Includes ERC-7984 tokens auto-detected from your wallet history.
              </p>
            </div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              {customPairs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleExportCustomPairs} style={{ gap: 4 }} title="Download your custom pairs as JSON — restores them after a browser-cache wipe.">
                  <Download size={11} /> Export
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => importFileRef.current?.click()} style={{ gap: 4 }} title="Restore custom pairs from a previously exported JSON file.">
                <Upload size={11} /> Import
              </Button>
              <input
                ref={importFileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportCustomPairs(file);
                  e.target.value = '';
                }}
              />
              {scanStatus !== 'scanning' && (
                <Button variant="ghost" size="sm" onClick={rescan} style={{ gap: 4 }}>
                  <RefreshCw size={11} /> Rescan Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Add-Custom-Pair form — one input, on-chain validated */}
          <Card variant="glass" padding="md" style={{ marginBottom: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '3 1 320px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-xs text-muted" htmlFor="arb-addr">
                  ERC-7984 Token Address
                  <span style={{ color: 'var(--text-muted)' }}> — paste any ERC-7984 confidential token. If it&apos;s a wrapper, the underlying ERC-20 is discovered on-chain; if not, it&apos;s added as a decrypt-only token.</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Search size={14} />
                  </span>
                  <input
                    id="arb-addr"
                    ref={inputRef}
                    className="input"
                    style={{ paddingLeft: 36, fontFamily: 'monospace', fontSize: 13 }}
                    placeholder="0x…"
                    value={inputAddress}
                    onChange={(e) => setInputAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && previewPair && handleAddCustomToken()}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                {isValidating && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Loader2 size={11} className="animate-spin" /> Checking wrapper on-chain…
                  </div>
                )}
                {!isValidating && addressError && (
                  <div className="text-xs" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> {addressError}
                  </div>
                )}
                {!isValidating && addressInfo && (
                  <div className="text-xs" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Info size={10} /> {addressInfo}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="text-xs text-muted" style={{ visibility: 'hidden' }}>Add</div>
                <Button
                  variant="primary"
                  onClick={handleAddCustomToken}
                  disabled={!previewPair || isValidating}
                  style={{ gap: 6, height: '42px' }}
                >
                  <Plus size={14} /> Add Pair
                </Button>
              </div>
            </div>

            {previewPair && (
              <div
                style={{
                  marginTop: 'var(--sp-3)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  background: 'rgba(16, 185, 129, 0.06)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--sp-4)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TokenIcon symbol={previewPair.symbol} size={22} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {previewPair.isWrapper === false ? 'Confidential' : 'Wrapper'} {previewPair.symbol}
                    </div>
                    <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{formatAddress(previewPair.erc7984Address, 6)} · {previewPair.wrapperDecimals} dec</div>
                  </div>
                </div>
                {previewPair.isWrapper === false ? (
                  <Badge variant="accent" size="sm" style={{ gap: 4 }}>
                    <Unlock size={10} /> Decrypt-only · no ERC-20 wrapper
                  </Badge>
                ) : (
                  <>
                    <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>↔</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TokenIcon symbol={previewPair.underlyingSymbol} size={22} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Underlying {previewPair.underlyingSymbol}</div>
                        <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{formatAddress(previewPair.erc20Address, 6)} · {previewPair.decimals} dec</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted" style={{ marginTop: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(245,158,11,0.04)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={12} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
              <span>Custom pairs are stored locally in this browser (chain-scoped) and go through the same shield / unshield / decrypt paths as Official pairs — just without the on-chain registry endorsement.</span>
            </div>
          </Card>

          {/* Token List */}
          {scanStatus === 'scanning' ? (
            <Card variant="glass" padding="md">
              <div className="flex items-center justify-center gap-3 text-sm text-muted" style={{ padding: 'var(--sp-6) 0' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                <span>Scanning wallet transfer logs & Blockscout API for custom tokens...</span>
              </div>
            </Card>
          ) : allCustomTokens.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--sp-8)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <div className="empty-state-icon" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                <Lock size={24} />
              </div>
              <p className="text-muted" style={{ marginTop: 'var(--sp-3)', maxWidth: 380, textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                No additional custom tokens detected in wallet history. Use the form above to manually register a custom token address.
              </p>
            </div>
          ) : (
            <div className="registry-grid-wrap">
              <div className="registry-grid-header registry-pair-columns">
                <span>Token</span>
                <span className="registry-addr-col">Address</span>
                <span>Decimals</span>
                <span>Balance</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              <div className="registry-pair-list">
                {allCustomTokens.map((token) => (
                  <DetectedTokenRow
                    key={token.address}
                    token={token}
                    explorerBase={explorerBase}
                    onRemove={token.isAutoDetected ? undefined : () => handleRemoveCustomToken(token.address)}
                    batchedValue={batchValueByAddress.get(token.address.toLowerCase())}
                    batchedError={batchErrorByAddress.get(token.address.toLowerCase())}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
