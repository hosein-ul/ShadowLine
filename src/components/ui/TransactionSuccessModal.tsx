'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { ExternalLink, Check, Copy, Sparkles, ArrowRight, ShieldCheck, Send, Droplets } from 'lucide-react';
import { formatAddress } from '@/lib/utils';
import { CHAIN_CONFIG } from '@/config/chains';
import { useActiveNetwork } from '@/app/ClientLayout';
import confetti from 'canvas-confetti';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'wrap' | 'unwrap' | 'faucet' | 'transfer';
  amount: string;
  tokenSymbol: string;
  txHash: string;
}

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  action,
  amount,
  tokenSymbol,
  txHash,
}: TransactionSuccessModalProps) {
  const { activeChainId } = useActiveNetwork();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti!
      const duration = 1.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD208', '#10b981', '#8b5cf6', '#3b82f6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD208', '#10b981', '#8b5cf6', '#3b82f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const explorerUrl = CHAIN_CONFIG[activeChainId]?.explorerUrl;
  const fullTxUrl = explorerUrl ? `${explorerUrl}/tx/${txHash}` : '#';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tx hash', err);
    }
  };

  // Action text mapping
  const actionLabel =
    action === 'wrap'
      ? 'Shielding Completed'
      : action === 'unwrap'
      ? 'Unshielding Completed'
      : action === 'transfer'
      ? 'Confidential Transfer Confirmed'
      : 'Faucet Receipt Confirmed';

  const actionSub =
    action === 'wrap'
      ? 'Your assets are now securely encrypted on-chain'
      : action === 'unwrap'
      ? 'Your assets have been converted back to public forms'
      : action === 'transfer'
      ? 'The transferred amount stays encrypted end-to-end'
      : 'Mock test tokens have been minted to your wallet';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="460px">
      {/* Styles for drawing checkmark & modal design additions */}
      <style>{`
        .success-checkmark-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: var(--sp-4) 0 var(--sp-6);
        }
        
        .success-circle-outer {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-glow 2s infinite ease-in-out;
        }

        .success-circle-inner {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .svg-checkmark {
          width: 28px;
          height: 28px;
          stroke: white;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: draw-check 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
        }

        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scale-up {
          from {
            transform: scale(0.6);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.15);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }

        .modal-success-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          padding: var(--sp-4);
          margin-bottom: var(--sp-6);
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-3);
          font-size: var(--text-xs);
          border-top: 1px solid var(--border);
          padding-top: var(--sp-3);
          margin-top: var(--sp-3);
        }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        {/* Animated Checkmark Icon */}
        <div className="success-checkmark-wrapper">
          <div className="success-circle-outer">
            <div className="success-circle-inner">
              <svg className="svg-checkmark" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          {actionLabel}
        </h2>
        <p className="text-xs text-muted" style={{ marginBottom: 'var(--sp-5)' }}>
          {actionSub}
        </p>

        {/* Amount Box */}
        <div className="modal-success-card animate-fade-in">
          <div className="text-xs text-muted" style={{ marginBottom: 'var(--sp-1.5)', fontWeight: 500 }}>
            {action === 'wrap' ? 'Confidential Amount Generated'
              : action === 'unwrap' ? 'Underlying Amount Released'
              : action === 'transfer' ? 'Transferred Amount'
              : 'Minted Amount'}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-3)' }}>
            {action === 'wrap' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{amount}</span>
                  <span className="text-xs text-muted">{tokenSymbol}</span>
                </div>
                <ArrowRight size={14} className="text-muted" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)' }}>
                    {amount}
                  </span>
                  <Badge variant="success" style={{ gap: '2px', fontSize: 'var(--text-xs)' }}>
                    c{tokenSymbol}
                  </Badge>
                </div>
              </>
            ) : action === 'unwrap' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{amount}</span>
                  <Badge variant="default" style={{ gap: '2px', fontSize: 'var(--text-xs)' }}>
                    c{tokenSymbol}
                  </Badge>
                </div>
                <ArrowRight size={14} className="text-muted" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)' }}>
                    {amount}
                  </span>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>{tokenSymbol}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--success)' }}>
                  {amount}
                </span>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{tokenSymbol}</span>
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="details-grid">
            <div style={{ textAlign: 'left' }}>
              <div className="text-muted">Network</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeChainId === 11155111 ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="text-muted">Status</div>
              <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Confirmed
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Link Section */}
        {txHash && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--bg-input)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--sp-3) var(--sp-4)', 
              marginBottom: 'var(--sp-6)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span className="text-muted" style={{ fontSize: '10px' }}>TRANSACTION HASH</span>
              <span className="font-mono text-xs" style={{ color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                {formatAddress(txHash, 8)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button 
                onClick={handleCopy}
                className="btn btn-secondary btn-sm"
                style={{ padding: 'var(--sp-2)', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Copy Transaction Hash"
              >
                {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              </button>
              <a 
                href={fullTxUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ padding: 'var(--sp-2)', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="View on Block Explorer"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2.5)' }}>
          <Button variant="primary" fullWidth size="lg" onClick={onClose} style={{ gap: '6px' }}>
            {action === 'transfer' ? (
              <><Send size={16} /> Send Another Transfer</>
            ) : action === 'faucet' ? (
              <><Droplets size={16} /> Get More Tokens</>
            ) : (
              <><Sparkles size={16} /> Great! Wrap More</>
            )}
          </Button>
          {txHash && (
            <a 
              href={fullTxUrl}
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary btn-lg"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              View Explorer Details <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
