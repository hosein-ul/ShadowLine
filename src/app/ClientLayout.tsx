'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Providers from '@/providers/Providers';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAccount } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { type SupportedChainId } from '@/config/chains';
import { SessionResetProvider } from '@/lib/reset-session';

type Theme = 'dark' | 'light';
export type DesignTheme = 'charcoal' | 'midnight' | 'frost' | 'aurora';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

interface DesignThemeContextType {
  designTheme: DesignTheme;
  setDesignTheme: (theme: DesignTheme) => void;
}

interface NetworkContextType {
  isTestnet: boolean;
  setIsTestnet: (isTestnet: boolean) => void;
  activeChainId: SupportedChainId;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const DesignThemeContext = createContext<DesignThemeContextType | undefined>(undefined);
const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function useDesignTheme() {
  const context = useContext(DesignThemeContext);
  if (!context) throw new Error('useDesignTheme must be used within DesignThemeProvider');
  return context;
}

export function useActiveNetwork() {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useActiveNetwork must be used within NetworkProvider');
  return context;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isTestnet, setIsTestnet] = useState(true);

  // Load network preference on mount — force Sepolia while Mainnet relayer API key is pending
  useEffect(() => {
    setIsTestnet(true);
    localStorage.setItem('network-preference', 'testnet');
  }, []);

  const handleSetIsTestnet = (val: boolean) => {
    if (!val) return; // Mainnet is temporarily disabled
    setIsTestnet(val);
    localStorage.setItem('network-preference', 'testnet');
  };

  // Determine active chain ID dynamically (safe now that we are within Providers)
  // While Mainnet relayer API key is pending, force activeChainId to Sepolia (11155111).
  // If the user connects a wallet on Mainnet (chain 1), activeChainId stays Sepolia,
  // prompting all UI actions (like Wrap/Transfer/Portfolio) to show "Switch to Sepolia".
  const activeChainId = sepolia.id as SupportedChainId;

  return (
    <NetworkContext.Provider value={{ isTestnet, setIsTestnet: handleSetIsTestnet, activeChainId }}>
      <ToastProvider>
        <SessionResetProvider>
          <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background var(--t-normal), color var(--t-normal)' }}>
            <Header />
            <main style={{ minHeight: 'calc(100vh - var(--header-h) - 120px)', position: 'relative', zIndex: 1, paddingBottom: 'var(--sp-12)' }}>
              {children}
            </main>
            <Footer />
          </div>
        </SessionResetProvider>
      </ToastProvider>
    </NetworkContext.Provider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [designTheme, setDesignThemeState] = useState<DesignTheme>('charcoal');

  // Load theme and design direction from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const savedDesign = localStorage.getItem('design-theme') as DesignTheme | null;
    const validDesigns: DesignTheme[] = ['charcoal', 'midnight', 'frost', 'aurora'];
    if (savedDesign && validDesigns.includes(savedDesign)) {
      setDesignThemeState(savedDesign);
      document.documentElement.setAttribute('data-design-theme', savedDesign);
    } else {
      setDesignThemeState('charcoal');
      document.documentElement.setAttribute('data-design-theme', 'charcoal');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const setDesignTheme = (nextDesign: DesignTheme) => {
    setDesignThemeState(nextDesign);
    localStorage.setItem('design-theme', nextDesign);
    document.documentElement.setAttribute('data-design-theme', nextDesign);
  };

  return (
    <Providers>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <DesignThemeContext.Provider value={{ designTheme, setDesignTheme }}>
          <LayoutContent>{children}</LayoutContent>
        </DesignThemeContext.Provider>
      </ThemeContext.Provider>
    </Providers>
  );
}
