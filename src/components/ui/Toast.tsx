'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, InfoIcon } from '@/components/ui/Icons';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? 5000;

    setToasts(prev => [...prev.slice(-4), { ...toast, id, duration }]); // Keep max 5

    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Map variants to actual SVG components
  const renderIcon = (variant: ToastVariant) => {
    const size = 18;
    switch (variant) {
      case 'success':
        return <CheckIcon size={size} style={{ color: 'var(--success)' }} />;
      case 'error':
        return <span style={{ color: 'var(--error)', fontWeight: 800, fontSize: '16px', lineHeight: '1' }}>✕</span>;
      case 'warning':
        return <InfoIcon size={size} style={{ color: 'var(--warning)' }} />;
      case 'info':
      default:
        return <InfoIcon size={size} style={{ color: 'var(--info)' }} />;
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', top: 'var(--sp-6)', right: 'var(--sp-6)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn('toast', `toast-${toast.variant}`)}
            style={{
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-4) var(--sp-5)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '320px',
              maxWidth: '420px',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center' }}>
              {renderIcon(toast.variant)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="toast-title" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{toast.title}</div>
              {toast.message && <div className="toast-message" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>{toast.message}</div>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn btn-icon btn-ghost"
              style={{ padding: 0, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', opacity: 0.5, flexShrink: 0 }}
            >
              ✕
            </button>
            <div
              className="toast-progress"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                background: 'var(--accent)',
                animation: 'shrink linear forwards',
                animationDuration: `${toast.duration ?? 5000}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
