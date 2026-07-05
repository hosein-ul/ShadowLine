'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, CodeBlock, Callout } from '../components';

export default function QuickStart() {
  return (
    <>
      <Lead>Integrate Zama confidential tokens into your app in three steps.</Lead>

      <H2>1. Install dependencies</H2>
      <CodeBlock
        lang="bash"
        filename="terminal"
        code={`npm install @zama-fhe/react-sdk wagmi viem @tanstack/react-query`}
      />

      <H2>2. Wrap your app with providers</H2>
      <P>
        ShadowLine uses Wagmi for wallet connections and the Zama React SDK for FHE operations. Both
        must be initialized at the root of your app.
      </P>
      <CodeBlock
        lang="tsx"
        filename="providers.tsx"
        code={`import { WagmiProvider, http, createConfig, fallback } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ZamaProvider } from '@zama-fhe/react-sdk';
import { sepolia, mainnet } from 'wagmi/chains';

const config = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: fallback([http(process.env.NEXT_PUBLIC_SEPOLIA_RPC), http()]),
    [mainnet.id]: fallback([http(process.env.NEXT_PUBLIC_MAINNET_RPC), http()]),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider>{children}</ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}`}
      />

      <H2>3. Fetch pairs and shield tokens</H2>
      <P>
        Use the live registry to get all wrapper pairs, then call <code>useShield</code> to wrap
        your first token.
      </P>
      <CodeBlock
        lang="tsx"
        filename="app.tsx"
        code={`import { useListPairs, useShield } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';

function ShieldButton() {
  const { data } = useListPairs({ page: 1, pageSize: 50, metadata: true });
  const firstPair = data?.pairs[0];

  const { mutateAsync: shield, isPending } = useShield({
    tokenAddress: firstPair?.confidentialToken,
  });

  const handleShield = async () => {
    // amount uses the UNDERLYING token's decimals (e.g. 6 for USDC)
    await shield({ amount: parseUnits('100', 6) });
  };

  return (
    <button onClick={handleShield} disabled={isPending}>
      {isPending ? 'Shielding…' : 'Shield 100 USDC'}
    </button>
  );
}`}
      />

      <Callout variant="warning">
        <strong>Before you go further:</strong> the single most common integration bug is decimal
        mismatch. Read <Link href="/app/docs/decimal-scaling">Decimal Scaling</Link> before wiring up real
        amounts — shield uses the underlying decimals, unshield always uses 6.
      </Callout>
    </>
  );
}
