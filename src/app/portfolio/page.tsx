'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import TokenIcon from '@/components/ui/TokenIcon';
import { KNOWN_WRAPPERS, type WrapperPair } from '@/config/contracts';
import { formatAmount, formatAddress } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useAccount, useConnect } from 'wagmi';
import { useConfidentialBalance, useRevokeSession } from '@zama-fhe/react-sdk';
import { useToast } from '@/components/ui/Toast';
import BlurIn from '@/components/ui/BlurIn';
import {
  Lock,
  Unlock,
  Info,
  Shield,
  Wallet,
  RefreshCw,
} from 'lucide-react';

interface TokenPositionProps {
  wrapper: WrapperPair;
  isConnected: boolean;
  address: `0x${string}` | undefined;
  triggerDecrypt: boolean;
  resetKey: number;
  onDecryptSuccess: (symbol: string, balance: bigint) => void;
}

function TokenPositionCard({
  wrapper,
  isConnected,
  address,
  triggerDecrypt,
  resetKey,
  onDecryptSuccess,
}: TokenPositionProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const { addToast } = useToast();

  // Reset enable status when resetKey changes
  useEffect(() => {
    setIsEnabled(false);
  }, [resetKey]);

  // Zama Official useConfidentialBalance hook (handles EIP-712 permit signing & decryption for this token)
  const {
    data: decryptedBalance,
    isLoading: isDecrypting,
    error: decryptError,
  } = useConfidentialBalance(
    { tokenAddress: wrapper.erc7984Address },
    { enabled: isConnected && isEnabled }
  );

  const handleDecrypt = () => {
    if (!address) return;
    setIsEnabled(true);
    addToast({
      variant: 'info',
      title: `Decrypting ${wrapper.symbol}`,
      message: 'Requesting decryption permit. Please sign in your wallet if prompted.',
    });
  };

  // Sync trigger from parent (for Decrypt All)
  useEffect(() => {
    if (triggerDecrypt && !isEnabled && isConnected) {
      setIsEnabled(true);
    }
  }, [triggerDecrypt, isEnabled, isConnected]);

  // Report balance updates to parent
  useEffect(() => {
    if (decryptedBalance !== undefined && decryptedBalance !== null) {
      onDecryptSuccess(wrapper.symbol, decryptedBalance);
    }
  }, [decryptedBalance, wrapper.symbol, onDecryptSuccess]);

  const isDecrypted = decryptedBalance !== undefined && decryptedBalance !== null;

  return (
    <Card variant="glass" padding="md" hover>
      {/* Token Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--sp-5)' }}>
        <TokenIcon symbol={wrapper.symbol} size={32} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{wrapper.name}</div>
          <div className="text-xs text-muted">
            c{wrapper.symbol} · {formatAddress(wrapper.erc7984Address)}
          </div>
        </div>
        <Badge variant="accent" style={{ marginLeft: 'auto' }}>
          ERC-7984
        </Badge>
      </div>

      {/* Balance Display */}
      <div
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-4) var(--sp-5)',
          marginBottom: 'var(--sp-4)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-xs text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
          Confidential Balance
        </div>
        {isDecrypting ? (
          <div className="flex items-center gap-3">
            <Skeleton width="120px" height="28px" />
            <span className="text-xs text-muted">Awaiting Permit...</span>
          </div>
        ) : decryptError ? (
          <div className="text-xs text-danger" style={{ wordBreak: 'break-word' }}>
            Error: {decryptError.message || 'Decryption failed. Ensure the wrapper is deployed.'}
          </div>
        ) : isDecrypted ? (
          <div className="flex items-end gap-2">
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {formatAmount(decryptedBalance ?? 0n, wrapper.decimals)}
            </span>
            <span className="text-muted" style={{ marginBottom: '3px' }}>
              c{wrapper.symbol}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 'var(--text-2xl)',
                  letterSpacing: '2px',
                  color: 'var(--text-muted)',
                  fontWeight: 800,
                  transform: 'translateY(2px)',
                }}
              >
                ••••••
              </span>
              <Badge variant="default" style={{ gap: '4px' }}>
                <Lock size={10} /> Encrypted
              </Badge>
            </div>
            <span className="text-xs text-muted">
              Decrypt to View
            </span>
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
            onClick={handleDecrypt}
            style={{ gap: '6px' }}
          >
            <Unlock size={14} /> Decrypt Balance
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => (window.location.href = `/wrap?token=${wrapper.symbol}&action=unwrap`)}
            >
              Unshield
            </Button>
            <Button variant="ghost" fullWidth size="sm" onClick={handleDecrypt} style={{ gap: '4px' }}>
              <Unlock size={12} /> Decrypt Again
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export default function PortfolioPage() {
  const { activeChainId } = useActiveNetwork();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { addToast } = useToast();

  const wrappers = useMemo(() => KNOWN_WRAPPERS[activeChainId] ?? [], [activeChainId]);

  const [decryptedBalances, setDecryptedBalances] = useState<Record<string, bigint>>({});
  const [decryptTriggers, setDecryptTriggers] = useState<Record<string, boolean>>({});
  const [resetKey, setResetKey] = useState(0);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleDecryptSuccess = (symbol: string, balance: bigint) => {
    setDecryptedBalances(prev => ({ ...prev, [symbol.toLowerCase()]: balance }));
  };

  // Staggered batch decryption of all wrappers to prevent FHE worker concurrent initialization race conditions
  const handleDecryptAll = async () => {
    if (!address) return;
    addToast({
      variant: 'info',
      title: 'Decrypting All Balances',
      message: 'Processing batch decryption with staggered activation to prevent FHE worker concurrent load issues.',
    });
    
    for (let i = 0; i < wrappers.length; i++) {
      const w = wrappers[i];
      setDecryptTriggers(prev => ({ ...prev, [w.symbol.toLowerCase()]: true }));
      // Stagger by 600ms
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  };

  // Hook to revoke the session/clear permit signatures from the Zama SDK's cache
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession({
    onSuccess: () => {
      setDecryptedBalances({});
      setDecryptTriggers({});
      setResetKey(prev => prev + 1);
      addToast({
        variant: 'success',
        title: 'Decryption Session Reset',
        message: 'All cached FHE permits have been cleared. Future decryptions will prompt for wallet signatures.',
      });
    },
    onError: (err: any) => {
      console.error('Error revoking session:', err);
      addToast({
        variant: 'error',
        title: 'Reset Failed',
        message: err.message || 'Failed to revoke decryption session.',
      });
    },
  });

  const totalDecrypted = Object.keys(decryptedBalances).length;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header">
        <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
          <div>
            <h1>
              <BlurIn text="Confidential Portfolio" duration={600} />
            </h1>
            <p style={{ marginTop: 'var(--sp-2)' }}>
              <BlurIn
                text="View and securely decrypt your on-chain ERC-7984 confidential balances using cryptographic permits."
                duration={800}
                delay={200}
              />
            </p>
          </div>
          <div className="flex gap-2">
            {isConnected && totalDecrypted > 0 && (
              <Button
                variant="secondary"
                onClick={() => revokeSession()}
                isLoading={isRevoking}
                style={{ gap: '6px' }}
              >
                <RefreshCw size={14} className={isRevoking ? 'animate-spin' : ''} /> Reset Session
              </Button>
            )}
            {isConnected && wrappers.length > 0 && totalDecrypted < wrappers.length && (
              <Button variant="primary" onClick={handleDecryptAll} style={{ gap: '6px' }}>
                <Unlock size={14} /> Decrypt All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {isConnected && totalDecrypted > 0 && (
        <Card variant="accent" padding="lg" style={{ marginBottom: 'var(--sp-8)' }} className="animate-slide-up">
          <div className="text-sm text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
            Decrypted Balances
          </div>
          <div className="flex items-end gap-3">
            <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 800 }} className="text-gradient">
              {totalDecrypted}
            </span>
            <span className="text-muted" style={{ marginBottom: '6px' }}>
              / {wrappers.length} assets decrypted
            </span>
          </div>
        </Card>
      )}

      {/* Wallet Not Connected State */}
      {!isConnected ? (
        <div className="empty-state card" style={{ padding: 'var(--sp-12) var(--sp-8)' }}>
          <div className="empty-state-icon" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <Wallet size={48} />
          </div>
          <h3 style={{ marginBottom: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>Connect Wallet</h3>
          <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto var(--sp-6)' }}>
            Please connect your Web3 wallet to read on-chain balances and request cryptographic decryption permits.
          </p>
          <Button variant="primary" onClick={() => setIsConnectModalOpen(true)}>
            Connect Wallet
          </Button>
        </div>
      ) : (
        /* Token Positions Grid */
        <div className="grid grid-2 gap-4">
          {wrappers.map((wrapper) => {
            const symbolLower = wrapper.symbol.toLowerCase();
            return (
              <TokenPositionCard
                key={wrapper.symbol}
                wrapper={wrapper}
                isConnected={isConnected}
                address={address}
                triggerDecrypt={!!decryptTriggers[symbolLower]}
                resetKey={resetKey}
                onDecryptSuccess={handleDecryptSuccess}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {isConnected && wrappers.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <Shield size={48} />
          </div>
          <h3 style={{ marginBottom: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>No Registered Tokens</h3>
          <p className="text-muted">
            There are no wrappers registered on this chain yet. Try switching to Sepolia.
          </p>
        </div>
      )}

      {/* Info */}
      <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-8)' }}>
        <div className="flex items-start gap-3 text-xs text-muted">
          <div style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', marginTop: '2px' }}>
            <Info size={16} />
          </div>
          <span style={{ lineHeight: '1.4' }}>
            Decrypting balances requires an EIP-712 signature (permit) to verify you are the account owner. 
            This creates an ephemeral session key that decrypts the on-chain ciphertext handle. 
            Your private key never leaves your device, and cleartext balances are never transmitted.
            Permits are securely cached in your browser; use the <strong>Reset Session</strong> button to clear cached permits and force wallet signature prompts.
          </span>
        </div>
      </Card>

      {/* Connect Wallet Modal */}
      {isConnectModalOpen && (
        <Modal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          title="Connect Wallet"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="text-sm text-muted">Select a wallet:</div>
            {connectors.map((c) => (
              <button
                key={c.id}
                className="btn btn-secondary btn-full"
                onClick={() => {
                  connect({ connector: c });
                  setIsConnectModalOpen(false);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
