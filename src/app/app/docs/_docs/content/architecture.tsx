'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, Callout, ArchitectureDiagram, Reveal } from '../components';

export default function Architecture() {
  return (
    <>
      <Lead>
        ShadowLine is a non-custodial frontend. There is no backend that holds keys or funds —
        everything happens between your browser, your wallet, the public RPC, and Zama&apos;s FHE
        infrastructure.
      </Lead>

      <Reveal>
        <ArchitectureDiagram />
      </Reveal>

      <H2>The four moving parts</H2>
      <P>
        Every action in the app resolves to a combination of these four lanes. Reads and writes to
        public state go through Wagmi; anything involving an encrypted value goes through the Zama
        SDK.
      </P>
      <UL>
        <li>
          <strong>ShadowLine UI</strong> — a Next.js app. It renders the registry, forms, and
          balances. It never sees your private key and stores no secrets server-side.
        </li>
        <li>
          <strong>Wagmi + viem</strong> — public RPC for standard EVM reads (allowances, ERC-20
          balances, registry pairs) and for sending transactions your wallet signs.
        </li>
        <li>
          <strong>Zama React SDK</strong> — client-side FHE: it encrypts inputs before they hit the
          chain, requests EIP-712 permits, and asks the Gateway to decrypt values that belong to
          you.
        </li>
        <li>
          <strong>Relayer / Gateway (KMS)</strong> — Zama&apos;s off-chain coprocessor. It performs
          the heavy FHE work and produces the decryption proofs the fhEVM contracts verify on-chain.
        </li>
      </UL>

      <H2>A shield, traced end-to-end</H2>
      <P>
        When you shield 100 USDC: the UI reads your allowance via Wagmi, sends an{' '}
        <code>approve()</code> if needed, waits for the receipt, then calls the wrapper&apos;s{' '}
        <code>wrap()</code>. The wrapper locks the ERC-20 and mints an encrypted <code>euint64</code>{' '}
        balance to you. Nothing about the amount is readable on-chain afterward — only a ciphertext
        handle exists.
      </P>

      <H2>A decrypt, traced end-to-end</H2>
      <P>
        When you reveal a balance: the SDK asks your wallet for an off-chain EIP-712 signature (no
        gas), derives a session key scoped to your address and that contract, and hands it to the
        Gateway. The Gateway decrypts only <em>your</em> ciphertext and returns the plaintext to the
        browser session. See <Link href="/app/docs/permits">EIP-712 Permits</Link> for the full sequence.
      </P>

      <Callout>
        <strong>Non-custodial by construction:</strong> there is no ShadowLine server in any of these
        paths. If this site disappeared tomorrow, your tokens and wrappers would remain fully usable
        directly against the on-chain contracts.
      </Callout>
    </>
  );
}
