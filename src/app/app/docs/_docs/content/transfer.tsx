'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, CodeBlock, Callout } from '../components';

export default function Transfer() {
  return (
    <>
      <Lead>
        A confidential transfer moves ERC-7984 tokens where the amount is encrypted on-chain — hidden
        from block explorers and even from the recipient until they decrypt it. In the app this is
        the <Link href="/app/transfer">Transfer</Link> page.
      </Lead>

      <H2>How it differs from a normal transfer</H2>
      <UL>
        <li>
          The amount is encrypted client-side before it&apos;s submitted, so the transaction carries
          a ciphertext, not a number.
        </li>
        <li>
          The sender and recipient addresses are still public — FHE hides the value, not the graph.
        </li>
        <li>
          The recipient must run their own decrypt (an EIP-712 permit) to learn how much they
          received.
        </li>
      </UL>

      <H2>Using the SDK</H2>
      <P>
        <code>useConfidentialTransfer</code> takes the wrapper address and returns a mutation. The
        SDK encrypts the amount, then submits — you get lifecycle callbacks for each phase.
      </P>
      <CodeBlock
        lang="tsx"
        filename="confidential-transfer.tsx"
        code={`import { useConfidentialTransfer } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';

function SendForm({ wrapper }: { wrapper: \`0x\${string}\` }) {
  const { mutateAsync: transfer } = useConfidentialTransfer({
    tokenAddress: wrapper,
  });

  const handleSend = async (to: \`0x\${string}\`) => {
    await transfer({
      to,
      // wrapper decimals are always 6
      amount: parseUnits('25', 6),
      onEncryptComplete: () => console.log('amount encrypted, submitting…'),
      onTransferSubmitted: (hash) => console.log('submitted:', hash),
    });
  };

  return <button onClick={() => handleSend('0x…')}>Send 25 confidentially</button>;
}`}
      />

      <Callout>
        The Transfer page also supports a standard public ERC-20 transfer mode for the underlying
        token, so you can move either the public or the confidential side from one place.
      </Callout>

      <Callout variant="warning">
        You can only send what you hold confidentially. If your confidential balance is lower than
        the amount, the transfer reverts with{' '}
        <code>INSUFFICIENT_CONFIDENTIAL_BALANCE</code> — see the{' '}
        <Link href="/app/docs/errors">Error Reference</Link>.
      </Callout>
    </>
  );
}
