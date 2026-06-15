'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TokenIcon from '@/components/ui/TokenIcon';
import { KNOWN_WRAPPERS } from '@/config/contracts';
import { formatAddress, formatAmount, parseAmount } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useToast } from '@/components/ui/Toast';
import {
  useAccount,
  useReadContract,
  useConnect,
} from 'wagmi';
import { useConfidentialBalance, useShield, useUnshield } from '@zama-fhe/react-sdk';
import { ERC20_ABI } from '@/lib/wrapper-abi';
import { sepolia } from 'wagmi/chains';
import BlurIn from '@/components/ui/BlurIn';
import TypingAnimation from '@/components/ui/TypingAnimation';
import confetti from 'canvas-confetti';
import { CHAIN_CONFIG } from '@/config/chains';
import {
  Shield,
  ArrowUpDown,
  Lock,
  Check,
  Info,
  Wallet,
  ExternalLink,
} from 'lucide-react';

function WrapPageContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialAction = (searchParams.get('action') as 'wrap' | 'unwrap') || 'wrap';

  const [action, setAction] = useState<'wrap' | 'unwrap'>(initialAction);
  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [amount, setAmount] = useState('');
  const [txStep, setTxStep] = useState<number>(0); // 0: idle, 1: approve pending, 2: approve mining, 3: action pending, 4: action mining, 5: completed
  const [activeTxHash, setActiveTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [finalTxHash, setFinalTxHash] = useState<string | undefined>(undefined);

  const { activeChainId } = useActiveNetwork();
  const { addToast } = useToast();

  // Wallet Connection Hooks
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const wrappers = KNOWN_WRAPPERS[activeChainId] ?? [];
  const selectedWrapper = wrappers.find(w => w.symbol === selectedToken);

  // Real contract balance reads (Public underlying)
  const { data: rawPublicBalance, refetch: refetchPublicBalance, error: publicBalanceError } = useReadContract({
    abi: ERC20_ABI,
    address: selectedWrapper?.erc20Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedWrapper?.erc20Address,
    },
  });

  // Log public balance read error
  useEffect(() => {
    if (publicBalanceError) {
      console.error('Error reading public balance:', publicBalanceError);
    }
  }, [publicBalanceError]);

  // Real contract balance reads (Confidential FHE)
  const { data: decryptedWrapperBalance, refetch: refetchWrapperBalance } = useConfidentialBalance(
    { tokenAddress: selectedWrapper?.erc7984Address ?? '0x0000000000000000000000000000000000000000' },
    { enabled: !!address && !!selectedWrapper?.erc7984Address }
  );

  // Read allowance
  const { data: rawAllowance, refetch: refetchAllowance } = useReadContract({
    abi: ERC20_ABI,
    address: selectedWrapper?.erc20Address,
    functionName: 'allowance',
    args: address && selectedWrapper ? [address, selectedWrapper.erc7984Address] : undefined,
    query: {
      enabled: !!address && !!selectedWrapper?.erc20Address && !!selectedWrapper?.erc7984Address,
    },
  });

  // Keep balances in sync when address or wrapper changes
  useEffect(() => {
    if (address && selectedWrapper) {
      refetchPublicBalance();
      refetchWrapperBalance();
      refetchAllowance();
    }
  }, [address, selectedWrapper, refetchPublicBalance, refetchWrapperBalance, refetchAllowance]);

  // Zama official Shield/Unshield hooks
  const { mutateAsync: shield } = useShield({
    tokenAddress: selectedWrapper?.erc7984Address ?? '0x0000000000000000000000000000000000000000',
  });

  const { mutateAsync: unshield } = useUnshield({
    tokenAddress: selectedWrapper?.erc7984Address ?? '0x0000000000000000000000000000000000000000',
  });

  const decimals = selectedWrapper?.decimals ?? 18;
  const parsedInputAmount = useMemo(() => {
    if (!amount) return 0n;
    try {
      return parseAmount(amount, decimals);
    } catch {
      return 0n;
    }
  }, [amount, decimals]);

  const hasPublicBalance = rawPublicBalance !== undefined ? (rawPublicBalance as bigint) : 0n;
  const hasWrapperBalance = decryptedWrapperBalance !== undefined && decryptedWrapperBalance !== null ? decryptedWrapperBalance : 0n;
  const hasAllowance = rawAllowance !== undefined ? (rawAllowance as bigint) : 0n;

  const needsApproval = action === 'wrap' && hasAllowance < parsedInputAmount;

  const handleAction = async () => {
    if (!selectedWrapper || !address) return;
    try {
      if (action === 'wrap') {
        setTxStep(1); // Approval confirmation pending
        const res = await shield({
          amount: parsedInputAmount,
          onApprovalSubmitted: (txHash) => {
            setTxStep(2); // Approve mining
            setActiveTxHash(txHash);
            addToast({
              variant: 'info',
              title: 'Approval Submitted',
              message: 'Approve transaction sent. Waiting for confirmation...',
            });
          },
          onShieldSubmitted: (txHash) => {
            setTxStep(4); // Shield mining
            setActiveTxHash(txHash);
            addToast({
              variant: 'info',
              title: 'Shielding Submitted',
              message: 'Shield transaction sent. Waiting for confirmation...',
            });
          },
        });
        
        setFinalTxHash(res.txHash);

        // Success confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        addToast({
          variant: 'success',
          title: 'Shielding Confirmed',
          message: `Successfully wrapped ${amount} ${selectedToken} into confidential c${selectedToken}.`,
        });
        setTxStep(5); // Completed
        refetchPublicBalance();
        refetchWrapperBalance();
        refetchAllowance();
      } else {
        setTxStep(3); // Unshield pending
        const res = await unshield({
          amount: parsedInputAmount,
          onUnwrapSubmitted: (txHash) => {
            setTxStep(4); // Unshield mining
            setActiveTxHash(txHash);
            addToast({
              variant: 'info',
              title: 'Unshielding Submitted',
              message: 'Unshield transaction sent. Waiting for confirmation...',
            });
          },
        });
        
        setFinalTxHash(res.txHash);

        // Success confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        addToast({
          variant: 'success',
          title: 'Unshielding Confirmed',
          message: `Successfully unshielded ${amount} c${selectedToken} into public ${selectedToken}.`,
        });
        setTxStep(5); // Completed
        refetchPublicBalance();
        refetchWrapperBalance();
      }
    } catch (err: any) {
      console.error(err);
      setTxStep(0);
      setActiveTxHash(undefined);
      addToast({
        variant: 'error',
        title: 'Transaction Failed',
        message: err.message || 'The transaction was rejected or failed.',
      });
    }
  };

  const handleToggleAction = () => {
    setAction(prev => (prev === 'wrap' ? 'unwrap' : 'wrap'));
    setAmount('');
    setTxStep(0);
    setActiveTxHash(undefined);
    setFinalTxHash(undefined);
  };

  const isChainMismatch = isConnected && chainId !== activeChainId;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>
          <BlurIn text={action === 'wrap' ? 'Shield' : 'Unshield'} />{' '}
          <TypingAnimation words={['Balances', 'Assets', 'Transactions']} />
        </h1>
        <p style={{ margin: 'var(--sp-2) auto 0' }}>
          {action === 'wrap'
            ? 'Convert public ERC-20 tokens to encrypted ERC-7984 confidential tokens.'
            : 'Convert encrypted ERC-7984 tokens back to public ERC-20 tokens.'}
        </p>
      </div>

      {/* Swap Card */}
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Card variant="accent" padding="lg" className="animate-slide-up">
          {/* From Panel */}
          <div className="swap-panel">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="text-sm text-muted">
                {action === 'wrap' ? 'From (Public)' : 'From (Confidential)'}
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                Balance:{' '}
                {isConnected
                  ? formatAmount(action === 'wrap' ? hasPublicBalance : hasWrapperBalance, decimals)
                  : '0.00'}
                {action === 'wrap' ? (
                  ''
                ) : (
                  <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
                    <Lock size={12} />
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                className="input input-lg"
                placeholder="0.0"
                value={amount}
                disabled={txStep > 0}
                onChange={e => {
                  const v = e.target.value;
                  if (/^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v);
                }}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: 0 }}
              />
              
              {/* Token Display / Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                {selectedToken && <TokenIcon symbol={selectedToken} size={20} />}
                <select
                  className="btn btn-secondary"
                  disabled={txStep > 0}
                  style={{
                    appearance: 'none',
                    padding: 'var(--sp-2) var(--sp-4)',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    minWidth: '110px',
                  }}
                  value={selectedToken}
                  onChange={e => {
                    setSelectedToken(e.target.value);
                    setTxStep(0);
                    setAmount('');
                  }}
                >
                  <option value="">Select Token</option>
                  {wrappers.map(w => (
                    <option key={w.symbol} value={w.symbol}>
                      {w.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedWrapper && (
              <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-2)' }}>
                {action === 'wrap'
                  ? formatAddress(selectedWrapper.erc20Address)
                  : formatAddress(selectedWrapper.erc7984Address)}
              </div>
            )}
          </div>

          {/* Swap Direction Arrow */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="swap-arrow" onClick={handleToggleAction} disabled={txStep > 0}>
              <ArrowUpDown size={16} />
            </button>
          </div>

          {/* To Panel */}
          <div className="swap-panel">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="text-sm text-muted">
                {action === 'wrap' ? 'To (Confidential)' : 'To (Public)'}
              </span>
              <span className="text-xs text-muted">
                Balance:{' '}
                {isConnected
                  ? formatAmount(action === 'wrap' ? hasWrapperBalance : hasPublicBalance, decimals)
                  : '0.00'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="input-lg"
                style={{
                  flex: 1,
                  color: amount ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xl)',
                }}
              >
                {amount || '0.0'}
              </div>
              {selectedToken && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <TokenIcon symbol={selectedToken} size={20} />
                  <Badge variant="accent" size="md" style={{ gap: '4px' }}>
                    {action === 'wrap' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Lock size={12} />
                      </span>
                    )}
                    {action === 'wrap' ? `c${selectedToken}` : selectedToken}
                  </Badge>
                </div>
              )}
            </div>
            {selectedWrapper && (
              <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-2)' }}>
                {action === 'wrap'
                  ? formatAddress(selectedWrapper.erc7984Address)
                  : formatAddress(selectedWrapper.erc20Address)}
              </div>
            )}
          </div>

          {/* Progress Steps */}
          {txStep > 0 && (
            <div style={{ marginTop: 'var(--sp-5)', padding: '0 var(--sp-2)' }}>
              <div className="steps" style={{ justifyContent: 'center' }}>
                {action === 'wrap' && (
                  <>
                    <div className={`step ${txStep >= 2 ? 'completed' : txStep === 1 ? 'active' : ''}`}>
                      <div className="step-dot">{txStep >= 2 ? <Check size={12} /> : '1'}</div>
                      <span className="text-xs">Approve</span>
                    </div>
                    <div className="step-line" />
                  </>
                )}
                <div className={`step ${txStep >= 4 ? 'completed' : txStep === 3 ? 'active' : ''}`}>
                  <div className="step-dot">{txStep >= 4 ? <Check size={12} /> : action === 'wrap' ? '2' : '1'}</div>
                  <span className="text-xs">{action === 'wrap' ? 'Shield' : 'Unshield'}</span>
                </div>
                <div className="step-line" />
                <div className={`step ${txStep === 5 ? 'completed' : ''}`}>
                  <div className="step-dot">{txStep === 5 ? <Check size={12} /> : action === 'wrap' ? '3' : '2'}</div>
                  <span className="text-xs">Done</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Link */}
          {(activeTxHash || finalTxHash) && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: 'var(--sp-4)',
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--sp-2)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="text-xs text-muted" style={{ fontWeight: 500 }}>
                  {txStep === 5
                    ? `${action === 'wrap' ? 'Shield' : 'Unshield'} Successful`
                    : txStep === 2
                    ? 'Approval Pending...'
                    : txStep === 4
                    ? `${action === 'wrap' ? 'Shielding' : 'Unshielding'} Pending...`
                    : 'Transaction Submitted'}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--accent)' }}>
                  {formatAddress(finalTxHash || activeTxHash || '')}
                </span>
              </div>
              <a
                href={`${CHAIN_CONFIG[activeChainId]?.explorerUrl}/tx/${finalTxHash || activeTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 'var(--sp-1.5) var(--sp-3)',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  height: 'auto',
                }}
              >
                View Explorer <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: 'var(--sp-6)' }}>
            {!isConnected ? (
              <Button variant="primary" fullWidth size="lg" onClick={() => setIsConnectModalOpen(true)}>
                Connect Wallet
              </Button>
            ) : isChainMismatch ? (
              <Button variant="danger" fullWidth size="lg" disabled>
                Wrong Network Connection
              </Button>
            ) : txStep === 5 ? (
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={() => {
                  setTxStep(0);
                  setAmount('');
                  setFinalTxHash(undefined);
                  setActiveTxHash(undefined);
                }}
              >
                <Check size={16} /> Complete — Wrap Another
              </Button>
            ) : needsApproval ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={txStep === 1 || txStep === 2}
                disabled={!selectedToken || !amount || amount === '0' || parsedInputAmount > hasPublicBalance}
                onClick={handleAction}
              >
                {parsedInputAmount > hasPublicBalance ? 'Insufficient Balance' : `Approve & Shield ${selectedToken}`}
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={txStep === 3 || txStep === 4}
                disabled={
                  !selectedToken ||
                  !amount ||
                  amount === '0' ||
                  (action === 'wrap' && parsedInputAmount > hasPublicBalance) ||
                  (action === 'unwrap' && parsedInputAmount > hasWrapperBalance)
                }
                onClick={handleAction}
              >
                {!selectedToken
                  ? 'Select Token'
                  : !amount || amount === '0'
                  ? 'Enter Amount'
                  : action === 'wrap'
                  ? parsedInputAmount > hasPublicBalance
                    ? 'Insufficient Balance'
                    : `Shield ${amount} ${selectedToken}`
                  : parsedInputAmount > hasWrapperBalance
                  ? 'Insufficient Shielded Balance'
                  : `Unshield ${amount} c${selectedToken}`}
              </Button>
            )}
          </div>
        </Card>

        {/* Info */}
        <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="flex items-start gap-3 text-xs text-muted">
            <div style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', marginTop: '2px' }}>
              <Info size={16} />
            </div>
            <span style={{ lineHeight: '1.4' }}>
              {action === 'wrap'
                ? 'Shielding wraps your public ERC-20 tokens into encrypted ERC-7984 confidential tokens. Your balance and amounts are encrypted on-chain.'
                : 'Unshielding burns your encrypted wrappers and releases the equivalent underlying ERC-20 tokens back to your public address.'}
            </span>
          </div>
        </Card>
      </div>

      {/* Connect Wallet Modal */}
      {isConnectModalOpen && (
        <Modal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          title="Connect Wallet"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="text-sm text-muted">Select a wallet provider:</div>
            {connectors.map(c => (
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

export default function WrapPage() {
  return (
    <Suspense
      fallback={
        <div className="container animate-fade-in">
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1>
              <span className="text-gradient">Shield Tokens</span>
            </h1>
          </div>
        </div>
      }
    >
      <WrapPageContent />
    </Suspense>
  );
}
