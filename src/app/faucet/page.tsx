'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { KNOWN_WRAPPERS } from '@/config/contracts';
import { getTokenInitials, getTokenInfo } from '@/config/tokens';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useToast } from '@/components/ui/Toast';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnect,
  useSwitchChain,
} from 'wagmi';
import { ERC20_ABI } from '@/lib/wrapper-abi';
import { sepolia } from 'wagmi/chains';
import { parseAmount } from '@/lib/utils';
import BlurIn from '@/components/ui/BlurIn';
import TypingAnimation from '@/components/ui/TypingAnimation';
import {
  FaucetIcon,
  CheckIcon,
  InfoIcon,
  WalletIcon,
  ExternalLinkIcon,
} from '@/components/ui/Icons';

const FAUCET_AMOUNTS: Record<string, string> = {
  USDC: '1000',
  USDT: '1000',
  WETH: '1',
  ZAMA: '100',
  BRON: '1000',
  tGBP: '1000',
  XAUt: '500',
};

const COOLDOWN_SECONDS = 60;

export default function FaucetPage() {
  const [selectedToken, setSelectedToken] = useState('');
  const [activeTxHash, setActiveTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [cooldown, setCooldown] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const { activeChainId } = useActiveNetwork();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const { addToast } = useToast();

  const wrappers = KNOWN_WRAPPERS[sepolia.id] ?? [];
  const selectedWrapper = wrappers.find(w => w.symbol === selectedToken);

  // Wagmi contract writing hook
  const { writeContractAsync } = useWriteContract();

  // Wait for transaction mining receipt
  const { isLoading: isTxMining, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: activeTxHash,
  });

  // Track transaction receipt updates
  useEffect(() => {
    if (activeTxHash && isTxSuccess) {
      addToast({
        variant: 'success',
        title: 'Tokens Minted Successfully',
        message: `${FAUCET_AMOUNTS[selectedToken]} ${selectedToken} test tokens have been added to your wallet.`,
      });
      setRequestCount(prev => prev + 1);
      setIsRequestPending(false);

      // Start cooldown timer
      setCooldown(COOLDOWN_SECONDS);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setActiveTxHash(undefined);
    } else if (activeTxHash && isTxError) {
      addToast({
        variant: 'error',
        title: 'Transaction Failed',
        message: 'The faucet request transaction reverted on-chain.',
      });
      setIsRequestPending(false);
      setActiveTxHash(undefined);
    }
  }, [activeTxHash, isTxSuccess, isTxError, selectedToken, addToast]);

  const handleRequest = async () => {
    if (!selectedWrapper || !address || cooldown > 0) return;

    setIsRequestPending(true);
    try {
      const decimals = selectedWrapper.decimals;
      const mintAmount = parseAmount(FAUCET_AMOUNTS[selectedToken], decimals);

      // Mint tokens directly on underlying Sepolia mock contract
      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: selectedWrapper.erc20Address,
        functionName: 'mint',
        args: [address, mintAmount],
      });

      setActiveTxHash(hash);
      addToast({
        variant: 'info',
        title: 'Faucet Request Submitted',
        message: 'Transaction sent to the network. Minting mock tokens...',
      });
    } catch (err: any) {
      console.error(err);
      setIsRequestPending(false);
      addToast({
        variant: 'error',
        title: 'Faucet Request Failed',
        message: err.message || 'The faucet mint transaction was rejected.',
      });
    }
  };

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>
          <BlurIn text="Sepolia Faucet" duration={600} />
        </h1>
        <p style={{ margin: 'var(--sp-2) auto 0' }}>
          <BlurIn
            text="Mint mock underlying ERC-20 tokens directly on the Sepolia network to test the confidential wrapping registry."
            duration={800}
            delay={200}
          />
        </p>
      </div>

      {/* Network Warning */}
      <div style={{ maxWidth: '480px', margin: '0 auto var(--sp-6)' }} className="animate-slide-up">
        <Card variant="glass" padding="sm">
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="warning" dot>
              Testnet Only
            </Badge>
            <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
              These mock assets hold no monetary value and exist solely on Sepolia.
            </span>
          </div>
        </Card>
      </div>

      {/* Faucet Card */}
      <div className="faucet-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Card variant="accent" padding="lg" className="animate-slide-up">
          <h3 style={{ textAlign: 'center', marginBottom: 'var(--sp-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
              <FaucetIcon size={24} />
            </span>
            <span>Request Test Tokens</span>
          </h3>

          {/* Token Selection */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <label className="input-label" style={{ marginBottom: 'var(--sp-3)', display: 'block' }}>
              Select Token
            </label>
            <div className="grid grid-2 gap-3">
              {wrappers.map(w => {
                const info = getTokenInfo(w.symbol);
                const isSelected = selectedToken === w.symbol;
                return (
                  <button
                    key={w.symbol}
                    onClick={() => {
                      setSelectedToken(w.symbol);
                      setActiveTxHash(undefined);
                    }}
                    className={`card card-sm card-hover`}
                    disabled={isRequestPending || cooldown > 0}
                    style={{
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderColor: isSelected ? 'var(--border-accent)' : undefined,
                      background: isSelected ? 'var(--accent-subtle)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="table-token-icon"
                        style={{
                          borderColor: info.color,
                          color: info.color,
                          width: '36px',
                          height: '36px',
                        }}
                      >
                        {getTokenInitials(w.symbol)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{w.symbol}</div>
                        <div className="text-xs text-muted">
                          {FAUCET_AMOUNTS[w.symbol] ?? '100'} tokens
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="accent" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }}>
                          <CheckIcon size={10} />
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Info */}
          {selectedToken && (
            <div
              style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-4)',
                marginBottom: 'var(--sp-6)',
                textAlign: 'center',
              }}
            >
              <div className="text-xs text-muted" style={{ marginBottom: 'var(--sp-1)' }}>
                You will receive
              </div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
                {FAUCET_AMOUNTS[selectedToken] ?? '100'}{' '}
                <span style={{ color: 'var(--accent)' }}>{selectedToken}</span>
              </div>
            </div>
          )}

          {/* Request Button */}
          {!isConnected ? (
            <Button variant="primary" fullWidth size="lg" onClick={() => setIsConnectModalOpen(true)}>
              <WalletIcon size={16} style={{ marginRight: '6px' }} />
              Connect Wallet
            </Button>
          ) : isWrongNetwork ? (
            <Button
              variant="danger"
              fullWidth
              size="lg"
              onClick={() => switchChain({ chainId: sepolia.id })}
            >
              Switch to Sepolia Testnet
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isRequestPending || isTxMining}
              disabled={!selectedToken || cooldown > 0}
              onClick={handleRequest}
              style={{ gap: '6px' }}
            >
              {cooldown > 0
                ? `Cooldown: Wait ${cooldown}s`
                : !selectedToken
                ? 'Select a token'
                : `Request Faucet`}
            </Button>
          )}

          {/* Success Tx Link */}
          {activeTxHash && isTxMining && (
            <div
              style={{
                marginTop: 'var(--sp-4)',
                padding: 'var(--sp-4)',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}
            >
              <div className="text-xs text-muted" style={{ marginBottom: 'var(--sp-1)' }}>
                Transaction pending...
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${activeTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center justify-center gap-1"
                style={{ color: 'var(--accent)', wordBreak: 'break-all' }}
              >
                View on Etherscan <ExternalLinkIcon size={10} />
              </a>
            </div>
          )}

          {/* Request Counter */}
          {requestCount > 0 && (
            <div className="text-xs text-muted text-center" style={{ marginTop: 'var(--sp-4)' }}>
              {requestCount} faucet request{requestCount > 1 ? 's' : ''} confirmed in this session
            </div>
          )}
        </Card>

        {/* Steps Guide */}
        <Card variant="glass" padding="md" style={{ marginTop: 'var(--sp-6)' }}>
          <h4 style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
              <InfoIcon size={18} />
            </span>
            <span>Getting Started Flow</span>
          </h4>
          <div className="flex flex-col gap-3">
            {[
              { step: '1', text: 'Request test tokens from the faucet above' },
              { step: '2', text: 'Go to Wrap/Unwrap → Shield your public tokens to make them confidential' },
              { step: '3', text: 'Check your Portfolio to see encrypted balance representations' },
              { step: '4', text: 'Decrypt your balance using an EIP-712 session permit signature' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-muted)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <span className="text-sm text-muted" style={{ lineHeight: '1.4', paddingTop: '2px' }}>
                  {item.text}
                </span>
              </div>
            ))}
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
