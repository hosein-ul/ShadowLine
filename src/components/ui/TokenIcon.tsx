import React from 'react';
import { SiEthereum, SiTether } from 'react-icons/si';
import { Coins, Cpu, PoundSterling, Landmark, CircleDollarSign } from 'lucide-react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function TokenIcon({ symbol, size = 24, className, style }: TokenIconProps) {
  const sym = symbol.toUpperCase();
  
  const getIcon = () => {
    if (sym.includes('USDC')) return <CircleDollarSign size={size} style={{ color: '#2775CA', ...style }} className={className} />;
    if (sym.includes('USDT')) return <SiTether size={size} style={{ color: '#50AF95', ...style }} className={className} />;
    if (sym.includes('WETH') || sym === 'ETH') return <SiEthereum size={size} style={{ color: '#627EEA', ...style }} className={className} />;
    if (sym.includes('ZAMA')) return <Cpu size={size} style={{ color: 'var(--accent)', ...style }} className={className} />;
    if (sym.includes('BRON')) return <Coins size={size} style={{ color: '#a78bfa', ...style }} className={className} />;
    if (sym.includes('GBP')) return <PoundSterling size={size} style={{ color: '#10b981', ...style }} className={className} />;
    if (sym.includes('XAUT')) return <Landmark size={size} style={{ color: '#f59e0b', ...style }} className={className} />;
    return <Coins size={size} style={{ color: 'var(--text-muted)', ...style }} className={className} />;
  };

  return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{getIcon()}</span>;
}
