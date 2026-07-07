'use client';

/**
 * Transfer page — /app/transfer
 *
 * Two modes:
 *  - Confidential: ERC-7984 transfer with FHE-encrypted amount (Zama SDK).
 *  - Standard: plain ERC-20 transfer via wagmi writeContract.
 *
 * Confidential path: docs.zama.org/protocol/sdk/api-references/react/useconfidentialtransfer
 * Installed 3.0.1 uses { tokenAddress } config shape (verified against .d.ts).
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useConfidentialTransfer, useConfidentialBalance } from '@zama-fhe/react-sdk';
import { isAddress, formatUnits } from 'viem';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import TokenIcon from '@/components/ui/TokenIcon';
import TokenSelect, { type TokenSelectGroup } from '@/components/ui/TokenSelect';
import { useToast } from '@/components/ui/Toast';
import TransactionSuccessModal from '@/components/ui/TransactionSuccessModal';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useRegistryPairs } from '@/lib/registry';
import { useWalletErc7984Scan } from '@/lib/use-wallet-scan';
import { useSessionReset } from '@/lib/reset-session';
import { parseAmount, formatAmount, formatAddress } from '@/lib/utils';
import { classifyError } from '@/lib/errors';
import { ERC20_ABI } from '@/lib/wrapper-abi';
import { CHAIN_CONFIG, type SupportedChainId } from '@/config/chains';
import {
  Send,
  ShieldCheck,
  Lock,
  ArrowRight,
  Wallet,
  ExternalLink,
  Zap,
  Shield,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const RECENT_KEY = 'shadowline-recent-recipients';
const MAX_RECENT = 5;

type TransferMode = 'confidential' | 'standard';
type Step = 'idle' | 'encrypting' | 'submitting' | 'confirming' | 'done';

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
function safeParse(value: string, dec: number): bigint {
  if (!value) return 0n;
  try { return parseAmount(value, dec); } catch { return 0n; }
}
function saveRecent(addr: string) {
  try {
    const prev = loadRecents().filter((a) => a.toLowerCase() !== addr.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([addr, ...prev].slice(0, MAX_RECENT)));
  } catch { /* best-effort */ }
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'encrypting', label: 'Encrypt' },
    { id: 'submitting', label: 'Submit' },
    { id: 'confirming', label: 'Confirm' },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);

  if (step === 'idle' || step === 'done') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-3)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        marginBottom: 'var(--sp-4)',
      }}
    >
      {steps.map((s, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <React.Fragment key={s.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--text-xs)',
                fontWeight: isActive ? 600 : 400,
                color: isDone ? 'var(--success)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
              ) : isActive ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '1.5px solid var(--text-muted)',
                  }}
                />
              )}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: i < activeIdx ? 'var(--success)' : 'var(--border)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function TransferPage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { addToast } = useToast();
  const { activeChainId } = useActiveNetwork();
  const chainConfig = CHAIN_CONFIG[activeChainId];
  const publicClient = usePublicClient({ chainId: activeChainId as SupportedChainId });

  const { pairs, isLoading: isRegistryLoading } = useRegistryPairs(activeChainId);

  const transferablePairs = useMemo(
    () => pairs.filter((p) => p.isValid !== false),
    [pairs],
  );

  // Auto-detected ERC-7984 tokens outside the registry
  const registryAddresses = useMemo(
    () => new Set(transferablePairs.map((p) => p.erc7984Address.toLowerCase())),
    [transferablePairs],
  );
  const { extra: extraTokens } = useWalletErc7984Scan(address, publicClient, registryAddresses);

  const [mode, setMode] = useState<TransferMode>('confidential');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const selectedPair = useMemo(
    () => transferablePairs.find((p) => p.symbol === selectedSymbol),
    [transferablePairs, selectedSymbol],
  );

  // For auto-detected extra tokens not in registry
  const selectedExtra = useMemo(
    () => extraTokens.find((t) => t.address === selectedSymbol),
    [extraTokens, selectedSymbol],
  );

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [finalTxHash, setFinalTxHash] = useState<string | undefined>(undefined);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Recent recipients
  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => { setRecents(loadRecents()); }, []);

  // Confidential balance decrypt gate
  const [decryptRequested, setDecryptRequested] = useState(false);

  // App-wide session reset — re-arm the Reveal button so the next click
  // prompts for a fresh EIP-712 signature (IndexedDB is empty after reset).
  const { resetToken } = useSessionReset();
  useEffect(() => {
    if (resetToken > 0) setDecryptRequested(false);
  }, [resetToken]);

  // Reset on token/mode change
  const handleModeSwitch = (next: TransferMode) => {
    setMode(next);
    setSelectedSymbol('');
    setAmount('');
    setRecipient('');
    setStep('idle');
    setDecryptRequested(false);
  };
  const handleTokenChange = (sym: string) => {
    setSelectedSymbol(sym);
    setAmount('');
    setDecryptRequested(false);
  };

  // Which address are we transferring from/to?
  const erc7984Addr = selectedPair?.erc7984Address ?? selectedExtra?.address ?? ZERO_ADDRESS;
  const erc20Addr = selectedPair?.erc20Address ?? ZERO_ADDRESS;
  const wrapperDecimals = selectedPair?.wrapperDecimals ?? selectedExtra?.decimals ?? 6;
  const underlyingDecimals = selectedPair?.decimals ?? 18;

  const decimals = mode === 'confidential' ? wrapperDecimals : underlyingDecimals;
  const symbolDisplay = mode === 'confidential'
    ? `c${selectedPair?.symbol ?? selectedExtra?.symbol ?? '…'}`
    : (selectedPair?.symbol ?? '…');

  // ── Confidential balance (decrypt-gated) ────────────────────────────────────
  // retry: false — a rejected permit signature must NOT re-prompt the wallet.
  const { data: confBalRaw, isLoading: isDecrypting, error: confBalError, refetch: refetchConfBalance } = useConfidentialBalance(
    { tokenAddress: erc7984Addr as `0x${string}` },
    {
      enabled: decryptRequested && !!address && erc7984Addr !== ZERO_ADDRESS,
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Fire-once: on decrypt error (incl. signature rejection), disable the query
  // and show one toast. The "Reveal balance" button re-arms itself.
  const confBalErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!confBalError) {
      confBalErrorRef.current = null;
      return;
    }
    const msg = confBalError.message ?? '';
    if (confBalErrorRef.current === msg) return;
    confBalErrorRef.current = msg;
    setDecryptRequested(false);
    const classified = classifyError(confBalError);
    addToast({ variant: 'warning', title: classified.title, message: classified.message });
  }, [confBalError, addToast]);
  const confBalance = confBalRaw != null
    ? formatUnits(BigInt(confBalRaw), wrapperDecimals)
    : null;

  // ── ERC-20 balance (standard mode, no gating needed) ───────────────────────
  const { data: erc20BalanceRaw } = useReadContract({
    address: erc20Addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address && erc20Addr !== ZERO_ADDRESS && mode === 'standard' },
  });
  const erc20Balance = erc20BalanceRaw != null
    ? formatAmount(erc20BalanceRaw as bigint, underlyingDecimals)
    : null;

  // ── Recipient validation ─────────────────────────────────────────────────────
  const recipientTrimmed = recipient.trim();
  const recipientIsValidAddr = isAddress(recipientTrimmed);
  const recipientIsZero = recipientTrimmed === ZERO_ADDRESS;
  const recipientIsSelf = recipientTrimmed.toLowerCase() === address?.toLowerCase();
  const [isContract, setIsContract] = useState<boolean | null>(null);
  const contractCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsContract(null);
    if (!recipientIsValidAddr || !publicClient) return;
    if (contractCheckRef.current) clearTimeout(contractCheckRef.current);
    contractCheckRef.current = setTimeout(() => {
      publicClient.getCode({ address: recipientTrimmed as `0x${string}` }).then((code) => {
        setIsContract(code != null && code !== '0x' && code.length > 2);
      }).catch(() => setIsContract(null));
    }, 500);
    return () => { if (contractCheckRef.current) clearTimeout(contractCheckRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientTrimmed, recipientIsValidAddr]);

  const recipientError =
    recipientTrimmed && !recipientIsValidAddr ? 'Not a valid Ethereum address.' :
    recipientIsZero ? 'Cannot send to the zero address.' :
    recipientIsSelf ? 'Cannot send to yourself.' :
    null;
  const recipientWarning = !recipientError && isContract
    ? 'This looks like a contract. Confidential tokens sent to a contract without ERC-7984 support may be permanently locked.'
    : null;

  const parsedAmount = safeParse(amount, decimals);

  // Insufficient balance checks
  const confBalBigint = confBalance != null ? parseAmount(confBalance, wrapperDecimals) : null;
  const erc20BalBigint = erc20BalanceRaw as bigint | null ?? null;
  const isConfInsufficient = mode === 'confidential' && confBalBigint != null && parsedAmount > 0n && parsedAmount > confBalBigint;
  const isStdInsufficient = mode === 'standard' && erc20BalBigint != null && parsedAmount > 0n && parsedAmount > erc20BalBigint;
  const isInsufficient = isConfInsufficient || isStdInsufficient;

  const hasToken = !!selectedPair || !!selectedExtra;
  const isRecipientValid = recipientIsValidAddr && !recipientIsZero && !recipientIsSelf;
  const isAmountValid = parsedAmount > 0n;
  const canSubmit =
    isConnected &&
    hasToken &&
    isRecipientValid &&
    isAmountValid &&
    !isInsufficient &&
    step === 'idle';

  // Readable reason for disabled button
  const disabledReason: string | null = !isConnected
    ? 'Connect a wallet'
    : !hasToken
      ? 'Select a token'
      : !isRecipientValid
        ? 'Enter a valid recipient'
        : !isAmountValid
          ? 'Enter an amount'
          : isInsufficient
            ? 'Insufficient balance'
            : step !== 'idle'
              ? 'Transfer in progress…'
              : null;

  // ── Confidential transfer ───────────────────────────────────────────────────
  const isPending = step !== 'idle' && step !== 'done';
  const { mutateAsync: transfer } = useConfidentialTransfer({
    tokenAddress: erc7984Addr as `0x${string}`,
  });

  // ── Standard ERC-20 transfer ────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<string | undefined>(undefined);
  useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}` | undefined,
    query: { enabled: !!pendingTxHash },
  });

  const explorerBase = chainConfig?.explorerUrl ?? 'https://etherscan.io';

  const handleConfidentialTransfer = useCallback(async () => {
    if (!canSubmit || !hasToken) return;
    try {
      setStep('encrypting');
      const res = await transfer({
        to: recipientTrimmed as `0x${string}`,
        amount: parsedAmount,
        onEncryptComplete: () => {
          setStep('submitting');
          addToast({ variant: 'info', title: 'Amount Encrypted', message: 'Submitting to the network…' });
        },
        onTransferSubmitted: (hash) => {
          setStep('confirming');
          setPendingTxHash(hash);
          addToast({ variant: 'info', title: 'Transfer Submitted', message: 'Waiting for on-chain confirmation…' });
        },
      });
      saveRecent(recipientTrimmed);
      setRecents(loadRecents());
      setFinalTxHash(res.txHash);
      setIsSuccessOpen(true);
      setStep('done');
      addToast({
        variant: 'success',
        title: 'Confidential Transfer Confirmed',
        message: `Sent ${amount} ${symbolDisplay} to ${formatAddress(recipientTrimmed)}.`,
      });
      // Note: amount/recipient are cleared in modal onClose so the modal
      // can display the correct sent amount (React batches these state updates).
    } catch (err: unknown) {
      console.error('Confidential transfer failed:', err);
      const classified = classifyError(err);
      addToast({ variant: classified.retryable ? 'warning' : 'error', title: classified.title, message: classified.message });
      setStep('idle');
    }
  }, [canSubmit, hasToken, transfer, recipientTrimmed, parsedAmount, amount, symbolDisplay, addToast]);

  const handleStandardTransfer = useCallback(async () => {
    if (!canSubmit || !selectedPair) return;
    try {
      setStep('submitting');
      addToast({ variant: 'info', title: 'Confirm in wallet', message: 'Approve the ERC-20 transfer in your wallet.' });
      const hash = await writeContractAsync({
        address: selectedPair.erc20Address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientTrimmed as `0x${string}`, parsedAmount],
      });
      setStep('confirming');
      setPendingTxHash(hash);
      addToast({ variant: 'info', title: 'Transfer Submitted', message: 'Waiting for confirmation…' });
      saveRecent(recipientTrimmed);
      setRecents(loadRecents());
      setFinalTxHash(hash);
      setIsSuccessOpen(true);
      setStep('done');
      addToast({
        variant: 'success',
        title: 'ERC-20 Transfer Confirmed',
        message: `Sent ${amount} ${selectedPair.symbol} to ${formatAddress(recipientTrimmed)}.`,
      });
      // Note: amount/recipient are cleared in modal onClose (see above).
    } catch (err: unknown) {
      console.error('ERC-20 transfer failed:', err);
      const classified = classifyError(err);
      addToast({ variant: classified.retryable ? 'warning' : 'error', title: classified.title, message: classified.message });
      setStep('idle');
    }
  }, [canSubmit, selectedPair, writeContractAsync, recipientTrimmed, parsedAmount, amount, addToast]);

  const rawModalSym = selectedPair?.symbol ?? selectedExtra?.symbol ?? '';
  const tokenSymbolForModal = mode === 'confidential'
    ? (selectedPair?.isWrapper === false || rawModalSym.startsWith('c') ? rawModalSym : `c${rawModalSym}`)
    : rawModalSym;

  const isConfMode = mode === 'confidential';

  const tokenGroups = useMemo(() => {
    const official = transferablePairs.filter((p) => p.source !== 'custom' && (isConfMode || p.isWrapper !== false));
    const custom = transferablePairs.filter((p) => p.source === 'custom' && (isConfMode || p.isWrapper !== false));

    const groups: TokenSelectGroup[] = [];
    if (official.length > 0) {
      groups.push({
        label: 'Official Registry',
        options: official.map((p) => {
          const sym = isConfMode ? (p.isWrapper === false || p.symbol.startsWith('c') ? p.symbol : `c${p.symbol}`) : p.symbol;
          return {
            value: p.symbol,
            symbol: sym,
            name: p.name,
            iconSymbol: p.symbol,
            address: p.erc7984Address,
          };
        }),
      });
    }
    if (custom.length > 0) {
      groups.push({
        label: 'Custom / Dev-only',
        options: custom.map((p) => {
          const sym = isConfMode ? (p.isWrapper === false || p.symbol.startsWith('c') ? p.symbol : `c${p.symbol}`) : p.symbol;
          return {
            value: p.symbol,
            symbol: sym,
            name: p.name,
            iconSymbol: p.symbol,
            badge: { text: 'Custom', variant: 'accent' },
            address: p.erc7984Address,
          };
        }),
      });
    }
    if (extraTokens.length > 0 && isConfMode) {
      groups.push({
        label: 'Detected (unverified)',
        options: extraTokens.map((t) => ({
          value: t.address,
          symbol: t.symbol,
          name: t.name,
          iconSymbol: t.symbol,
          badge: { text: 'Unverified', variant: 'warning' },
          address: t.address,
        })),
      });
    }
    return groups;
  }, [transferablePairs, extraTokens, isConfMode]);

  const noTokensAvailable =
    !isRegistryLoading &&
    transferablePairs.length === 0 &&
    extraTokens.length === 0 &&
    isConnected;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--sp-6) var(--sp-4)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, margin: 0 }}>
            Transfer
          </h1>
          <Badge variant="success" size="sm" style={{ marginLeft: 'var(--sp-2)' }}>
            FHE
          </Badge>
        </div>
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
          Send tokens to any recipient. Choose Confidential (ERC-7984, amount encrypted)
          or Standard (plain ERC-20 transfer).
        </p>
      </div>

      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-2)',
          marginBottom: 'var(--sp-5)',
          padding: '4px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          width: 'fit-content',
        }}
      >
        <button
          className={`btn btn-sm${isConfMode ? ' btn-primary' : ' btn-ghost'}`}
          onClick={() => handleModeSwitch('confidential')}
          style={{ gap: 6, minWidth: 140 }}
        >
          <Shield size={14} /> Confidential
        </button>
        <button
          className={`btn btn-sm${!isConfMode ? ' btn-primary' : ' btn-ghost'}`}
          onClick={() => handleModeSwitch('standard')}
          style={{ gap: 6, minWidth: 140 }}
        >
          <Zap size={14} /> Standard ERC-20
        </button>
      </div>

      {/* Mode description */}
      {isConfMode ? (
        <div
          className="text-xs text-muted"
          style={{
            marginBottom: 'var(--sp-4)',
            padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.15)',
          }}
        >
          <Lock size={12} style={{ display: 'inline', marginRight: 4 }} />
          The amount is encrypted client-side via FHE before submission.
          On-chain observers see who sent to whom, but never the value.
          Gas cost is higher than a standard ERC-20 transfer.
        </div>
      ) : (
        <div
          className="text-xs text-muted"
          style={{
            marginBottom: 'var(--sp-4)',
            padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
          }}
        >
          <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
          Standard ERC-20 transfer — amount and recipient are fully public on-chain.
          Uses the underlying token, not the confidential wrapper.
        </div>
      )}

      {!isConnected ? (
        <Card variant="glass" padding="lg">
          <div className="flex flex-col items-center gap-3" style={{ textAlign: 'center' }}>
            <Wallet size={32} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connect a wallet to continue</div>
              <div className="text-muted text-sm">
                {isConfMode
                  ? 'Confidential transfers require a signer to encrypt the amount.'
                  : 'Connect your wallet to sign the ERC-20 transfer.'}
              </div>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              {connectors.map((c) => (
                <Button key={c.uid} variant="primary" size="sm" onClick={() => connect({ connector: c })}>
                  Connect {c.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      ) : noTokensAvailable ? (
        <Card variant="glass" padding="lg">
          <div className="flex flex-col items-center gap-3" style={{ textAlign: 'center' }}>
            <Shield size={32} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No confidential tokens detected</div>
              <div className="text-muted text-sm">
                Your wallet doesn&apos;t hold any ERC-7984 tokens yet.
                Shield some ERC-20 tokens first, or get test tokens from the Faucet.
              </div>
            </div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/app/wrapper"><Button variant="primary" size="sm"><Shield size={13} /> Wrap Tokens</Button></a>
              <a href="/app/faucet"><Button variant="secondary" size="sm">Get Test Tokens</Button></a>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          variant="glass"
          padding="lg"
          style={{
            borderColor: isConfMode
              ? 'rgba(56, 189, 248, 0.28)'
              : 'rgba(245, 158, 11, 0.28)',
            borderLeftWidth: 3,
            borderLeftColor: isConfMode
              ? 'rgba(56, 189, 248, 0.7)'
              : 'rgba(245, 158, 11, 0.7)',
            transition: 'border-color 250ms',
          }}
        >
          {/* Step indicator (confidential only) */}
          {isConfMode && <StepIndicator step={step} />}

          {/* Token select */}
          <label style={{ display: 'block', marginBottom: 'var(--sp-4)' }}>
            <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Token</div>
            <TokenSelect
              value={selectedSymbol}
              onChange={(val) => handleTokenChange(val)}
              groups={tokenGroups}
              placeholder={
                isRegistryLoading
                  ? 'Loading tokens…'
                  : isConfMode
                    ? '— Select a confidential token —'
                    : '— Select a token —'
              }
              disabled={isRegistryLoading || isPending}
            />
            {(selectedPair || selectedExtra) && (
              <div className="text-xs text-muted" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TokenIcon symbol={selectedPair?.symbol ?? selectedExtra?.symbol ?? '?'} size={12} />
                {isConfMode ? (
                  <>
                    {selectedPair?.isWrapper === false ? 'Token:' : 'Wrapper:'} {formatAddress(erc7984Addr, 6)}
                    <a href={`${explorerBase}/address/${erc7984Addr}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex' }}>
                      <ExternalLink size={10} />
                    </a>
                  </>
                ) : (
                  <>
                    ERC-20: {formatAddress(erc20Addr, 6)}
                    <a href={`${explorerBase}/address/${erc20Addr}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex' }}>
                      <ExternalLink size={10} />
                    </a>
                  </>
                )}
                {selectedExtra && <Badge variant="warning" size="sm">Unverified</Badge>}
              </div>
            )}
          </label>

          {/* Recipient */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <div className="text-xs text-muted" style={{ marginBottom: 4 }}>Recipient address</div>
            {/* Recent recipient chips */}
            {recents.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> Recent:
                </span>
                {recents.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRecipient(r)}
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono, monospace)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {formatAddress(r, 4)}
                    <span
                      role="button"
                      title="Remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recents.filter((a) => a !== r);
                        setRecents(updated);
                        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
                      }}
                      style={{ color: 'var(--text-muted)', lineHeight: 1 }}
                    >
                      <X size={8} />
                    </span>
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="0x…"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              disabled={isPending}
              spellCheck={false}
              style={{
                width: '100%',
                padding: 'var(--sp-2) var(--sp-3)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${recipientError ? 'var(--error)' : 'var(--border)'}`,
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 'var(--text-sm)',
              }}
            />
            {recipientError && (
              <div className="text-xs" style={{ color: 'var(--error)', marginTop: 4 }}>
                {recipientError}
              </div>
            )}
            {recipientWarning && (
              <div className="text-xs" style={{ color: 'var(--warning)', marginTop: 4, display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                {recipientWarning}
              </div>
            )}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <div
              className="text-xs text-muted"
              style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
            >
              <span>Amount</span>
              {hasToken && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isConfMode ? (
                    decryptRequested && confBalance !== null ? (
                      <>
                        Available:&nbsp;
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {confBalance} {symbolDisplay}
                        </strong>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 10, padding: '2px 6px', height: 'auto', lineHeight: 1.4 }}
                          onClick={() => setAmount(confBalance)}
                          disabled={isPending}
                        >
                          Max
                        </button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ fontSize: 10, padding: '2px 8px', height: 'auto', gap: 4 }}
                        isLoading={isDecrypting}
                        onClick={() => {
                          setDecryptRequested(true);
                          void refetchConfBalance();
                        }}
                        disabled={isPending || !selectedPair && !selectedExtra}
                      >
                        <Unlock size={10} /> Reveal balance
                      </Button>
                    )
                  ) : erc20Balance !== null ? (
                    <>
                      Available:&nbsp;
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {erc20Balance} {selectedPair?.symbol ?? ''}
                      </strong>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: 10, padding: '2px 6px', height: 'auto', lineHeight: 1.4 }}
                        onClick={() => {
                          if (erc20BalanceRaw != null && selectedPair) {
                            setAmount(formatAmount(erc20BalanceRaw as bigint, selectedPair.decimals));
                          }
                        }}
                      >
                        Max
                      </button>
                    </>
                  ) : null}
                </span>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              disabled={!hasToken || isPending}
              style={{
                width: '100%',
                padding: 'var(--sp-3) var(--sp-4)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isInsufficient ? 'var(--error)' : 'var(--border)'}`,
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xl)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            />
            {isInsufficient && (
              <div className="text-xs" style={{ color: 'var(--error)', marginTop: 4 }}>
                Amount exceeds your available balance.
              </div>
            )}
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            isLoading={isPending}
            disabled={!canSubmit || isPending}
            onClick={isConfMode ? handleConfidentialTransfer : handleStandardTransfer}
            style={{ width: '100%', gap: 8 }}
          >
            {isPending ? (
              isConfMode ? (
                <><Lock size={16} /> {step === 'encrypting' ? 'Encrypting…' : step === 'submitting' ? 'Submitting…' : 'Confirming…'}</>
              ) : (
                <><Zap size={16} /> Sending…</>
              )
            ) : (
              <>
                <Send size={16} /> Send {hasToken ? symbolDisplay : '…'}
                {hasToken && <ArrowRight size={16} />}
              </>
            )}
          </Button>

          {/* Disabled reason */}
          {!canSubmit && !isPending && disabledReason && (
            <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-2)', textAlign: 'center' }}>
              {disabledReason}
            </div>
          )}

          {pendingTxHash && (
            <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-3)', textAlign: 'center' }}>
              tx:{' '}
              <a
                href={`${explorerBase}/tx/${pendingTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                {formatAddress(pendingTxHash, 6)}
              </a>
            </div>
          )}
        </Card>
      )}

      {finalTxHash && (selectedPair || selectedExtra) && (
        <TransactionSuccessModal
          isOpen={isSuccessOpen}
          onClose={() => {
            setIsSuccessOpen(false);
            setFinalTxHash(undefined);
            setPendingTxHash(undefined);
            setStep('idle');
            setAmount('');
            setRecipient('');
          }}
          action="transfer"
          amount={amount || '0'}
          tokenSymbol={tokenSymbolForModal}
          txHash={finalTxHash}
        />
      )}
    </div>
  );
}
