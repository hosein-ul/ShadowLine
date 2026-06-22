import { describe, it, expect } from 'vitest';
import { formatAmount, parseAmount, formatAddress, cn, isValidAddress, formatCompact } from '../utils';

/* ─── formatAmount ──────────────────────────────────────────────────────────── */

describe('formatAmount', () => {
  it('returns "0" for zero', () => {
    expect(formatAmount(0n, 6)).toBe('0');
    expect(formatAmount(0n, 18)).toBe('0');
  });

  it('formats a whole number (no decimals)', () => {
    // 1_000_000 with 6 decimals = 1.0
    expect(formatAmount(1_000_000n, 6)).toBe('1');
  });

  it('formats with fractional part (6 decimals — USDC-like)', () => {
    expect(formatAmount(1_500_000n, 6)).toBe('1.5');
    expect(formatAmount(1_234_567n, 6)).toBe('1.2345');
    expect(formatAmount(123_456n, 6)).toBe('0.1234');
  });

  it('formats with fractional part (18 decimals — ETH-like)', () => {
    // 1.5 ETH = 1_500_000_000_000_000_000
    expect(formatAmount(1_500_000_000_000_000_000n, 18)).toBe('1.5');
    // 0.001 ETH
    expect(formatAmount(1_000_000_000_000_000n, 18)).toBe('0.001');
  });

  it('respects maxDecimals parameter', () => {
    // 1.234567 with maxDecimals=2 should show 1.23
    expect(formatAmount(1_234_567n, 6, 2)).toBe('1.23');
    expect(formatAmount(1_200_000n, 6, 2)).toBe('1.2');
  });

  it('trims trailing zeros from fractional part', () => {
    // 1.100000 → 1.1
    expect(formatAmount(1_100_000n, 6)).toBe('1.1');
    // 1.000100 → 1.0001
    expect(formatAmount(1_000_100n, 6)).toBe('1.0001');
  });

  it('handles the FHE wrapper decimal case (6 decimals)', () => {
    // The critical case from memory.md Problem 1:
    // euint64 balance of 1_000_000 with wrapper decimals 6 = 1.0 token
    expect(formatAmount(1_000_000n, 6)).toBe('1');
    // If someone mistakenly uses 18 decimals, they'd get 0
    expect(formatAmount(1_000_000n, 18)).toBe('0');
  });

  it('handles large amounts', () => {
    // 1 million USDC = 1_000_000_000_000
    expect(formatAmount(1_000_000_000_000n, 6)).toBe('1000000');
  });

  it('handles very small amounts', () => {
    // 1 wei of a 6-decimal token
    expect(formatAmount(1n, 6)).toBe('0');
    // 100 wei of a 6-decimal token = 0.0001
    expect(formatAmount(100n, 6)).toBe('0.0001');
  });
});

/* ─── parseAmount ───────────────────────────────────────────────────────────── */

describe('parseAmount', () => {
  it('returns 0n for empty or zero input', () => {
    expect(parseAmount('', 6)).toBe(0n);
    expect(parseAmount('0', 6)).toBe(0n);
    expect(parseAmount('', 18)).toBe(0n);
  });

  it('parses whole numbers (6 decimals)', () => {
    expect(parseAmount('1', 6)).toBe(1_000_000n);
    expect(parseAmount('100', 6)).toBe(100_000_000n);
  });

  it('parses whole numbers (18 decimals)', () => {
    expect(parseAmount('1', 18)).toBe(1_000_000_000_000_000_000n);
  });

  it('parses fractional amounts (6 decimals)', () => {
    expect(parseAmount('1.5', 6)).toBe(1_500_000n);
    expect(parseAmount('0.1', 6)).toBe(100_000n);
    expect(parseAmount('0.000001', 6)).toBe(1n);
  });

  it('parses fractional amounts (18 decimals)', () => {
    expect(parseAmount('1.5', 18)).toBe(1_500_000_000_000_000_000n);
    expect(parseAmount('0.001', 18)).toBe(1_000_000_000_000_000n);
  });

  it('truncates extra precision beyond decimals', () => {
    // "1.1234567" with 6 decimals → only 6 fractional digits used
    expect(parseAmount('1.1234567', 6)).toBe(1_123_456n);
  });

  it('pads short fractions', () => {
    // "1.1" with 6 decimals → 1_100_000
    expect(parseAmount('1.1', 6)).toBe(1_100_000n);
  });

  it('is inverse of formatAmount for round-trip', () => {
    // parse → format should round-trip for amounts within precision
    const original = '123.4567';
    const parsed = parseAmount(original, 6);
    expect(formatAmount(parsed, 6)).toBe('123.4567');

    const original2 = '1.5';
    const parsed2 = parseAmount(original2, 18);
    expect(formatAmount(parsed2, 18)).toBe('1.5');
  });

  it('handles the shield/unshield decimal difference', () => {
    // Shield: parse with underlying decimals (18 for WETH)
    const shieldAmount = parseAmount('1', 18);
    expect(shieldAmount).toBe(1_000_000_000_000_000_000n);

    // Unshield: parse with wrapper decimals (always 6)
    const unshieldAmount = parseAmount('1', 6);
    expect(unshieldAmount).toBe(1_000_000n);
  });
});

/* ─── formatAddress ─────────────────────────────────────────────────────────── */

describe('formatAddress', () => {
  it('truncates address with default chars', () => {
    expect(formatAddress('0x1234567890abcdef1234567890abcdef12345678'))
      .toBe('0x1234...5678');
  });

  it('returns empty for empty input', () => {
    expect(formatAddress('')).toBe('');
  });

  it('respects custom chars parameter', () => {
    expect(formatAddress('0x1234567890abcdef1234567890abcdef12345678', 6))
      .toBe('0x123456...345678');
  });
});

/* ─── cn ────────────────────────────────────────────────────────────────────── */

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active');
  });
});

/* ─── isValidAddress ────────────────────────────────────────────────────────── */

describe('isValidAddress', () => {
  it('validates correct addresses', () => {
    expect(isValidAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(isValidAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(isValidAddress('')).toBe(false);
    expect(isValidAddress('0x')).toBe(false);
    expect(isValidAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false); // no 0x
    expect(isValidAddress('0x123')).toBe(false); // too short
    expect(isValidAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false); // invalid hex
  });
});

/* ─── formatCompact ─────────────────────────────────────────────────────────── */

describe('formatCompact', () => {
  it('formats small numbers as-is', () => {
    expect(formatCompact(999)).toBe('999');
  });

  it('formats thousands', () => {
    expect(formatCompact(1000)).toBe('1.0K');
    expect(formatCompact(1500)).toBe('1.5K');
  });

  it('formats millions', () => {
    expect(formatCompact(1_000_000)).toBe('1.0M');
  });

  it('formats billions', () => {
    expect(formatCompact(1_000_000_000)).toBe('1.0B');
  });
});
