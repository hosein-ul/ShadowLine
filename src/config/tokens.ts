export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  color: string;
}

/**
 * Token metadata for UI display.
 * Maps token symbols to their display info.
 */
export const TOKEN_INFO: Record<string, TokenInfo> = {
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoUrl: '/tokens/usdc.svg',
    color: '#2775CA',
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    logoUrl: '/tokens/usdt.svg',
    color: '#50AF95',
  },
  WETH: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    logoUrl: '/tokens/weth.svg',
    color: '#627EEA',
  },
  ZAMA: {
    name: 'Zama Token',
    symbol: 'ZAMA',
    decimals: 18,
    logoUrl: '/tokens/zama.svg',
    color: '#FFD208',
  },
  ETH: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUrl: '/tokens/eth.svg',
    color: '#627EEA',
  },
  BRON: {
    name: 'BRON Token',
    symbol: 'BRON',
    decimals: 18,
    logoUrl: '/tokens/default.svg',
    color: '#a78bfa',
  },
  TGBP: {
    name: 'Tether GBP',
    symbol: 'tGBP',
    decimals: 18,
    logoUrl: '/tokens/default.svg',
    color: '#10b981',
  },
  XAUT: {
    name: 'Tether Gold',
    symbol: 'XAUt',
    decimals: 6,
    logoUrl: '/tokens/default.svg',
    color: '#f59e0b',
  },
};

/**
 * Get token info by symbol, with fallback for unknown tokens.
 */
export function getTokenInfo(symbol: string): TokenInfo {
  const sym = symbol.toUpperCase();
  return TOKEN_INFO[sym] ?? {
    name: symbol,
    symbol: symbol,
    decimals: 18,
    logoUrl: '/tokens/default.svg',
    color: '#9d9db5',
  };
}

/**
 * Get logo URL for a token.
 */
export function getTokenLogo(symbol: string): string {
  return getTokenInfo(symbol).logoUrl;
}

/**
 * Generate initials for tokens.
 */
export function getTokenInitials(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase();
}
