'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BlurInProps {
  text: string;
  duration?: number; // duration in ms
  className?: string;
  delay?: number; // delay in ms before starting
}

export default function BlurIn({
  text,
  duration = 800,
  className,
  delay = 0,
}: BlurInProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      className={cn('blur-in-text', className)}
      style={{
        filter: isMounted ? 'blur(0px)' : 'blur(10px)',
        opacity: isMounted ? 1 : 0,
        transition: `filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
}
