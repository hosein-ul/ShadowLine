'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, Callout, FeatureGrid, Reveal } from '../components';

export default function Overview() {
  return (
    <>
      <Lead>
        ShadowLine is the canonical interface and developer toolkit for Zama&apos;s confidential
        token ecosystem. It lets users and developers discover, wrap, unwrap, transfer, and decrypt
        ERC-20 tokens that have been converted into confidential ERC-7984 wrappers using{' '}
        <strong>Fully Homomorphic Encryption (FHE)</strong>.
      </Lead>

      <Reveal>
        <FeatureGrid
          items={[
            {
              icon: '🔍',
              title: 'Registry Explorer',
              desc: 'Live on-chain discovery of every registered ERC-20 ↔ ERC-7984 wrapper pair via the WrappersRegistry contract on Sepolia and Mainnet.',
            },
            {
              icon: '🛡️',
              title: 'Shield & Unshield',
              desc: 'Wrap public ERC-20 tokens into encrypted confidential tokens, and unwrap them back — with automatic resume for interrupted operations.',
            },
            {
              icon: '👁️',
              title: 'Confidential Balances',
              desc: 'Decrypt your encrypted portfolio balance with an EIP-712 permit signed in your wallet. It never auto-fires — always an explicit action.',
            },
            {
              icon: '🔌',
              title: 'Public REST API',
              desc: 'Fetch all wrapper pairs from any language with a single GET request — no SDK or wallet connection required.',
            },
          ]}
        />
      </Reveal>

      <H2>Who this is for</H2>
      <P>
        <strong>Users</strong> get a simple UI to privatize on-chain balances: shield a token, send
        it confidentially, and reveal balances only to yourself. <strong>Developers</strong> get a
        public REST API, a documented set of React SDK hooks, and verified contract addresses so
        they can build on the same registry ShadowLine does.
      </P>

      <H2>How to read these docs</H2>
      <P>
        Start with the <Link href="/app/docs/quickstart">Quick Start</Link> if you want to ship
        something today, or the <Link href="/app/docs/architecture">Architecture</Link> and{' '}
        <Link href="/app/docs/fhe">FHE &amp; ERC-7984</Link> pages if you want to understand the
        model first. The <strong>Guides</strong> walk through each product feature; the{' '}
        <strong>Developers</strong> and <strong>Reference</strong> sections are the lookup material
        you&apos;ll come back to. Use the <em>Next</em> button at the bottom of any page to read
        straight through.
      </P>

    </>
  );
}
