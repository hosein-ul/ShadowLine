'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, CodeBlock, Callout } from '../components';

export default function Portfolio() {
  return (
    <>
      <Lead>
        The <Link href="/app/portfolio">Portfolio</Link> shows everything you hold across the registry and
        lets you reveal every confidential balance with a single signature.
      </Lead>

      <H2>Batch decryption</H2>
      <P>
        Decrypting balances one-by-one would prompt your wallet once per token. Instead, the
        portfolio uses <code>useConfidentialBalances</code> to cover many wrappers under a single
        EIP-712 permit — one click, one signature, every official balance revealed.
      </P>
      <CodeBlock
        lang="tsx"
        filename="decrypt-all.tsx"
        code={`import { useConfidentialBalances } from '@zama-fhe/react-sdk';
import { formatUnits } from 'viem';
import { useState } from 'react';

function DecryptAll({ wrappers }: { wrappers: \`0x\${string}\`[] }) {
  const [decryptRequested, setDecryptRequested] = useState(false);

  const { data: balances } = useConfidentialBalances({
    tokenAddresses: wrappers,
    enabled: decryptRequested,   // one permit covers all
  });

  if (!decryptRequested) {
    return <button onClick={() => setDecryptRequested(true)}>Decrypt All</button>;
  }
  return (
    <ul>
      {wrappers.map((w) => (
        <li key={w}>{formatUnits(balances?.[w.toLowerCase()] ?? 0n, 6)}</li>
      ))}
    </ul>
  );
}`}
      />

      <H2>Three kinds of holdings</H2>
      <UL>
        <li>
          <strong>Official wrappers</strong> — verified registry pairs, batch-decrypted together.
        </li>
        <li>
          <strong>Custom wrappers</strong> — your locally-added pairs that support shield/unshield.
        </li>
        <li>
          <strong>Custom decrypt-only</strong> — confidential tokens with no ERC-20 underlying; each
          card runs its own per-row decrypt.
        </li>
      </UL>

      <Callout>
        <strong>Session reset:</strong> the wallet menu&apos;s &quot;Reset Decryption Session&quot;
        wipes cached FHE permits app-wide. The next decrypt then prompts for a fresh wallet
        signature — useful if you switch accounts or want to re-arm every gate at once.
      </Callout>
    </>
  );
}
