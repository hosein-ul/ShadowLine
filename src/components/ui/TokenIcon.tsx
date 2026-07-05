import React, { useState } from 'react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Local copy — the old steakhouse.fi domain lapsed and now redirects to a
// domain marketplace (verified 2026-07-05), so the external URL 404'd. Fetched
// fresh from the current official site, www.steakhouse.financial.
const STEAKHOUSE_LOGO = '/brands/steakhouse-logo.png';

const LOGO_URLS: Record<string, string> = {
  USDC:       'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT:       'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  WETH:       'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  ETH:        'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  XAUT:       'https://assets.coingecko.com/coins/images/10481/large/Tether_Gold.png',
  TGBP:       'https://assets.coingecko.com/coins/images/70647/standard/tgbp-square.png?1762953800',
  ZAMA:       'https://assets.coingecko.com/coins/images/70921/standard/zama.png?1764591992',
  BRON:       'https://assets.coingecko.com/coins/images/70826/standard/Bron_logo_sq.png?1764044817',
  BBQTGBP:    STEAKHOUSE_LOGO,
  STEAKCUSDC: STEAKHOUSE_LOGO,
};

// Optional per-symbol accent color for the initial-circle fallback.
const FALLBACK_COLORS: Record<string, string> = {
  USDC:       '#2775CA',
  USDT:       '#50AF95',
  WETH:       '#627EEA',
  ETH:        '#627EEA',
  XAUT:       '#f59e0b',
  TGBP:       '#10b981',
  ZAMA:       '#FFD208',
  BRON:       '#a78bfa',
  BBQTGBP:    '#1B5E3B',
  STEAKCUSDC: '#1B5E3B',
};

const getBaseSymbol = (symbol: string): string => {
  // Strip disambiguation suffixes added by the registry's dedupeSymbols pass,
  // e.g. "tGBP (Restricted)" or "tGBP (ab12)" — logos key on the bare symbol.
  let sym = symbol.toUpperCase().replace(/\s*\(.*$/, '').trim();
  if (sym.endsWith('MOCK')) {
    sym = sym.slice(0, -4);
  }
  if (sym.startsWith('C') && sym !== 'COIN' && sym !== 'CHIPS') {
    const rest = sym.slice(1);
    if (LOGO_URLS[rest] || rest === 'TGBP') {
      return rest;
    }
  }
  return sym;
};

export default function TokenIcon({ symbol, size = 24, className, style }: TokenIconProps) {
  const [imageError, setImageError] = useState(false);
  const baseSym = getBaseSymbol(symbol);
  const logoUrl = LOGO_URLS[baseSym];
  const color = FALLBACK_COLORS[baseSym] ?? 'var(--text-muted)';

  if (logoUrl && !imageError) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={logoUrl}
          alt={symbol}
          width={size}
          height={size}
          onError={() => setImageError(true)}
          style={{
            borderRadius: '50%',
            objectFit: 'contain',
            width: `${size}px`,
            height: `${size}px`,
            flexShrink: 0,
            ...style,
          }}
          className={className}
        />
      </span>
    );
  }

  // Neutral initial-in-circle fallback — no Lucide icons.
  const initial = baseSym.slice(0, 1);
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: `color-mix(in srgb, ${color} 18%, var(--bg-input))`,
        color,
        fontWeight: 700,
        fontSize: `${Math.max(9, Math.round(size * 0.42))}px`,
        lineHeight: 1,
        flexShrink: 0,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        ...style,
      }}
    >
      {initial}
    </span>
  );
}
