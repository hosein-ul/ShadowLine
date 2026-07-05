'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, H2, P, UL, Callout, FeatureGrid } from '../components';

export default function UseCases() {
  return (
    <>
      <Lead>
        ERC-7984 confidential tokens make on-chain amounts invisible to everyone except the holder.
        Here are the real-world patterns ShadowLine is designed to enable.
      </Lead>

      <H2>Private payroll &amp; compensation</H2>
      <P>
        Companies paying contributors on-chain today expose every salary to public scrutiny — anyone
        can track an address and reconstruct the full comp structure. Wrapping payroll tokens into
        confidential wrappers keeps amounts encrypted on-chain. The recipient holds the ciphertext;
        only they can decrypt the value with an EIP-712 permit. Attestations (hire date, role) can
        remain on-chain without leaking the number itself.
      </P>

      <H2>Sealed-bid auctions</H2>
      <P>
        Traditional on-chain auctions require bids to be public, enabling sniping and last-second
        manipulation. With ERC-7984 wrappers, each bid is an encrypted amount submitted to a smart
        contract. The contract performs comparisons on ciphertext — no participant learns another
        bid until the auctioneer chooses to finalize. ShadowLine&apos;s shield flow handles the
        ERC-20 → confidential conversion that feeds into such contracts.
      </P>

      <H2>DAO treasury &amp; budget privacy</H2>
      <P>
        DAOs frequently need to approve grants or operational spending without surfacing exact
        numbers to competitors or exploiters before execution. Confidential token flows let a
        multi-sig hold and transfer budget allocations as encrypted balances. The DAO&apos;s
        governance rules stay on-chain; the amounts move privately until finalization.
      </P>

      <H2>Front-run resistant DeFi</H2>
      <P>
        Any large swap, liquidity provision, or liquidation on a public mempool is visible before
        it lands. Wrapping the input amount keeps MEV bots blind to the size of the upcoming
        trade. The ciphertext is only decrypted inside the EVM at execution time — by then the
        block is already sealed.
      </P>

      <H2>Private P2P payments</H2>
      <P>
        Sending money between wallets reveals the amount to every block explorer, data aggregator,
        and anyone who knows either address. A confidential transfer (see{' '}
        <Link href="/app/docs/transfer">Confidential Transfer</Link>) submits an encrypted amount —
        the recipient must run their own decrypt to learn what they received, and observers see
        only that a transaction occurred.
      </P>

      <H2>Vesting &amp; lockup schedules</H2>
      <P>
        Token vesting contracts that hold large allocations are targets for social engineering and
        market manipulation once balances are known. Wrapping vested amounts as confidential tokens
        removes the live balance signal. The cliff and linear schedule logic stays on-chain; only
        the holder can reveal what has vested so far.
      </P>

      <Callout>
        All of these patterns share one foundation: ERC-20 tokens are locked inside the ERC-7984
        wrapper (1:1 collateralized) and the encrypted handle is what moves on-chain. ShadowLine is
        the interface that makes shielding, unshielding, and transferring those handles easy.
      </Callout>

      <H2>Building on ShadowLine</H2>
      <FeatureGrid
        items={[
          {
            icon: '🔌',
            title: 'REST API',
            desc: 'Fetch all registered wrapper pairs without a wallet — one GET request, any language.',
          },
          {
            icon: '📑',
            title: 'Contract Addresses',
            desc: 'Registry and wrapper addresses for Sepolia and Mainnet, ready to plug into your own contracts.',
          },
          {
            icon: '🏛️',
            title: 'Registry & Discovery',
            desc: 'Query or add custom wrapper pairs on-chain directly from your app.',
          },
          {
            icon: '🔐',
            title: 'Security Model',
            desc: 'Understand the trust boundaries before building anything that moves user funds.',
          },
        ]}
      />

      <UL>
        <li>
          <Link href="/app/docs/rest-api">REST API</Link> — wallet-free pair discovery
        </li>
        <li>
          <Link href="/app/docs/addresses">Contract Addresses</Link> — Sepolia and Mainnet
        </li>
        <li>
          <Link href="/app/docs/registry">Registry &amp; Discovery</Link> — adding custom pairs
        </li>
        <li>
          <Link href="/app/docs/security">Security Model</Link> — trust boundaries
        </li>
      </UL>
    </>
  );
}
