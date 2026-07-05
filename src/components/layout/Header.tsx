'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useTheme, useActiveNetwork } from '@/app/ClientLayout';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { formatAddress } from '@/lib/utils';
import { useSessionReset } from '@/lib/reset-session';
import {
  Sun,
  Moon,
  Wallet,
  ChevronDown,
  Check,
  Copy,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

/**
 * Product + informational routes — all shown directly in the desktop nav bar.
 * Kept to short labels so the row stays on one line at common desktop widths;
 * below the tablet breakpoint the whole nav collapses into the hamburger drawer.
 */
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: '/app', label: 'Registry' },
  { href: '/app/wrap', label: 'Wrap' },
  { href: '/app/transfer', label: 'Transfer' },
  { href: '/app/portfolio', label: 'Portfolio' },
  { href: '/app/faucet', label: 'Faucet', badge: 'TESTNET' },
  { href: '/app/learn', label: 'Learn' },
  { href: '/app/analytics', label: 'Analytics' },
  { href: '/app/docs', label: 'Docs' },
];

/** Only the external marketing site stays tucked into the compact "More" menu. */
const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Marketing Site' },
];

const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isTestnet, setIsTestnet, activeChainId } = useActiveNetwork();

  // Wagmi Hooks
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // App-wide FHE credential reset (wired via SessionResetProvider in ClientLayout).
  const { reset: resetSession, isResetting } = useSessionReset();

  // Local state for modals & dropdowns
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo — links to the marketing landing page, not the dApp */}
        <Link href="/" className="header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="var(--radius-sm)" fill="var(--accent)" />
            <path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="var(--bg-base)" />
          </svg>
          <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Shadow</span>
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Line</span>
        </Link>

        {/* Navigation — desktop only; mobile uses the hamburger drawer below */}
        <nav className="header-nav">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn('header-link', pathname === item.href && 'active')}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {item.label}
              {item.badge && (
                <Badge variant="default" size="sm" style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

        </nav>

        {/* Mobile hamburger — shown only below the tablet breakpoint */}
        <button
          className="btn btn-secondary btn-icon nav-hamburger"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

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
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        isLoading={isResetting}
                        onClick={() => { void resetSession(); }}
                        title="Wipes cached FHE decrypt permits — next decrypt prompts for a fresh wallet signature."
                        style={{ gap: 6, justifyContent: 'center' }}
                      >
                        <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
                        Reset Decryption Session
                      </Button>
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
              title="Connect Wallet"
            >
              <Wallet size={16} />
              <span className="btn-connect-label">Connect Wallet</span>
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
              Choose a wallet provider to connect to ShadowLine.
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

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-nav-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <Link
                href="/"
                className="header-logo"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="var(--radius-sm)" fill="var(--accent)" />
                  <path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="var(--bg-base)" />
                </svg>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>Shadow</span>
                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Line</span>
              </Link>
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mobile-nav-list">
              {ALL_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('mobile-nav-link', pathname === item.href && 'active')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                  {item.badge && (
                    <Badge variant="default" size="sm" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
