import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getExplorerUrl } from '@/config/chains';

/**
 * Truncate an Ethereum address for display: 0x1234...5678
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a bigint token amount to a human-readable string.
 * e.g., 1000000n with 6 decimals → "1.0"
 */
export function formatAmount(amount: bigint, decimals: number, maxDecimals = 4): string {
  if (amount === 0n) return '0';

  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === 0n) return whole.toString();

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.slice(0, maxDecimals).replace(/0+$/, '');

  if (!trimmed) return whole.toString();
  return `${whole}.${trimmed}`;
}

/**
 * Parse a human-readable amount string to bigint.
 * e.g., "1.5" with 6 decimals → 1500000n
 */
export function parseAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === '0') return 0n;

  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Get block explorer URL for a transaction.
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address.
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}

/**
 * Class-name combiner. Accepts strings, objects, arrays, and falsy values
 * (the clsx/shadcn input shape) and runs the result through `twMerge` so
 * conflicting Tailwind utilities collapse correctly on the landing page.
 *
 * Backward compatible — old callers passing only strings keep working.
 *
 * Usage:
 *   cn('base', isActive && 'active')
 *   cn('base', { 'is-open': open, hidden: !visible })
 *   cn('px-2 py-1', 'px-4')  // → 'py-1 px-4' (twMerge resolves conflict)
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}

/**
 * Async sleep helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Format large numbers with K, M, B suffixes.
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Check if a string is a valid Ethereum address.
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format a timestamp to relative time (e.g., "2 min ago").
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
