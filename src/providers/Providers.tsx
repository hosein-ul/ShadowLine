'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider as WagmiProviderBase, createConfig, http, fallback } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { ZamaProvider, RelayerWeb, SepoliaConfig, MainnetConfig } from '@zama-fhe/react-sdk';
import { WagmiSigner } from '@zama-fhe/react-sdk/wagmi';
import { indexedDBStorage, IndexedDBStorage } from '@zama-fhe/sdk';

// WalletConnect project ID — register at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// Dedicated Alchemy RPCs and reliable public backups
const SEPOLIA_ALCHEMY = process.env.NEXT_PUBLIC_SEPOLIA_RPC;
const MAINNET_ALCHEMY = process.env.NEXT_PUBLIC_MAINNET_RPC;

export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID !== 'demo'
      ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [sepolia.id]: fallback([
      ...(SEPOLIA_ALCHEMY ? [http(SEPOLIA_ALCHEMY)] : []),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://sepolia.gateway.tenderly.co'),
    ]),
    [mainnet.id]: fallback([
      ...(MAINNET_ALCHEMY ? [http(MAINNET_ALCHEMY)] : []),
      http('https://ethereum-rpc.publicnode.com'),
      http('https://cloudflare-eth.com'),
    ]),
  },
  ssr: true,
});

export const signer = new WagmiSigner({ config: wagmiConfig });

export const relayer = new RelayerWeb({
  getChainId: () => signer.getChainId(),
  transports: {
    [sepolia.id]: {
      ...SepoliaConfig,
      network: SEPOLIA_ALCHEMY || 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    [mainnet.id]: {
      ...MainnetConfig,
      network: MAINNET_ALCHEMY || 'https://ethereum-rpc.publicnode.com',
    },
  },
});

// storage (FHE keypair) and sessionStorage (wallet permit) MUST be separate stores
// to prevent credential cache corruption in IndexedDB.
// In @zama-fhe/react-sdk v3.0.1, the prop for wallet permit storage is named `sessionStorage`.
const permitDBStorage = new IndexedDBStorage('PermitStore');

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
        <ZamaProvider
          relayer={relayer}
          signer={signer}
          storage={indexedDBStorage}
          sessionStorage={permitDBStorage}
        >
          {children}
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}

