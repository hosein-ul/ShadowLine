'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import TokenIcon from '@/components/ui/TokenIcon';
import { KNOWN_WRAPPERS } from '@/config/contracts';
import { formatAddress } from '@/lib/utils';
import { useActiveNetwork } from '@/app/ClientLayout';
import BlurIn from '@/components/ui/BlurIn';
import {
  Search,
  Lock,
  Shield,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isTestnet, setIsTestnet, activeChainId } = useActiveNetwork();

  const wrappers = KNOWN_WRAPPERS[activeChainId] ?? [];

  const filteredWrappers = useMemo(() => {
    if (!searchQuery) return wrappers;
    const q = searchQuery.toLowerCase();
    return wrappers.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.symbol.toLowerCase().includes(q) ||
        w.erc20Address.toLowerCase().includes(q) ||
        w.erc7984Address.toLowerCase().includes(q)
    );
  }, [wrappers, searchQuery]);

  const explorerBase = isTestnet
    ? 'https://sepolia.etherscan.io'
    : 'https://etherscan.io';

  return (
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 2 }}>
      {/* Page Header */}
      <div className="page-header" style={{ position: 'relative', zIndex: 2 }}>
        <h1>
          <BlurIn text="Confidential Wrapper Registry" duration={600} />
        </h1>
        <p style={{ marginTop: 'var(--sp-2)' }}>
          <BlurIn
            text="Discover all verified ERC-20 ↔ ERC-7984 confidential wrapper pairs on Ethereum and Sepolia. Wrap standard assets using FHE to privatize balances."
            duration={800}
            delay={200}
          />
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3 gap-4" style={{ marginBottom: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>Registered Pairs</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }} className="text-gradient">
            {wrappers.length}
          </div>
        </Card>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>Active Network</div>
          <div className="flex items-center gap-2">
            <Badge variant={isTestnet ? 'warning' : 'success'} dot>
              {isTestnet ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
            </Badge>
          </div>
        </Card>
        <Card variant="glass" padding="md" hover>
          <div className="text-muted text-sm" style={{ marginBottom: 'var(--sp-2)' }}>FHE Security</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }} className="flex items-center gap-2">
            <span>ERC-7984 Standard</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)' }}>
              <Lock size={16} />
            </span>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex justify-between items-center gap-4" style={{ marginBottom: 'var(--sp-6)', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="input"
            placeholder="Search by token, symbol, or address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <div className="network-switcher">
          <button
            className={`network-option ${isTestnet ? 'active' : ''}`}
            onClick={() => setIsTestnet(true)}
          >
            Sepolia
          </button>
          <button
            className={`network-option ${!isTestnet ? 'active' : ''}`}
            onClick={() => setIsTestnet(false)}
          >
            Mainnet
          </button>
        </div>
      </div>

      {/* Token Table */}
      <div className="table-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Token Name</th>
              <th>ERC-20 Public Address</th>
              <th>ERC-7984 Wrapped Address</th>
              <th>Decimals</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWrappers.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state" style={{ padding: 'var(--sp-12) var(--sp-8)' }}>
                    <div className="empty-state-icon" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <Search size={32} />
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--sp-4)' }}>
                      {searchQuery ? 'No tokens match your search query' : 'No registered wrappers found on this network'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWrappers.map(wrapper => {
                return (
                  <tr key={wrapper.erc20Address}>
                    {/* Token Info */}
                    <td>
                      <div className="table-token">
                        <TokenIcon symbol={wrapper.symbol} size={28} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{wrapper.name}</div>
                          <div className="text-muted text-xs">{wrapper.symbol}</div>
                        </div>
                      </div>
                    </td>

                    {/* ERC-20 Address */}
                    <td>
                      <div className="table-address">
                        <a
                          href={`${explorerBase}/address/${wrapper.erc20Address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{ color: 'var(--text-secondary)', transition: 'color 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                          {formatAddress(wrapper.erc20Address, 6)}
                          <ExternalLink size={12} />
                        </a>
                        <CopyButton text={wrapper.erc20Address} />
                      </div>
                    </td>

                    {/* ERC-7984 Wrapper Address */}
                    <td>
                      <div className="table-address">
                        <a
                          href={`${explorerBase}/address/${wrapper.erc7984Address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                          style={{ color: 'var(--accent)', transition: 'opacity 150ms' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          {formatAddress(wrapper.erc7984Address, 6)}
                          <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
                        </a>
                        <CopyButton text={wrapper.erc7984Address} />
                      </div>
                    </td>

                    {/* Decimals */}
                    <td>
                      <Badge variant="default" style={{ gap: '4px' }}>
                        {wrapper.decimals !== wrapper.wrapperDecimals ? (
                          <>
                            <span>{wrapper.decimals}</span>
                            <span style={{ opacity: 0.5 }}>/</span>
                            <span style={{ color: 'var(--accent)' }}>{wrapper.wrapperDecimals}</span>
                          </>
                        ) : (
                          wrapper.decimals
                        )}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <Link href={`/wrap?token=${wrapper.symbol}&action=wrap`}>
                          <Button variant="primary" size="sm" style={{ gap: '4px' }}>
                            <Shield size={12} /> Shield
                          </Button>
                        </Link>
                        <Link href={`/wrap?token=${wrapper.symbol}&action=unwrap`}>
                          <Button variant="secondary" size="sm">
                            Unshield
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Banner */}
      <Card variant="glass" padding="md" style={{ marginTop: 'var(--sp-8)', position: 'relative', zIndex: 2 }}>
        <div className="flex items-start gap-4">
          <div style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', marginTop: '2px' }}>
            <Info size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Underlying Mechanism</span>
              <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }}>
                <Lock size={14} />
              </span>
            </div>
            <div className="text-muted text-sm" style={{ lineHeight: 'var(--lh-relaxed)' }}>
              Confidential wrappers convert standard public tokens into ERC-7984 tokens utilizing Fully Homomorphic Encryption (FHE) on the fhEVM. 
              On-chain values (like account balances and transaction transfer quantities) are fully encrypted into cryptographic handles, 
              protecting transaction details from public ledger scraping.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
