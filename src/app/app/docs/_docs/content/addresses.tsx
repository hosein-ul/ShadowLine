'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, AddressTable } from '../components';
import { useRegistryPairs } from '@/lib/registry';
import { sepolia, mainnet } from 'viem/chains';
import { REGISTRY_ADDRESSES } from '@/config/contracts';

export default function Addresses() {
  const { pairs: sepoliaPairs } = useRegistryPairs(sepolia.id);
  const { pairs: mainnetPairs } = useRegistryPairs(mainnet.id);

  const sepoliaFormatted = sepoliaPairs
    .filter((p) => p.source !== 'custom' && !p.unverified)
    .map((p) => ({
      symbol: p.symbol,
      erc20: p.erc20Address,
      wrapper: p.erc7984Address,
      decimals: p.decimals,
    }));

  const mainnetFormatted = mainnetPairs
    .filter((p) => p.source !== 'custom' && !p.unverified)
    .map((p) => ({
      symbol: p.symbol,
      erc20: p.erc20Address,
      wrapper: p.erc7984Address,
      decimals: p.decimals,
    }));

  return (
    <>
      <Lead>
        All addresses below are sourced directly from the official on-chain WrappersRegistry and verified
        in real-time. This ensures every registered pair is always present and up-to-date.
      </Lead>

      <H2>Sepolia Testnet</H2>
      <AddressTable
        network="Sepolia"
        registry={REGISTRY_ADDRESSES[sepolia.id]}
        pairs={sepoliaFormatted}
      />
      <P>
        The pairs above are <strong>mock tokens</strong> with a public <code>mint()</code> — grab
        free test tokens from the Faucet page. Addresses read live from the on-chain registry.
      </P>

      <H2>Ethereum Mainnet</H2>
      <AddressTable
        network="Mainnet"
        registry={REGISTRY_ADDRESSES[mainnet.id]}
        pairs={mainnetFormatted}
      />
      <P>
        These pairs reflect the live on-chain registry on Ethereum Mainnet. You can also query this list
        programmatically via the <Link href="/app/docs/rest-api">REST API</Link> or view live analytics on the{' '}
        <Link href="/app">Registry page</Link>.
      </P>
    </>
  );
}

