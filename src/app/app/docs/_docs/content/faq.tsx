'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2 } from '../components';

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="docs-faq-item">
      <H2>{q}</H2>
      <P>{children}</P>
    </div>
  );
}

export default function Faq() {
  return (
    <>
      <Lead>Short answers to the questions people ask most about confidential tokens.</Lead>

      <QA q="Is my balance really hidden?">
        Yes — on-chain it exists only as an encrypted <code>euint64</code> handle. Validators,
        indexers, and explorers see ciphertext, not a number. Only you, after signing a permit, can
        decrypt it. What stays public is the interaction graph: that your address touched a wrapper,
        and when.
      </QA>

      <QA q="Does decrypting cost gas?">
        No. Decryption uses an off-chain EIP-712 signature. There is no transaction and no gas —
        you&apos;re just proving to the Gateway that the ciphertext is yours.
      </QA>

      <QA q="Why is the wrapper always 6 decimals?">
        FHE works on 64-bit integers (<code>euint64</code>), which would overflow with 18-decimal
        amounts. Wrappers standardize on 6 decimals and scale automatically. See{' '}
        <Link href="/app/docs/decimal-scaling">Decimal Scaling</Link> for the exact shield/unshield rule.
      </QA>

      <QA q="What happens if I close the tab mid-unshield?">
        Nothing is lost. The unwrap request is on-chain and the pending tx hash is saved locally.
        Next visit, ShadowLine detects it and offers a Resume action to finalize. See{' '}
        <Link href="/app/docs/shield">Shield &amp; Unshield</Link>.
      </QA>

      <QA q="Can I use this without the ShadowLine site?">
        Yes. It&apos;s non-custodial and open-source — every operation maps to public contract calls.
        The <Link href="/app/docs/rest-api">REST API</Link> and the documented{' '}
        <Link href="/app/docs/sdk">SDK hooks</Link> let you build your own interface against the same
        registry.
      </QA>

      <QA q="Where do the testnet tokens come from?">
        Sepolia registry pairs are Zama-deployed mock tokens with a public <code>mint()</code>. Grab
        free ones from the Faucet page, then shield them to try the full flow.
      </QA>

      <QA q="A wrapper approval is failing in my wallet — why?">
        Likely a USDT-style token that rejects changing a non-zero allowance directly to another
        non-zero value. Zero the allowance first, then approve the real amount. ShadowLine does this
        automatically; details are on <Link href="/app/docs/shield">Shield &amp; Unshield</Link>.
      </QA>
    </>
  );
}
