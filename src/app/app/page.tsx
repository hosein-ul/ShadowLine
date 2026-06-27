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
import { useRegistryPairs, isMintablePair, type RegistryPairsResult } from '@/lib/registry';
import { type WrapperPair } from '@/config/contracts';
import { ERC20_ABI, WRAPPER_ABI } from '@/lib/wrapper-abi';
import BlurIn from '@/components/ui/BlurIn';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useConfidentialBalance, useAllow } from '@zama-fhe/react-sdk';
import { useWalletErc7984Scan } from '@/lib/use-wallet-scan';
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

  const { mutateAsync: allow } = useAllow();

  const handleDecrypt = async () => {
    try {
      await allow([wrapper.erc7984Address]);
      setDecryptRequested(true);
      refetchConfidential();
    } catch (err) {
      console.error('Signature failed or rejected:', err);
    }
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
              {wrapper.source === 'custom' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Badge variant="warning" size="sm" style={{ fontSize: 9, gap: 2 }}>
                    <Settings2 size={8} /> Custom
                  </Badge>
                  <Tooltip content={wrapper.note ?? 'This pair is declared in the local config (src/config/custom-pairs.ts), not the official on-chain registry.'} />
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
            <Badge variant="default" size="sm" style={{ gap: 3, alignSelf: 'flex-start' }}>
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
              style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {formatAddress(wrapper.erc7984Address, 6)}
              <ExternalLink size={11} />
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
            <Link href={`/app/wrap?token=${wrapper.symbol}&action=wrap`}>
              <Button variant="primary" size="sm" style={{ gap: 4 }} aria-label={`Shield ${wrapper.symbol}`}>
                <Shield size={12} /> Shield
              </Button>
            </Link>
            <Tooltip content={TIP.shield(wrapper.symbol)} />
            <Link href={`/app/wrap?token=${wrapper.symbol}&action=unwrap`}>
              <Button variant="secondary" size="sm" aria-label={`Unshield ${confidentialSymbol}`}>
                Unshield
              </Button>
            </Link>
            <Tooltip content={TIP.unshield(wrapper.symbol)} />
            <Link href={`/app/wrap?token=${wrapper.symbol}`}>
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

// ─── Detected Token Row (For Wallet Scan Auto-Detection) ──────────────────────

function DetectedTokenRow({
  token,
  explorerBase,
  onRemove,
}: {
  token: any;
  explorerBase: string;
  onRemove?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);

  // 1. Try to read underlyingToken from the ERC-7984 contract
  const { data: rawUnderlyingAddress } = useReadContract({
    abi: WRAPPER_ABI,
    address: token.address,
    functionName: 'underlyingToken',
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

  // 3. Confidential balance — only decrypted on explicit user action
  const {
    data: confidentialBalance,
    isLoading: isDecrypting,
    error: decryptError,
    refetch: refetchConfidential,
  } = useConfidentialBalance(
    { tokenAddress: token.address },
    { enabled: decryptRequested && isConnected && !!address },
  );

  const cleanName = token.name.replace(/\s*\(Mock\)\s*/gi, '').trim();
  const confidentialSymbol = `c${token.symbol}`;

  const { mutateAsync: allow } = useAllow();

  const handleDecrypt = async () => {
    try {
      await allow([token.address]);
      setDecryptRequested(true);
      refetchConfidential();
    } catch (err) {
      console.error('Signature failed or rejected:', err);
    }
  };

  return (
    <tr style={{ borderLeft: token.isAutoDetected ? '3px solid var(--accent, #FFD208)' : '3px solid #8b5cf6' }}>
      {/* ── Token ─────────────────────────────────────────────────────────── */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TokenIcon symbol={token.symbol} size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {cleanName}
              <Badge variant={token.isAutoDetected ? 'warning' : 'accent'} size="sm" style={{ fontSize: 9 }}>
                {token.isAutoDetected ? 'Detected' : 'Custom'}
              </Badge>
            </div>
            <div className="text-muted text-xs">{token.symbol}</div>
          </div>
        </div>
      </td>

      {/* ── ERC-20 Address ────────────────────────────────────────────────── */}
      <td>
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
          <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>
            Native FHE Asset
          </span>
        )}
      </td>

      {/* ── ERC-7984 Wrapper ──────────────────────────────────────────────── */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
          <div className="text-xs text-muted">{confidentialSymbol}</div>
        </div>
      </td>

      {/* ── Public Balance ────────────────────────────────────────────────── */}
      <td>
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
      </td>

      {/* ── Confidential Balance ──────────────────────────────────────────── */}
      <td>
        {!isConnected ? (
          <span className="text-xs text-muted">—</span>
        ) : confidentialBalance !== undefined && confidentialBalance !== null ? (
          <span className="flex items-center gap-1 text-sm">
            {formatAmount(confidentialBalance, token.decimals)}{' '}
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
            aria-label={`Retry decrypt`}
          >
            <AlertCircle size={11} /> Retry
          </button>
        ) : (
          <span className="flex items-center gap-1">
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
          </span>
        )}
      </td>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex justify-end items-center gap-2">
          {isWrapper ? (
            <>
              <Link href={`/app/wrap?token=${token.address}&action=wrap`}>
                <Button variant="primary" size="sm" style={{ gap: 4 }}>
                  <Shield size={12} /> Shield
                </Button>
              </Link>
              <Link href={`/app/wrap?token=${token.address}&action=unwrap`}>
                <Button variant="secondary" size="sm">
                  Unshield
                </Button>
              </Link>
              <Link href={`/app/wrap?token=${token.address}`}>
                <Button variant="ghost" size="sm" style={{ gap: 4 }} title="Manage">
                  <Settings2 size={12} /> Manage
                </Button>
              </Link>
            </>
          ) : (
            <span className="text-xs text-muted" style={{ fontStyle: 'italic', marginRight: '8px' }}>
              Direct Transfer Only
            </span>
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

  const { address, isConnected } = useAccount();
  const client = usePublicClient();

  const registryAddresses = useMemo(() => {
    return new Set(pairs.map((p) => p.erc7984Address.toLowerCase()));
  }, [pairs]);

  const {
    detected,
    extra: detectedExtras,
    status: scanStatus,
    error: scanError,
    rescan,
  } = useWalletErc7984Scan(address, client, registryAddresses);

  // === Persistent Local Custom Tokens state ===
  const [localCustomTokens, setLocalCustomTokens] = useState<any[]>([]);

  // Unique storage key based on active chain ID and user wallet address
  const localStorageKey = useMemo(() => {
    return address ? `zama_custom_tokens_${activeChainId}_${address.toLowerCase()}` : '';
  }, [address, activeChainId]);

  // Load custom tokens from localStorage on chain or account change
  useEffect(() => {
    if (localStorageKey) {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        try {
          setLocalCustomTokens(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing stored custom tokens:', e);
        }
      } else {
        setLocalCustomTokens([]);
      }
    } else {
      setLocalCustomTokens([]);
    }
  }, [localStorageKey]);

  // === Add Custom Token Form States ===
  const [inputAddress, setInputAddress] = useState('');
  const [inputLabel, setInputLabel] = useState('');
  const [addressError, setAddressError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanAddress = inputAddress.trim() as `0x${string}`;
  const isValidAddr = isAddress(cleanAddress);

  // Auto-fetch token metadata from contract
  const { data: symbolData } = useReadContract({
    abi: ERC20_ABI,
    address: isValidAddr ? cleanAddress : undefined,
    functionName: 'symbol',
    query: { enabled: isValidAddr && isConnected },
  });

  const { data: decimalsData } = useReadContract({
    abi: ERC20_ABI,
    address: isValidAddr ? cleanAddress : undefined,
    functionName: 'decimals',
    query: { enabled: isValidAddr && isConnected },
  });

  const { data: nameData } = useReadContract({
    abi: ERC20_ABI,
    address: isValidAddr ? cleanAddress : undefined,
    functionName: 'name',
    query: { enabled: isValidAddr && isConnected },
  });

  // Auto-fill label when symbol resolves
  useEffect(() => {
    if (symbolData) {
      setInputLabel(String(symbolData));
    }
  }, [symbolData]);

  const handleAddCustomToken = () => {
    const addr = inputAddress.trim();
    if (!isAddress(addr)) {
      setAddressError('Invalid address. Must be a 0x hex address (42 characters).');
      return;
    }

    const normalizedAddr = addr.toLowerCase();

    // Prevent duplicates in registry
    if (registryAddresses.has(normalizedAddr)) {
      setAddressError('This token is already part of the official registry.');
      return;
    }

    // Prevent duplicates in local list
    if (localCustomTokens.some((e) => e.address.toLowerCase() === normalizedAddr)) {
      setAddressError('This address has already been added.');
      return;
    }

    setAddressError('');
    const symbol = inputLabel.trim() || String(symbolData ?? 'ERC-7984');
    const name = String(nameData ?? symbol);
    const decimals = typeof decimalsData === 'number' ? decimalsData : (typeof decimalsData === 'bigint' ? Number(decimalsData) : 6);

    const checksummedAddr = getAddress(addr);
    const newToken = { address: checksummedAddr, symbol, name, decimals };
    const updated = [...localCustomTokens, newToken];
    setLocalCustomTokens(updated);

    if (localStorageKey) {
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    }

    setInputAddress('');
    setInputLabel('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemoveCustomToken = (tokenAddress: string) => {
    const updated = localCustomTokens.filter(
      (e) => e.address.toLowerCase() !== tokenAddress.toLowerCase()
    );
    setLocalCustomTokens(updated);
    if (localStorageKey) {
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    }
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

      {/* Auto-Detected & Custom Tokens Section */}
      {isConnected && (
        <div style={{ marginTop: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Custom & Detected Confidential Tokens</span>
                <Badge variant="accent" size="sm">Ecosystem</Badge>
              </h2>
              <p className="text-muted text-xs" style={{ marginTop: 2 }}>
                Scan results from your wallet history and manually registered custom ERC-7984 token contract addresses.
              </p>
            </div>
            {scanStatus !== 'scanning' && (
              <Button variant="ghost" size="sm" onClick={rescan} style={{ gap: 4 }}>
                <RefreshCw size={11} /> Rescan Wallet
              </Button>
            )}
          </div>

          {/* Form to manually register custom tokens */}
          <Card variant="glass" padding="md" style={{ marginBottom: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-xs text-muted" htmlFor="arb-addr">ERC-7984 Contract Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Search size={14} />
                  </span>
                  <input
                    id="arb-addr"
                    ref={inputRef}
                    className="input"
                    style={{ paddingLeft: 36, fontFamily: 'monospace', fontSize: 13 }}
                    placeholder="0x..."
                    value={inputAddress}
                    onChange={(e) => { setInputAddress(e.target.value); setAddressError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomToken()}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                {addressError && (
                  <div className="text-xs" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> {addressError}
                  </div>
                )}
                {isValidAddr && symbolData && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Auto-detected: {String(nameData || symbolData)} ({String(symbolData)}) · {typeof decimalsData === 'number' || typeof decimalsData === 'bigint' ? `${decimalsData} decimals` : ''}
                  </div>
                )}
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-xs text-muted" htmlFor="arb-label">Label (optional)</label>
                <input
                  id="arb-label"
                  className="input"
                  placeholder={String(symbolData ?? 'Token symbol')}
                  value={inputLabel}
                  onChange={(e) => setInputLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomToken()}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="text-xs text-muted" style={{ visibility: 'hidden' }}>Add</div>
                <Button
                  variant="primary"
                  onClick={handleAddCustomToken}
                  disabled={!isConnected || !inputAddress.trim()}
                  style={{ gap: 6, height: '42px' }}
                >
                  <Plus size={14} /> Add Token
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-muted" style={{ marginTop: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(245,158,11,0.04)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={12} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
              <span>Only add contract addresses you trust. Plaintext balances and transfers are kept secure Homomorphically, but custom wrappers must implement ERC-7984.</span>
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
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">ERC-20 Address</th>
                    <th scope="col">ERC-7984 Address</th>
                    <th scope="col">Public Balance</th>
                    <th scope="col">Confidential Balance</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCustomTokens.map((token) => (
                    <DetectedTokenRow
                      key={token.address}
                      token={token}
                      explorerBase={explorerBase}
                      onRemove={token.isAutoDetected ? undefined : () => handleRemoveCustomToken(token.address)}
                    />
                  ))}
                </tbody>
              </table>
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
