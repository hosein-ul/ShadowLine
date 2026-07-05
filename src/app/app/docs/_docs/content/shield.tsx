'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, CodeBlock, Callout, ShieldFlowDiagram, Reveal } from '../components';

export default function Shield() {
  return (
    <>
      <Lead>
        Shielding wraps a public ERC-20 into its confidential ERC-7984 form; unshielding does the
        reverse. In the app both live on the <Link href="/app/wrapper">Wrap</Link> page.
      </Lead>

      <Reveal>
        <ShieldFlowDiagram />
      </Reveal>

      <H2>Shield (wrap)</H2>
      <P>
        A shield is a two-transaction dance: an ERC-20 <code>approve()</code> so the wrapper can pull
        your tokens, then <code>wrap()</code>, which locks the ERC-20 and mints you an encrypted{' '}
        <code>euint64</code> balance. ShadowLine runs the approval, waits for its receipt, refreshes
        the allowance, then wraps — passing <code>approvalStrategy: &apos;skip&apos;</code> so the SDK
        doesn&apos;t try to approve again.
      </P>
      <CodeBlock
        lang="tsx"
        filename="shield-flow.ts"
        code={`// 1. Approve (only if current allowance is insufficient)
await writeContract({ address: erc20, abi: ERC20_ABI, functionName: 'approve',
  args: [wrapper, amount] });
await waitForTransactionReceipt({ hash });
await refetchAllowance();

// 2. Wrap — allowance is already in place, so skip the SDK's approval step
await shield({ amount, approvalStrategy: 'skip' });`}
      />

      <Callout variant="warning">
        <strong>USDT-style tokens:</strong> some ERC-20s (real USDT, and this app&apos;s USDTMock
        which replicates it) revert an <code>approve()</code> that changes a non-zero allowance
        straight to another non-zero value. If an allowance is already outstanding, zero it first
        (<code>approve(spender, 0)</code>, await the receipt), then approve the real amount. Standard
        tokens with a zero allowance are unaffected.
      </Callout>

      <H2>Unshield (unwrap)</H2>
      <P>
        Unshielding is two phases. First an on-chain <code>unwrap()</code> request burns your
        ciphertext and registers the intent. Then Zama&apos;s Gateway produces a decryption proof and
        finalizes the unwrap — typically ~30–60 seconds later — releasing the underlying ERC-20 back
        to your address.
      </P>
      <UL>
        <li>Amounts for unshield always use 6 decimals (wrapper decimals).</li>
        <li>
          Because finalization is asynchronous, the pending unwrap tx hash is persisted so the
          operation can be resumed if you close the tab.
        </li>
      </UL>

      <H2>Resuming an interrupted unshield</H2>
      <P>
        The SDK does not auto-persist the pending unwrap. ShadowLine saves the unwrap tx hash the
        moment it&apos;s submitted; on the next visit it reads it back with{' '}
        <code>loadPendingUnshield</code> and offers a Resume action wired to{' '}
        <code>useResumeUnshield</code>. See the <Link href="/app/docs/sdk">SDK Hooks</Link> page for the
        exact signatures.
      </P>

      <Callout>
        The activity feed on the Wrap page auto-refreshes a few seconds after a shield or unshield
        confirms, so a fresh transaction appears without a manual reload.
      </Callout>
    </>
  );
}
