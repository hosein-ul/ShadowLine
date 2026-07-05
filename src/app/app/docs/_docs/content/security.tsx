'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, H2, UL, Callout, PropTable } from '../components';

export default function Security() {
  return (
    <>
      <Lead>
        ShadowLine is a non-custodial interface over audited, open-source contracts. Understanding
        exactly what is private, what is public, and who you trust is the point of this page.
      </Lead>

      <H2>What stays private</H2>
      <UL>
        <li>
          <strong>Balances</strong> — stored on-chain as <code>euint64</code> ciphertext. Not
          readable by validators, indexers, or explorers.
        </li>
        <li>
          <strong>Transfer amounts</strong> — encrypted before submission; the transaction carries a
          ciphertext, not a number.
        </li>
      </UL>

      <H2>What is public</H2>
      <UL>
        <li>
          <strong>Addresses and the interaction graph</strong> — that your address interacted with a
          given wrapper, and when. FHE hides values, not the fact that a transaction happened.
        </li>
        <li>
          <strong>The underlying ERC-20 movements</strong> at shield/unshield boundaries: the moment
          you wrap or unwrap, the public leg (the ERC-20 lock or release) is a normal, visible
          transfer.
        </li>
      </UL>

      <H2>Trust boundaries</H2>
      <PropTable columns={['Party', 'Can it see your balance?', 'Can it move your funds?']}>
        <tr className="docs-prop-row">
          <td>ShadowLine frontend</td>
          <td className="docs-prop-desc">Only after you sign a permit, in your session</td>
          <td className="docs-prop-desc">No — every transfer is signed by your wallet</td>
        </tr>
        <tr className="docs-prop-row">
          <td>Zama Gateway / Relayer</td>
          <td className="docs-prop-desc">Decrypts only ciphertext your session key authorizes</td>
          <td className="docs-prop-desc">No custody of funds</td>
        </tr>
        <tr className="docs-prop-row">
          <td>Public RPC / validators</td>
          <td className="docs-prop-desc">No — only ciphertext handles are on-chain</td>
          <td className="docs-prop-desc">No</td>
        </tr>
      </PropTable>

      <H2>Design guarantees</H2>
      <UL>
        <li>
          <strong>Non-custodial:</strong> no ShadowLine server holds keys or funds. Tokens are locked
          inside the open-source ERC-7984 wrapper contracts.
        </li>
        <li>
          <strong>1:1 collateralization:</strong> every confidential unit is backed by an underlying
          ERC-20 held in the wrapper.
        </li>
        <li>
          <strong>Explicit decryption:</strong> balances are only revealed via an EIP-712 permit you
          sign — the app never auto-decrypts.
        </li>
        <li>
          <strong>Private keys never leave your wallet:</strong> the frontend requests signatures; it
          never sees your key.
        </li>
      </UL>

      <Callout variant="warning">
        <strong>What ShadowLine does not claim:</strong> it is an interface, not a new protocol.
        Confidentiality guarantees come from Zama&apos;s fhEVM and the ERC-7984 contracts. Always
        verify contract addresses (see <Link href="/app/docs/addresses">Contract Addresses</Link>) and
        never enter seed phrases or private keys into any website.
      </Callout>
    </>
  );
}
