'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { KNOWN_WRAPPERS, REGISTRY_ADDRESSES } from '@/config/contracts';
import { getTokenInfo, getTokenInitials } from '@/config/tokens';
import { formatAddress, formatAmount, parseAmount } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useToast } from '@/components/ui/Toast';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnect,
} from 'wagmi';
import { ERC20_ABI, WRAPPER_ABI } from '@/lib/wrapper-abi';
import { sepolia } from 'wagmi/chains';
import BlurIn from '@/components/ui/BlurIn';
import TypingAnimation from '@/components/ui/TypingAnimation';
import {
  ShieldIcon,
  ArrowDownUpIcon,
  LockIcon,
  UnlockIcon,
  CheckIcon,
  InfoIcon,
} from '@/components/ui/Icons';

function WrapPageContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const initialAction = (searchParams.get('action') as 'wrap' | 'unwrap') || 'wrap';

  const [action, setAction] = useState<'wrap' | 'unwrap'>(initialAction);
  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [amount, setAmount] = useState('');
  const [txStep, setTxStep] = useState<number>(0); // 0: idle, 1: approve tx pending, 2: approve tx mining, 3: action tx pending, 4: action tx mining, 5: completed
  const [activeTxHash, setActiveTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { isTestnet, activeChainId } = useActiveNetwork();
  const { addToast } = useToast();

  // Wallet Connection Hooks
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const wrappers = KNOWN_WRAPPERS[activeChainId] ?? [];
  const selectedWrapper = wrappers.find(w => w.symbol === selectedToken);
  const tokenInfo = selectedToken ? getTokenInfo(selectedToken) : null;

  // Real contract balance reads
  const { data: rawPublicBalance, refetch: refetchPublicBalance } = useReadContract({
    abi: ERC20_ABI,
    address: selectedWrapper?.erc20Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedWrapper?.erc20Address,
    },
  });

  const { data: rawWrapperBalance, refetch: refetchWrapperBalance } = useReadContract({
    abi: WRAPPER_ABI,
    address: selectedWrapper?.erc7984Address,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!selectedWrapper?.erc7984Address,
    },
  });

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

  // Wagmi contract writing hooks
  const { writeContractAsync } = useWriteContract();

  // Transaction mining status
  const { isLoading: isTxMining, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: activeTxHash,
  });

  // Monitor mining status to progress step states
  useEffect(() => {
    if (activeTxHash && isTxSuccess) {
      if (txStep === 2) {
        // Approve success
        addToast({
          variant: 'success',
          title: 'Approval Successful',
          message: 'The token allowance has been successfully approved.',
        });
        refetchAllowance();
        setTxStep(0);
        setActiveTxHash(undefined);
      } else if (txStep === 4) {
        // Wrap/Unwrap success
        addToast({
          variant: 'success',
          title: action === 'wrap' ? 'Shielding Successful' : 'Unshielding Successful',
          message: action === 'wrap'
            ? `Successfully shielded ${amount} ${selectedToken} into confidential c${selectedToken}.`
            : `Successfully unshielded ${amount} c${selectedToken} into public ${selectedToken}.`,
        });
        refetchPublicBalance();
        refetchWrapperBalance();
        setTxStep(5);
        setActiveTxHash(undefined);
      }
    } else if (activeTxHash && isTxError) {
      addToast({
        variant: 'error',
        title: 'Transaction Failed',
        message: 'The transaction reverted on-chain. Please verify gas and try again.',
      });
      setTxStep(0);
      setActiveTxHash(undefined);
    }
  }, [activeTxHash, isTxSuccess, isTxError, txStep, action, amount, selectedToken, refetchAllowance, refetchPublicBalance, refetchWrapperBalance, addToast]);

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
  const hasWrapperBalance = rawWrapperBalance !== undefined ? (rawWrapperBalance as bigint) : 0n;
  const hasAllowance = rawAllowance !== undefined ? (rawAllowance as bigint) : 0n;

  const needsApproval = action === 'wrap' && hasAllowance < parsedInputAmount;

  const handleApprove = async () => {
    if (!selectedWrapper || !address) return;
    setTxStep(1); // Pending wallet
    try {
      const txHash = await writeContractAsync({
        abi: ERC20_ABI,
        address: selectedWrapper.erc20Address,
        functionName: 'approve',
        args: [selectedWrapper.erc7984Address, parsedInputAmount],
      });
      setActiveTxHash(txHash);
      setTxStep(2); // Mining
      addToast({
        variant: 'info',
        title: 'Approval Submitted',
        message: 'Transaction sent. Waiting for confirmation...',
      });
    } catch (err: any) {
      console.error(err);
      setTxStep(0);
      addToast({
        variant: 'error',
        title: 'Approval Cancelled',
        message: err.message || 'The approval transaction was rejected.',
      });
    }
  };

  const handleAction = async () => {
    if (!selectedWrapper || !address) return;
    setTxStep(3); // Pending action wallet
    try {
      let txHash: `0x${string}`;
      if (action === 'wrap') {
        txHash = await writeContractAsync({
          abi: WRAPPER_ABI,
          address: selectedWrapper.erc7984Address,
          functionName: 'wrap',
          args: [address, parsedInputAmount],
        });
      } else {
        // Mock wrapper uses standard withdrawTo for unwrap transactions
        txHash = await writeContractAsync({
          abi: WRAPPER_ABI,
          address: selectedWrapper.erc7984Address,
          functionName: 'withdrawTo',
          args: [address, parsedInputAmount],
        });
      }
      setActiveTxHash(txHash);
      setTxStep(4); // Mining action
      addToast({
        variant: 'info',
        title: action === 'wrap' ? 'Shielding In Progress' : 'Unshielding In Progress',
        message: 'Transaction sent. Waiting for confirmation...',
      });
    } catch (err: any) {
      console.error(err);
      setTxStep(0);
      addToast({
        variant: 'error',
        title: 'Transaction Cancelled',
        message: err.message || 'The transaction was rejected.',
      });
    }
  };

  const handleToggleAction = () => {
    setAction(prev => (prev === 'wrap' ? 'unwrap' : 'wrap'));
    setAmount('');
    setTxStep(0);
    setActiveTxHash(undefined);
  };

  const isChainMismatch = isConnected && chainId !== activeChainId;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>
          <BlurIn text={action === 'wrap' ? 'Shield' : 'Unshield'} />{' '}
          <TypingAnimation words={['Tokens', 'Confidential', 'Privacy']} />
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
                    <LockIcon size={12} />
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
              {/* Token Selector */}
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
                <option value="">Select token</option>
                {wrappers.map(w => (
                  <option key={w.symbol} value={w.symbol}>
                    {w.symbol}
                  </option>
                ))}
              </select>
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
              <ArrowDownUpIcon size={16} />
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
                <Badge variant="accent" size="md" style={{ gap: '4px' }}>
                  {action === 'wrap' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <LockIcon size={12} />
                    </span>
                  )}
                  {action === 'wrap' ? `c${selectedToken}` : selectedToken}
                </Badge>
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
                      <div className="step-dot">{txStep >= 2 ? <CheckIcon size={12} /> : '1'}</div>
                      <span className="text-xs">Approve</span>
                    </div>
                    <div className="step-line" />
                  </>
                )}
                <div className={`step ${txStep >= 4 ? 'completed' : txStep === 3 ? 'active' : ''}`}>
                  <div className="step-dot">{txStep >= 4 ? <CheckIcon size={12} /> : action === 'wrap' ? '2' : '1'}</div>
                  <span className="text-xs">{action === 'wrap' ? 'Shield' : 'Unshield'}</span>
                </div>
                <div className="step-line" />
                <div className={`step ${txStep === 5 ? 'completed' : ''}`}>
                  <div className="step-dot">{txStep === 5 ? <CheckIcon size={12} /> : action === 'wrap' ? '3' : '2'}</div>
                  <span className="text-xs">Done</span>
                </div>
              </div>
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
                }}
              >
                <CheckIcon size={16} /> Complete — Make Another
              </Button>
            ) : needsApproval ? (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={txStep === 1 || txStep === 2}
                disabled={!selectedToken || !amount || amount === '0' || parsedInputAmount > hasPublicBalance}
                onClick={handleApprove}
              >
                {parsedInputAmount > hasPublicBalance ? 'Insufficient Balance' : `Approve ${selectedToken}`}
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
                  ? 'Select a token'
                  : !amount || amount === '0'
                  ? 'Enter an amount'
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
              <InfoIcon size={16} />
            </div>
            <span style={{ lineHeight: '1.4' }}>
              {action === 'wrap'
                ? 'Shielding wraps your ERC-20 tokens into encrypted ERC-7984 tokens. Your balance becomes private on-chain.'
                : 'Unshielding burns your encrypted tokens and releases the equivalent ERC-20 tokens back to your wallet.'}
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
