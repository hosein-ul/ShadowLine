'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outlined' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  const paddingClass = {
    none: 'card-none',
    sm: 'card-sm',
    md: '',
    lg: 'card-lg',
  }[padding];

  const variantClass = {
    default: 'card',
    glass: 'card',
    outlined: 'card',
    accent: 'card card-accent',
  }[variant];

  return (
    <div
      className={cn(variantClass, paddingClass, hover && 'card-hover', className)}
      {...props}
    >
      {children}
    </div>
  );
}
