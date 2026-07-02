'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Providers from '@/providers/Providers';
import { ToastProvider } from '@/components/ui/Toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAccount } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { type SupportedChainId } from '@/config/chains';

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

  // Load network preference on mount
  useEffect(() => {
    const savedNetwork = localStorage.getItem('network-preference');
    if (savedNetwork) {
      setIsTestnet(savedNetwork === 'testnet');
    }
  }, []);

  const handleSetIsTestnet = (val: boolean) => {
    setIsTestnet(val);
    localStorage.setItem('network-preference', val ? 'testnet' : 'mainnet');
  };

  // Determine active chain ID dynamically (safe now that we are within Providers)
  const { chain, isConnected } = useAccount();
  const activeChainId = (isConnected && chain && (chain.id === sepolia.id || chain.id === mainnet.id)
    ? chain.id 
    : (isTestnet ? sepolia.id : mainnet.id)) as SupportedChainId;

  // Keep isTestnet in sync with connected wallet chain
  useEffect(() => {
    if (isConnected && chain) {
      setIsTestnet(chain.id === sepolia.id);
    }
  }, [chain, isConnected]);

  return (
    <NetworkContext.Provider value={{ isTestnet, setIsTestnet: handleSetIsTestnet, activeChainId }}>
      <ToastProvider>
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background var(--t-normal), color var(--t-normal)' }}>
          <Header />
          <main style={{ minHeight: 'calc(100vh - var(--header-h) - 120px)', position: 'relative', zIndex: 1, paddingBottom: 'var(--sp-12)' }}>
            {children}
          </main>
          <Footer />
        </div>
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
