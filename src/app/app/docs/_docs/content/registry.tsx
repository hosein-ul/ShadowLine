'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, Callout } from '../components';

export default function Registry() {
  return (
    <>
      <Lead>
        The <Link href="/app">Registry</Link> is the front door: a live view of every ERC-20 ↔ ERC-7984
        pair, read straight from the on-chain WrappersRegistry for the selected network.
      </Lead>

      <H2>Official vs. custom pairs</H2>
      <P>
        ShadowLine keeps two kinds of pairs strictly separated so a token you added locally can never
        be mistaken for a verified one.
      </P>
      <UL>
        <li>
          <strong>Official Registry</strong> — pairs verified on-chain by the WrappersRegistry
          contract. On Sepolia these are Zama-deployed mock tokens (each carries a{' '}
          <em>Mock</em> badge and has a public <code>mint()</code> you can use from the Faucet).
        </li>
        <li>
          <strong>Custom / dev-only</strong> — pairs you add yourself, stored locally in your
          browser and scoped per chain. They never mix into the official list.
        </li>
      </UL>

      <H2>Network scoping</H2>
      <P>
        The Testnet/Mainnet switch in the header controls which registry is shown. Sepolia pairs and
        Mainnet pairs are never displayed together, and only addresses for the active network appear
        on each row — no cross-network placeholders.
      </P>

      <H2>Adding a custom token</H2>
      <P>
        You can register any ERC-7984 token by address. ShadowLine validates it is genuinely
        confidential: it tries ERC-165 first, and falls back to a behavioral probe of{' '}
        <code>confidentialBalanceOf()</code> for tokens that don&apos;t implement ERC-165. A wrapper
        (one with an <code>underlying()</code>) gets Shield/Unshield actions; a decrypt-only
        confidential token gets its own per-row decrypt.
      </P>

      <Callout>
        Prefer to build against the registry programmatically? The{' '}
        <Link href="/app/docs/rest-api">REST API</Link> returns the same official pairs as JSON with no
        wallet required, and <code>useListPairs</code> gives you the live list inside a React app.
      </Callout>
    </>
  );
}
