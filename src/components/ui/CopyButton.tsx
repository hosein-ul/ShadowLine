'use client';

import React, { useState, useCallback } from 'react';
import { cn, copyToClipboard } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn('btn btn-icon btn-ghost', className)}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-1)',
        borderRadius: 'var(--radius-sm)',
        width: '28px',
        height: '28px',
        color: copied ? 'var(--text-success)' : 'var(--text-muted)',
        transition: 'all 150ms',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
