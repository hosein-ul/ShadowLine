'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider as WagmiProviderBase, createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { ZamaProvider, RelayerWeb, indexedDBStorage, SepoliaConfig, MainnetConfig } from '@zama-fhe/react-sdk';
import { WagmiSigner } from '@zama-fhe/react-sdk/wagmi';

// WalletConnect project ID — register at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// Stable high-performance Alchemy RPC endpoints
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.ankr.com/eth_sepolia';
const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://cloudflare-eth.com';

export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID !== 'demo'
      ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
    [mainnet.id]: http(MAINNET_RPC),
  },
  ssr: true,
});

export const signer = new WagmiSigner({ config: wagmiConfig });

export const relayer = new RelayerWeb({
  getChainId: () => signer.getChainId(),
  transports: {
    [sepolia.id]: {
      ...SepoliaConfig,
      network: SEPOLIA_RPC,
    },
    [mainnet.id]: {
      ...MainnetConfig,
      network: MAINNET_RPC,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 2,
      },
    },
  }));

  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider relayer={relayer} signer={signer} storage={indexedDBStorage}>
          {children}
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}

