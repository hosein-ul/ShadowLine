'use client';

/**
 * App-wide FHE decryption session reset.
 *
 * `sdk.credentials.clear()` wipes IndexedDB + memory cache + session signature
 * globally for the connected wallet+chain (verified against installed 3.0.1
 * CredentialsManager.clear → BaseCredentialsManager.clearAll(key)). The shared
 * QueryClient in Providers.tsx means removeQueries clears the balance cache
 * app-wide. Each decrypt-gated page still keeps its own `decryptRequested`
 * local state; without a broadcast, those stay `true` and the page shows a
 * stale "Decrypted" UI. `resetToken` is a monotonic counter subscribers watch
 * to re-arm their local Decrypt buttons.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { useZamaSDK } from '@zama-fhe/react-sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { classifyError } from '@/lib/errors';

interface SessionResetContextValue {
  /** Monotonic counter — bumps on each successful reset. Subscribers watch this. */
  resetToken: number;
  /** True while `reset()` is running (for spinners on Reset buttons). */
  isResetting: boolean;
  /** Full FHE credential wipe + app-wide cache purge + broadcast. */
  reset: (opts?: { silent?: boolean }) => Promise<void>;
}

const SessionResetContext = createContext<SessionResetContextValue | undefined>(undefined);

export function SessionResetProvider({ children }: { children: React.ReactNode }) {
  const sdk = useZamaSDK();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [resetToken, setResetToken] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  const reset = useCallback(async (opts?: { silent?: boolean }) => {
    if (!sdk) return;
    setIsResetting(true);
    try {
      await sdk.credentials.clear();
      queryClient.removeQueries({ queryKey: ['zama.confidentialBalance'] });
      queryClient.removeQueries({ queryKey: ['zama.confidentialBalances'] });
      queryClient.removeQueries({ queryKey: ['zama.isAllowed'] });
      queryClient.removeQueries({ queryKey: ['zama.decryption'] });
      queryClient.removeQueries({ queryKey: ['zama.activityFeed'] });
      setResetToken((n) => n + 1);
      if (!opts?.silent) {
        addToast({
          variant: 'success',
          title: 'Decryption Session Reset',
          message: 'Cached FHE credentials cleared. Next decrypt will prompt for a fresh wallet signature.',
        });
      }
    } catch (err) {
      console.error('reset-session:', err);
      if (!opts?.silent) {
        const classified = classifyError(err);
        addToast({ variant: 'error', title: classified.title, message: classified.message });
      }
    } finally {
      setIsResetting(false);
    }
  }, [sdk, queryClient, addToast]);

  return (
    <SessionResetContext.Provider value={{ resetToken, isResetting, reset }}>
      {children}
    </SessionResetContext.Provider>
  );
}

export function useSessionReset(): SessionResetContextValue {
  const ctx = useContext(SessionResetContext);
  if (!ctx) throw new Error('useSessionReset must be used within SessionResetProvider');
  return ctx;
}
