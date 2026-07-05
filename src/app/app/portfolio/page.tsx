'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TokenIcon from '@/components/ui/TokenIcon';
import WalletActivityFeed from '@/components/WalletActivityFeed';
import { type WrapperPair } from '@/config/contracts';
import { type CustomPairRecord } from '@/lib/registry';
import { formatAmount, formatAddress } from '@/lib/utils';
import { classifyError } from '@/lib/errors';
import PendingUnshieldBanner from '@/components/PendingUnshieldBanner';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useRegistryPairs } from '@/lib/registry';
import { useAccount, useConnect } from 'wagmi';
import { useConfidentialBalances, useConfidentialBalance } from '@zama-fhe/react-sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useSessionReset } from '@/lib/reset-session';
import BlurIn from '@/components/ui/BlurIn';
import {
  Lock,
  Unlock,
  Info,
  Shield,
  Wallet,
  RefreshCw,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

// ── Official wrapper card ────────────────────────────────────────────────────

interface TokenPositionProps {
  wrapper: WrapperPair;
  isConnected: boolean;
  isDecrypted: boolean;
  isDecrypting: boolean;
  decryptedBalance: bigint | undefined;
  decryptError: Error | null;
  onDecrypt: () => void;
  /** When true, shows Unshield + Decrypt Again; when false only Decrypt. */
  isConfidentialOnly?: boolean;
}

function TokenPositionCard({
  wrapper,
  isConnected,
  isDecrypted,
  isDecrypting,
  decryptedBalance,
  decryptError,
  onDecrypt,
  isConfidentialOnly = false,
}: TokenPositionProps) {
  return (
    <Card variant="glass" padding="md" hover>
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--sp-4)' }}>
        <TokenIcon symbol={wrapper.symbol} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>{wrapper.name}</div>
          <div className="text-xs text-muted">
            c{wrapper.symbol} · {formatAddress(wrapper.erc7984Address)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Badge variant="default" style={{ fontSize: 10 }}>ERC-7984</Badge>
          {isConfidentialOnly && (
            <Badge variant="default" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Decrypt only
            </Badge>
          )}
        </div>
      </div>

      {/* Balance Display */}
      <div
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-3)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-xs text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
          Confidential Balance
        </div>
        {isDecrypting ? (
          <div className="flex items-center gap-3">
            <div className="spinner spinner-sm" />
            <span className="text-xs text-muted">Awaiting permit…</span>
          </div>
        ) : decryptError ? (
          <div className="text-xs" style={{ color: 'var(--color-danger, #ef4444)', wordBreak: 'break-word' }}>
            {decryptError.message || 'Decryption failed.'}
          </div>
        ) : isDecrypted ? (
          <div className="flex items-end gap-2">
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {formatAmount(decryptedBalance ?? 0n, wrapper.wrapperDecimals)}
            </span>
            <span className="text-muted" style={{ marginBottom: 3 }}>c{wrapper.symbol}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 'var(--text-xl)', letterSpacing: '2px', color: 'var(--text-muted)', fontWeight: 800 }}>
                ••••••
              </span>
              <Badge variant="default" style={{ gap: 4 }}>
                <Lock size={9} /> Encrypted
              </Badge>
            </div>
            <span className="text-xs text-muted">Click to decrypt</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isDecrypted ? (
          <Button
            variant="primary"
            fullWidth
            isLoading={isDecrypting}
            disabled={!isConnected}
            onClick={onDecrypt}
            style={{ gap: 6 }}
          >
            <Unlock size={13} /> Decrypt Balance
          </Button>
        ) : (
          <>
            {!isConfidentialOnly && (
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                onClick={() => (window.location.href = `/app/wrapper?token=${wrapper.symbol}&action=unwrap`)}
              >
                Unshield
              </Button>
            )}
            <Button variant="ghost" fullWidth size="sm" onClick={onDecrypt} style={{ gap: 4 }}>
              <Unlock size={11} /> Refresh
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

// ── Confidential-only per-row decrypt (singular hook, one per card) ──────────

function ConfidentialOnlyCard({
  record,
  isConnected,
  resetToken,
}: {
  record: CustomPairRecord;
  isConnected: boolean;
  resetToken: number;
}) {
  const [decryptRequested, setDecryptRequested] = useState(false);

  const {
    data: balance,
    isLoading,
    error,
  } = useConfidentialBalance(
    { tokenAddress: record.erc7984Address as `0x${string}` },
    {
      enabled: decryptRequested && isConnected,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Reset on app-wide session reset
  useEffect(() => {
    if (resetToken > 0) setDecryptRequested(false);
  }, [resetToken]);

  const wrapper: WrapperPair = {
    erc20Address: record.erc20Address as `0x${string}`,
    erc7984Address: record.erc7984Address as `0x${string}`,
    symbol: record.symbol,
    name: record.name,
    decimals: record.decimals,
    wrapperDecimals: record.wrapperDecimals,
    source: 'custom',
    isWrapper: false,
  };

  return (
    <TokenPositionCard
      wrapper={wrapper}
      isConnected={isConnected}
      isDecrypted={balance !== undefined && balance !== null}
      isDecrypting={isLoading}
      decryptedBalance={balance ?? undefined}
      decryptError={error as Error | null}
      onDecrypt={() => setDecryptRequested(true)}
      isConfidentialOnly
    />
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { activeChainId } = useActiveNetwork();
  const { address, isConnected, chain: walletChain } = useAccount();
  const { connect, connectors } = useConnect();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { reset: resetSession, isResetting: isRevoking, resetToken } = useSessionReset();

  const { pairs, localRecords } = useRegistryPairs(activeChainId);

  // Official pairs = registry + config-file (never localStorage custom)
  const officialWrappers = useMemo(() => pairs.filter((p) => p.source !== 'custom'), [pairs]);
  // Custom wrapper pairs (isWrapper:true — has ERC-20 underlying, can unshield)
  const customWrapperPairs = useMemo(() => pairs.filter((p) => p.source === 'custom'), [pairs]);
  // Confidential-only custom pairs (isWrapper:false — no underlying, decrypt only)
  const customConfOnly = useMemo(() => localRecords.filter((r) => r.isWrapper === false), [localRecords]);

  // All pairs passed to the activity feed (official + custom wrappers)
  const allWrappers = useMemo(() => pairs, [pairs]);

  const [requestedAddresses, setRequestedAddresses] = useState<`0x${string}`[]>([]);
  const [resolvedBalances, setResolvedBalances] = useState<Record<string, bigint>>({});
  const [resolvedErrors, setResolvedErrors] = useState<Record<string, Error>>({});
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [fheWorkerFailed, setFheWorkerFailed] = useState(false);

  const resolvedBalancesRef = useRef(resolvedBalances);
  useEffect(() => { resolvedBalancesRef.current = resolvedBalances; }, [resolvedBalances]);

  const lastHandledErrorMsgRef = useRef<string | null>(null);
  const autoRevokedForMsgRef = useRef<string | null>(null);
  const revokeSessionRef = useRef<(() => void) | null>(null);

  const supportedChain =
    !isConnected || !walletChain || walletChain.id === 11155111 || walletChain.id === 1;

  const {
    data: decryptedBalances,
    isLoading: isDecryptingAll,
    error: globalError,
  } = useConfidentialBalances(
    { tokenAddresses: requestedAddresses },
    {
      enabled: isConnected && supportedChain && requestedAddresses.length > 0,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!decryptedBalances) return;
    setResolvedBalances((prev) => {
      const next = { ...prev };
      if (decryptedBalances.results instanceof Map) {
        for (const [key, val] of decryptedBalances.results.entries()) {
          if (val != null) next[key.toLowerCase()] = val;
        }
      } else if (decryptedBalances.results) {
        for (const [key, val] of Object.entries(decryptedBalances.results)) {
          if (val != null) next[key.toLowerCase()] = val as bigint;
        }
      }
      return next;
    });
    setResolvedErrors((prev) => {
      const next = { ...prev };
      if (decryptedBalances.results instanceof Map) {
        for (const [key] of decryptedBalances.results.entries()) delete next[key.toLowerCase()];
      }
      if (decryptedBalances.errors instanceof Map) {
        for (const [key, val] of decryptedBalances.errors.entries()) {
          if (val) next[key.toLowerCase()] = val;
        }
      }
      return next;
    });
  }, [decryptedBalances]);

  useEffect(() => {
    if (!globalError) { lastHandledErrorMsgRef.current = null; return; }
    const msg = globalError.message ?? '';
    if (msg === lastHandledErrorMsgRef.current) return;
    lastHandledErrorMsgRef.current = msg;
    const classified = classifyError(globalError);
    const isStalePermit =
      classified.title === 'Decryption Failed' ||
      classified.title === 'Session Expired' ||
      classified.title === 'Session Key Rejected' ||
      classified.title === 'Balance Check Unavailable';

    if (classified.title === 'Configuration Error' || classified.title === 'Relayer Unavailable') {
      setFheWorkerFailed(true);
      addToast({ variant: 'error', title: classified.title, message: classified.message });
    } else if (isStalePermit && autoRevokedForMsgRef.current !== msg) {
      autoRevokedForMsgRef.current = msg;
      try { revokeSessionRef.current?.(); } catch { /* best-effort */ }
      addToast({ variant: 'info', title: 'Session Permit Refreshed', message: 'Cached permit was stale — cleared. Click Decrypt again.' });
    } else {
      addToast({ variant: 'error', title: classified.title, message: classified.message });
    }
    queryClient.removeQueries({ queryKey: ['zama.confidentialBalances'] });
    queryClient.removeQueries({ queryKey: ['zama.confidentialBalance'] });
    setRequestedAddresses((prev) =>
      prev.filter((addr) => resolvedBalancesRef.current[addr.toLowerCase()] !== undefined),
    );
  }, [globalError, addToast, queryClient]);

  const handleDecryptToken = (tokenAddress: `0x${string}`, symbol: string) => {
    const lower = tokenAddress.toLowerCase();
    setResolvedErrors((prev) => { const n = { ...prev }; delete n[lower]; return n; });
    setFheWorkerFailed(false);
    lastHandledErrorMsgRef.current = null;
    queryClient.resetQueries({ queryKey: ['zama.confidentialBalances'] });
    if (!requestedAddresses.some((a) => a.toLowerCase() === lower)) {
      setRequestedAddresses((prev) => [...prev, tokenAddress]);
      addToast({ variant: 'info', title: `Decrypting ${symbol}`, message: 'Sign the EIP-712 permit in your wallet.' });
    }
  };

  const handleDecryptAll = () => {
    if (!address) return;
    setResolvedErrors({});
    setFheWorkerFailed(false);
    lastHandledErrorMsgRef.current = null;
    queryClient.resetQueries({ queryKey: ['zama.confidentialBalances'] });
    // Batch includes official + custom wrapper pairs (conf-only have their own per-card hook)
    const allAddresses = [...officialWrappers, ...customWrapperPairs].map((w) => w.erc7984Address);
    setRequestedAddresses(allAddresses);
    addToast({ variant: 'info', title: 'Decrypting Portfolio', message: 'One batch EIP-712 permit for all assets.' });
  };

  useEffect(() => {
    revokeSessionRef.current = () => { void resetSession({ silent: true }); };
  }, [resetSession]);

  useEffect(() => {
    if (resetToken === 0) return;
    setRequestedAddresses([]);
    setResolvedBalances({});
    setResolvedErrors({});
    setFheWorkerFailed(false);
    autoRevokedForMsgRef.current = null;
    lastHandledErrorMsgRef.current = null;
  }, [resetToken]);

  const totalDecrypted = Object.keys(resolvedBalances).length;
  const batchableCount = officialWrappers.length + customWrapperPairs.length;

  function rowProps(wrapper: WrapperPair) {
    const lower = wrapper.erc7984Address.toLowerCase();
    return {
      isDecrypted: resolvedBalances[lower] !== undefined,
      decryptError: resolvedErrors[lower] || null,
      isDecrypting:
        requestedAddresses.some((a) => a.toLowerCase() === lower) &&
        resolvedBalances[lower] === undefined &&
        !resolvedErrors[lower],
      decryptedBalance: resolvedBalances[lower],
      onDecrypt: () => handleDecryptToken(wrapper.erc7984Address, wrapper.symbol),
    };
  }

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header">
        <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div>
            <h1><BlurIn text="Confidential Portfolio" duration={600} /></h1>
            <p style={{ marginTop: 'var(--sp-2)' }}>
              <BlurIn text="View and decrypt your ERC-7984 encrypted balances with cryptographic permits." duration={800} delay={200} />
            </p>
          </div>
          <div className="flex gap-2">
            {isConnected && (
              <Button variant="secondary" onClick={() => { void resetSession(); }} isLoading={isRevoking} style={{ gap: 6 }}>
                <RefreshCw size={13} className={isRevoking ? 'animate-spin' : ''} /> Reset Session
              </Button>
            )}
            {isConnected && batchableCount > 0 && totalDecrypted < batchableCount && (
              <Button variant="primary" onClick={handleDecryptAll} isLoading={isDecryptingAll} style={{ gap: 6 }}>
                <Unlock size={13} /> Decrypt All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {isConnected && totalDecrypted > 0 && (
        <Card variant="accent" padding="lg" style={{ marginBottom: 'var(--sp-8)' }} className="animate-slide-up">
          <div className="text-sm text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Decrypted Balances</div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 800 }} className="text-gradient">
              {totalDecrypted}
            </span>
            <span className="text-muted" style={{ marginBottom: 6 }}>/ {batchableCount} assets decrypted</span>
          </div>
        </Card>
      )}

      {/* Not connected */}
      {!isConnected ? (
        <div className="empty-state card" style={{ padding: 'var(--sp-12) var(--sp-8)' }}>
          <div className="empty-state-icon" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
            <Wallet size={48} />
          </div>
          <h3 style={{ marginBottom: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>Connect Wallet</h3>
          <p className="text-muted" style={{ maxWidth: 400, margin: '0 auto var(--sp-6)' }}>
            Connect your Web3 wallet to view and decrypt confidential balances.
          </p>
          <Button variant="primary" onClick={() => setIsConnectModalOpen(true)}>Connect Wallet</Button>
        </div>
      ) : (
        <>
          {/* Pending unshield banners */}
          {officialWrappers.map((w) => (
            <PendingUnshieldBanner key={`pending-${w.erc7984Address}`} tokenAddress={w.erc7984Address} symbol={`c${w.symbol}`} />
          ))}

          {/* Unsupported chain */}
          {!supportedChain && (
            <div style={{ display: 'flex', gap: 'var(--sp-3)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))', border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)', marginBottom: 'var(--sp-6)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--warning)', marginBottom: 4 }}>Unsupported Chain</div>
                <div className="text-xs text-muted">Switch your wallet to Sepolia or Mainnet.</div>
              </div>
            </div>
          )}

          {/* FHE worker error */}
          {fheWorkerFailed && (
            <div style={{ display: 'flex', gap: 'var(--sp-3)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))', border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)', marginBottom: 'var(--sp-6)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--warning)', marginBottom: 4 }}>Zama Relayer Unavailable</div>
                <div className="text-xs text-muted">FHE network temporarily unreachable. Wait and try again.</div>
              </div>
            </div>
          )}

          {/* ── Official — Zama Registry ────────────────────────────────── */}
          {officialWrappers.length > 0 && (
            <div style={{ marginBottom: 'var(--sp-8)' }}>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>
                  Official Registry
                </h2>
                <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                  Verified on-chain ERC-20 ↔ ERC-7984 wrapper pairs. Supports shield, unshield, and decrypt.
                </p>
              </div>
              <div className="grid grid-2 gap-4">
                {officialWrappers.map((wrapper) => (
                  <TokenPositionCard
                    key={wrapper.erc7984Address}
                    wrapper={wrapper}
                    isConnected={isConnected}
                    {...rowProps(wrapper)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Custom wrapper pairs ────────────────────────────────────── */}
          {customWrapperPairs.length > 0 && (
            <div style={{ marginBottom: 'var(--sp-8)' }}>
              <div style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={15} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
                    Custom Wrappers
                  </h2>
                  <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                    Locally-added wrapper pairs. Supports shield, unshield, and decrypt.
                  </p>
                </div>
              </div>
              <div className="grid grid-2 gap-4">
                {customWrapperPairs.map((wrapper) => (
                  <TokenPositionCard
                    key={wrapper.erc7984Address}
                    wrapper={wrapper}
                    isConnected={isConnected}
                    {...rowProps(wrapper)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Custom confidential-only tokens ────────────────────────── */}
          {customConfOnly.length > 0 && (
            <div style={{ marginBottom: 'var(--sp-8)' }}>
              <div style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={15} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, margin: 0 }}>
                    Custom Decrypt-Only
                  </h2>
                  <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                    Confidential tokens with no ERC-20 underlying. Decrypt only — no shield/unshield.
                  </p>
                </div>
              </div>
              <div className="grid grid-2 gap-4">
                {customConfOnly.map((record) => (
                  <ConfidentialOnlyCard
                    key={record.erc7984Address}
                    record={record}
                    isConnected={isConnected}
                    resetToken={resetToken}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No tokens at all */}
          {officialWrappers.length === 0 && customWrapperPairs.length === 0 && customConfOnly.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                <Shield size={48} />
              </div>
              <h3 style={{ marginBottom: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>No Tokens</h3>
              <p className="text-muted">No registered tokens on this chain. Try switching to Sepolia.</p>
            </div>
          )}
        </>
      )}

      {/* Activity feed */}
      {isConnected && address && supportedChain && allWrappers.length > 0 && (
        <WalletActivityFeed address={address} wrappers={allWrappers} chainId={activeChainId} variant="full" />
      )}

      {/* Info */}
      <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-8)' }}>
        <div className="flex items-start gap-3 text-xs text-muted">
          <div style={{ color: 'var(--accent)', display: 'inline-flex', marginTop: 2 }}>
            <Info size={15} />
          </div>
          <span style={{ lineHeight: 1.5 }}>
            Decrypting balances requires an EIP-712 permit — a read-only off-chain signature that authorises the Zama Gateway to decrypt your balance for this session.
            Your private key never leaves your device. Use <strong>Reset Session</strong> to clear cached permits and force fresh signatures.
          </span>
        </div>
      </Card>

      {/* Connect modal */}
      {isConnectModalOpen && (
        <Modal isOpen title="Connect Wallet" onClose={() => setIsConnectModalOpen(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="text-sm text-muted">Select a wallet:</div>
            {connectors.map((c) => (
              <button key={c.id} className="btn btn-secondary btn-full" onClick={() => { connect({ connector: c }); setIsConnectModalOpen(false); }}>
                {c.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
