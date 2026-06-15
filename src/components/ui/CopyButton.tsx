'use client';

import React, { useState, useCallback } from 'react';
import { cn, copyToClipboard } from '@/lib/utils';

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
      style={{ fontSize: '14px' }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}
