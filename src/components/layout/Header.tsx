'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useTheme, useDesignTheme, useActiveNetwork, type DesignTheme } from '@/app/ClientLayout';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { formatAddress } from '@/lib/utils';
import {
  Sun,
  Moon,
  Wallet,
  ChevronDown,
  Check,
  Copy,
  Palette,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Registry' },
  { href: '/wrap', label: 'Wrap / Unwrap' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/faucet', label: 'Faucet' },
];

const THEME_OPTIONS: { value: DesignTheme; label: string }[] = [
  { value: 'charcoal', label: 'Nordic Charcoal' },
  { value: 'midnight', label: 'Nordic Midnight' },
  { value: 'frost', label: 'Nordic Frost' },
  { value: 'aurora', label: 'Nordic Aurora' },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { designTheme, setDesignTheme } = useDesignTheme();
  const { isTestnet, setIsTestnet, activeChainId } = useActiveNetwork();

  // Wagmi Hooks
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Local state for modals & dropdowns
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDesignDropdownOpen, setIsDesignDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address', err);
    }
  };

  const handleNetworkToggle = (targetIsTestnet: boolean) => {
    if (isConnected) {
      const targetChainId = targetIsTestnet ? sepolia.id : mainnet.id;
      switchChain({ chainId: targetChainId });
    } else {
      setIsTestnet(targetIsTestnet);
    }
  };

  const activeThemeLabel = THEME_OPTIONS.find(opt => opt.value === designTheme)?.label || 'Nordic Charcoal';

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="var(--radius-sm)" fill="var(--accent)" />
            <path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="var(--bg-base)" />
          </svg>
          <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Zama</span>
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Vault</span>
        </Link>

        {/* Navigation */}
        <nav className="header-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn('header-link', pathname === item.href && 'active')}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {item.label}
              {item.label === 'Faucet' && (
                <Badge variant="accent" size="sm" style={{ marginLeft: '6px', fontSize: '9px' }}>
                  TESTNET
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {/* Light/Dark Toggle */}
          <button
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            style={{ 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Design Swapper Dropdown */}
          {theme === 'dark' && (
            <div className="theme-selector-dropdown">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDesignDropdownOpen((prev) => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}
              >
                <Palette size={14} />
                <span>{activeThemeLabel}</span>
                <ChevronDown size={14} />
              </button>

              {isDesignDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                    onClick={() => setIsDesignDropdownOpen(false)}
                  />
                  <div className="theme-dropdown-menu animate-slide-up">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={cn(
                          'theme-dropdown-item',
                          designTheme === opt.value && 'active'
                        )}
                        onClick={() => {
                          setDesignTheme(opt.value);
                          setIsDesignDropdownOpen(false);
                        }}
                      >
                        <span>{opt.label}</span>
                        {designTheme === opt.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Network Switcher */}
          <div className="network-switcher">
            <button
              className={cn('network-option', isTestnet && 'active')}
              onClick={() => handleNetworkToggle(true)}
            >
              Sepolia
            </button>
            <button
              className={cn('network-option', !isTestnet && 'active')}
              onClick={() => handleNetworkToggle(false)}
            >
              Mainnet
            </button>
          </div>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDetailsOpen((prev) => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}
              >
                <Wallet size={16} />
                <span>{formatAddress(address)}</span>
                <ChevronDown size={14} />
              </button>

              {/* Connected Details Dropdown */}
              {isDetailsOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                    onClick={() => setIsDetailsOpen(false)}
                  />
                  <div
                    className="card animate-slide-up"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + var(--sp-2))',
                      width: '260px',
                      zIndex: 200,
                      boxShadow: 'var(--shadow-lg)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      padding: 'var(--sp-4)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                      <div>
                        <div className="text-xs text-muted">Connected with</div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {connector?.name || 'Injected Wallet'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Wallet Address</div>
                        <div className="font-mono text-xs" style={{ wordBreak: 'break-all', marginTop: '2px' }}>
                          {address}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)' }}>
                        <Button variant="secondary" size="sm" fullWidth onClick={handleCopy}>
                          {copied ? (
                            <>
                              <Check size={14} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          fullWidth
                          onClick={() => {
                            disconnect();
                            setIsDetailsOpen(false);
                          }}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsConnectModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {isConnectModalOpen && (
        <Modal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          title="Connect a Wallet"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="text-sm text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
              Choose a wallet provider to connect to ZamaVault.
            </div>
            {connectors.map((c) => (
              <button
                key={c.id}
                className="btn btn-secondary btn-full"
                style={{
                  justifyContent: 'space-between',
                  padding: 'var(--sp-4) var(--sp-5)',
                  fontSize: 'var(--text-base)',
                }}
                onClick={() => {
                  connect({ connector: c });
                  setIsConnectModalOpen(false);
                }}
              >
                <span>{c.name}</span>
                <span className="text-xs text-muted">→</span>
              </button>
            ))}
            {connectors.length === 0 && (
              <div className="text-sm text-center text-muted" style={{ padding: 'var(--sp-4) 0' }}>
                No wallets detected. Please install MetaMask or Rabby to get started.
              </div>
            )}
          </div>
        </Modal>
      )}
    </header>
  );
}
