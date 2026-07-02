import React, { useState } from 'react';
import { SiEthereum, SiTether } from 'react-icons/si';
import { Coins, Cpu, PoundSterling, Landmark, CircleDollarSign } from 'lucide-react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const LOGO_URLS: Record<string, string> = {
  ZAMA: '/tokens/zama.png',
  XAUT: 'https://assets.coingecko.com/coins/images/10481/large/Tether_Gold.png',
  WETH: '/tokens/weth.png',
  ETH: '/tokens/eth.png',
  BRON: '/tokens/bron.png',
  USDT: '/tokens/usdt.png',
  TGBP: 'https://assets.coingecko.com/coins/images/70647/standard/tgbp-square.png?1762953800',
  USDC: '/tokens/usdc.png',
};

const getBaseSymbol = (symbol: string): string => {
  let sym = symbol.toUpperCase();
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
  const sym = symbol.toUpperCase();
  const baseSym = getBaseSymbol(symbol);
  const logoUrl = LOGO_URLS[baseSym];

  const getFallbackIcon = () => {
    if (sym.includes('USDC')) return <CircleDollarSign size={size} style={{ color: '#2775CA', ...style }} className={className} />;
    if (sym.includes('USDT')) return <SiTether size={size} style={{ color: '#50AF95', ...style }} className={className} />;
    if (sym.includes('WETH') || sym === 'ETH') return <SiEthereum size={size} style={{ color: '#627EEA', ...style }} className={className} />;
    if (sym.includes('ZAMA')) return <Cpu size={size} style={{ color: 'var(--accent)', ...style }} className={className} />;
    if (sym.includes('BRON')) return <Coins size={size} style={{ color: '#a78bfa', ...style }} className={className} />;
    if (sym.includes('GBP')) return <PoundSterling size={size} style={{ color: '#10b981', ...style }} className={className} />;
    if (sym.includes('XAUT')) return <Landmark size={size} style={{ color: '#f59e0b', ...style }} className={className} />;
    return <Coins size={size} style={{ color: 'var(--text-muted)', ...style }} className={className} />;
  };

  if (logoUrl && !imageError) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {getFallbackIcon()}
    </span>
  );
}
