'use client';

import React, { useState, useEffect } from 'react';
import {
  useResumeUnshield,
  useZamaSDK,
  loadPendingUnshield,
  clearPendingUnshield,
} from '@zama-fhe/react-sdk';
import { useAccount } from 'wagmi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { classifyError } from '@/lib/errors';
import { useToast } from '@/components/ui/Toast';
import { formatAddress } from '@/lib/utils';
import { AlertTriangle, RotateCw, Check, X } from 'lucide-react';

interface Props {
  /** The ERC-7984 wrapper contract address to check for pending unshields. */
  tokenAddress: `0x${string}`;
  /** Human-readable symbol for display, e.g. "cUSDC". */
  symbol: string;
}

/**
 * Shows a warning banner when an unshield (unwrap) operation was interrupted
 * between the on-chain unwrap request and the finalization step. The user can
 * click "Resume" to complete the finalization, or "Dismiss" if they know the
 * tx was already handled elsewhere.
 *
 * Place this component on the Portfolio and/or Wrap pages, once per wrapper
 * token. It checks localStorage (via the SDK's `loadPendingUnshield`) on
 * mount and stays hidden if there is nothing to resume.
 */
export default function PendingUnshieldBanner({ tokenAddress, symbol }: Props) {
  const { isConnected } = useAccount();
  const sdk = useZamaSDK();
  const { addToast } = useToast();

  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { mutateAsync: resumeUnshield } = useResumeUnshield({ tokenAddress });

  // Check for a pending unshield on mount
  useEffect(() => {
    if (!isConnected || !sdk?.storage) return;
    let cancelled = false;

    (async () => {
      try {
        const pending = await loadPendingUnshield(sdk.storage, tokenAddress);
        if (!cancelled && pending) {
          setPendingTxHash(pending as `0x${string}`);
        }
      } catch {
        // Storage read failed — not critical, just skip
      }
    })();

    return () => { cancelled = true; };
  }, [isConnected, sdk?.storage, tokenAddress]);

  const handleResume = async () => {
    if (!pendingTxHash || !sdk?.storage) return;
    setIsResuming(true);
    try {
      await resumeUnshield({ unwrapTxHash: pendingTxHash });
      await clearPendingUnshield(sdk.storage, tokenAddress);
      setPendingTxHash(null);
      setIsDone(true);
      addToast({
        variant: 'success',
        title: 'Unshield Completed',
        message: `Successfully finalized the pending ${symbol} unshield.`,
      });
    } catch (err: unknown) {
      console.error('Resume unshield failed:', err);
      const classified = classifyError(err);
      addToast({
        variant: 'error',
        title: classified.title,
        message: classified.message,
      });
    } finally {
      setIsResuming(false);
    }
  };

  const handleDismiss = async () => {
    if (!sdk?.storage) return;
    try {
      await clearPendingUnshield(sdk.storage, tokenAddress);
    } catch {
      // Best-effort clear
    }
    setPendingTxHash(null);
  };

  // Nothing to show
  if (!pendingTxHash || isDone) return null;

  return (
    <Card
      variant="glass"
      padding="sm"
      style={{
        borderColor: 'rgba(234, 179, 8, 0.4)',
        background: 'rgba(234, 179, 8, 0.06)',
        marginBottom: 'var(--sp-4)',
      }}
    >
      <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
        <AlertTriangle size={16} style={{ color: '#eab308', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            Pending Unshield — {symbol}
          </div>
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>
            A previous unshield was interrupted before finalization.
            Transaction: <code>{formatAddress(pendingTxHash)}</code>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            isLoading={isResuming}
            onClick={handleResume}
            style={{ gap: 4 }}
            aria-label={`Resume pending ${symbol} unshield`}
          >
            <RotateCw size={12} /> Resume
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isResuming}
            aria-label="Dismiss pending unshield notification"
            title="Dismiss — use this if you already finalized this unshield elsewhere"
          >
            <X size={12} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
