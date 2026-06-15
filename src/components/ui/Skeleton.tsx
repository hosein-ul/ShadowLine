'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export default function Skeleton({
  width,
  height,
  variant = 'text',
  className,
}: SkeletonProps) {
  const variantClass = {
    text: 'skeleton-text',
    circular: 'skeleton-circle',
    rectangular: '',
  }[variant];

  return (
    <div
      className={cn('skeleton', variantClass, className)}
      style={{
        width: width ?? (variant === 'circular' ? height : '100%'),
        height: height ?? (variant === 'text' ? 14 : undefined),
      }}
    />
  );
}
