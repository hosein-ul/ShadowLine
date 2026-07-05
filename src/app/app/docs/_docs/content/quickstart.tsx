'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, H2, P, UL, Callout, StepList } from '../components';

export default function QuickStart() {
  return (
    <>
      <Lead>
        ShadowLine is ready to use — no installation required. Connect a wallet, pick a token pair,
        and your first confidential balance is on-chain in under a minute.
      </Lead>

      <H2>1. Connect your wallet</H2>
      <P>
        Open the <Link href="/app">Registry</Link> and click <strong>Connect</strong> in the top
        right. ShadowLine works with any EIP-1193 wallet (MetaMask, Rabby, WalletConnect). Switch
        the network toggle to <strong>Sepolia</strong> to use free test tokens, or{' '}
        <strong>Mainnet</strong> for real assets.
      </P>
      <Callout>
        First time on Sepolia? Head to the <Link href="/app/faucet">Faucet</Link> page and mint free
        mock tokens — no ETH required, one click per token.
      </Callout>

      <H2>2. Browse the Registry and pick a pair</H2>
      <P>
        The <Link href="/app">Registry</Link> lists every verified ERC-20 ↔ ERC-7984 wrapper pair
        registered on-chain. Each card shows the public token on top and its confidential wrapper
        below. Use the search bar to find a token by symbol or address.
      </P>
      <P>
        Click <strong>Shield</strong> on any public-token row to go directly to that pair on the{' '}
        <Link href="/app/wrapper">Wrapper</Link> page.
      </P>

      <H2>3. Shield — wrap ERC-20 into a confidential token</H2>
      <P>
        On the <Link href="/app/wrapper">Wrapper</Link> page, enter an amount and click{' '}
        <strong>Shield</strong>. Two wallet prompts follow:
      </P>
      <StepList
        steps={[
          {
            t: 'Approve',
            d: 'Allow the wrapper contract to spend your ERC-20. USDT requires zeroing any existing allowance first.',
          },
          {
            t: 'Wrap',
            d: 'Lock the ERC-20 inside the wrapper. Your encrypted balance (euint64) is minted on-chain.',
          },
        ]}
      />
      <P>
        The Zama Gateway finalizes the ciphertext in a few seconds. Your confidential balance appears
        in the <Link href="/app">Registry</Link> after you click <strong>Decrypt</strong> and sign a
        read-only EIP-712 permit.
      </P>

      <H2>4. Transfer or decrypt</H2>
      <P>
        Once shielded, you have two options:
      </P>
      <UL>
        <li>
          <strong>Confidential Transfer</strong> — go to <Link href="/app/transfer">Transfer</Link>,
          pick the confidential token, enter a recipient and amount. The amount is encrypted
          client-side before submission. On-chain observers see the addresses but never the value.
        </li>
        <li>
          <strong>Decrypt balance</strong> — on the Registry or Portfolio page, click{' '}
          <strong>Decrypt</strong> next to any confidential row. Sign the EIP-712 permit in your
          wallet. No tokens move; the balance is decrypted only inside your browser session.
        </li>
      </UL>

      <H2>5. Unshield when you are done</H2>
      <P>
        To recover your original ERC-20, go to the <Link href="/app/wrapper">Wrapper</Link> page,
        switch to <strong>Unshield</strong>, and enter the amount. The Zama Gateway decrypts
        on-chain and releases the underlying ERC-20 back to your wallet (typically 30–60 seconds).
        If the page closes mid-flow, the <strong>Resume</strong> banner re-appears automatically on
        your next visit.
      </P>

      <Callout variant="warning">
        <strong>Decimal note:</strong> shield amounts use the <em>underlying</em> token&apos;s
        decimals (e.g. 6 for USDC, 18 for WETH). Unshield always uses the wrapper&apos;s fixed{' '}
        6-decimal scale. See <Link href="/app/docs/decimal-scaling">Decimal Scaling</Link> for the
        full rule.
      </Callout>
    </>
  );
}
