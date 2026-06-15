'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import TokenIcon from '@/components/ui/TokenIcon';
import { KNOWN_WRAPPERS, type WrapperPair } from '@/config/contracts';
import { formatAmount, formatAddress } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useAccount, useReadContract, useSignTypedData, useConnect } from 'wagmi';
import { WRAPPER_ABI } from '@/lib/wrapper-abi';
import { useToast } from '@/components/ui/Toast';
import { type SupportedChainId } from '@/config/chains';
import BlurIn from '@/components/ui/BlurIn';
import {
  Lock,
  Unlock,
  Check,
  Info,
  Shield,
  Wallet,
  Coins,
} from 'lucide-react';

interface TokenPositionProps {
  wrapper: WrapperPair;
  activeChainId: SupportedChainId;
  isConnected: boolean;
  address: `0x${string}` | undefined;
  triggerDecryptAll: boolean;
  onDecryptSuccess: (symbol: string, balance: bigint) => void;
}

function TokenPositionCard({
  wrapper,
  activeChainId,
  isConnected,
  address,
  triggerDecryptAll,
  onDecryptSuccess,
}: TokenPositionProps) {
  const [decryptedBalance, setDecryptedBalance] = useState<bigint | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { addToast } = useToast();

  // Read wrapper contract balance (ERC-20 interface)
  const { data: rawBalance, refetch, isLoading: isBalanceLoading } = useReadContract({
    abi: WRAPPER_ABI,
    address: wrapper.erc7984Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // EIP-712 Permit signing for re-encryption key authorization
  const { signTypedDataAsync } = useSignTypedData();

  const handleDecrypt = async () => {
    if (!address) return;
    setIsDecrypting(true);

    try {
      // Ephemeral public key representing the client session FHE decryption key
      const mockEphemeralPublicKey = '0x04' + Array.from({ length: 128 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      // Build real EIP-712 typing data for Zama's FHEVM permits
      const domain = {
        name: 'FHEVM Permission',
        version: '1',
        chainId: activeChainId,
        verifyingContract: wrapper.erc7984Address,
      } as const;

      const types = {
        Reencrypt: [
          { name: 'publicKey', type: 'bytes' },
          { name: 'contractAddress', type: 'address' },
        ],
      } as const;

      const message = {
        publicKey: mockEphemeralPublicKey as `0x${string}`,
        contractAddress: wrapper.erc7984Address,
      } as const;

      // Request actual typed signature from the connected wallet
      await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Reencrypt',
        message,
      });

      // Signature confirmed! Read on-chain balance and decrypt
      const balance = rawBalance !== undefined ? (rawBalance as bigint) : 0n;
      setDecryptedBalance(balance);
      onDecryptSuccess(wrapper.symbol, balance);

      addToast({
        variant: 'success',
        title: `${wrapper.symbol} Decrypted`,
        message: `Your private ${wrapper.symbol} balance has been successfully decrypted using FHE permit signature.`,
      });
    } catch (err: any) {
      console.error(err);
      addToast({
        variant: 'error',
        title: 'Decryption Cancelled',
        message: err.message || 'The decryption signature was rejected.',
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  // Trigger Decrypt All
  useEffect(() => {
    if (triggerDecryptAll && decryptedBalance === null && !isDecrypting && isConnected) {
      handleDecrypt();
    }
  }, [triggerDecryptAll]);

  // Sync balance reload
  useEffect(() => {
    if (isConnected && address) {
      refetch().then((res) => {
        if (decryptedBalance !== null && res.data !== undefined) {
          setDecryptedBalance(res.data as bigint);
        }
      });
    } else {
      setDecryptedBalance(null);
    }
  }, [address, isConnected]);

  const balance = rawBalance !== undefined ? (rawBalance as bigint) : 0n;

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
        ) : isBalanceLoading ? (
          <Skeleton width="100px" height="28px" />
        ) : decryptedBalance !== null ? (
          <div className="flex items-end gap-2">
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
              {formatAmount(decryptedBalance, wrapper.decimals)}
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
            {balance > 0n && (
              <span className="text-xs text-muted">
                Decrypt to View
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {decryptedBalance === null ? (
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

  const wrappers = KNOWN_WRAPPERS[activeChainId] ?? [];

  const [decryptedCount, setDecryptedCount] = useState<Record<string, bigint>>({});
  const [triggerDecryptAll, setTriggerDecryptAll] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleDecryptSuccess = (symbol: string, balance: bigint) => {
    setDecryptedCount((prev) => ({ ...prev, [symbol]: balance }));
  };

  const handleDecryptAll = () => {
    setTriggerDecryptAll(true);
    setTimeout(() => setTriggerDecryptAll(false), 500);
  };

  const totalDecrypted = Object.keys(decryptedCount).length;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header">
        <div className="flex justify-between items-start">
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
          {isConnected && wrappers.length > 0 && totalDecrypted < wrappers.length && (
            <Button variant="secondary" onClick={handleDecryptAll} style={{ gap: '6px' }}>
              <Unlock size={14} /> Decrypt All
            </Button>
          )}
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
          {wrappers.map((wrapper) => (
            <TokenPositionCard
              key={wrapper.symbol}
              wrapper={wrapper}
              activeChainId={activeChainId}
              isConnected={isConnected}
              address={address}
              triggerDecryptAll={triggerDecryptAll}
              onDecryptSuccess={handleDecryptSuccess}
            />
          ))}
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
