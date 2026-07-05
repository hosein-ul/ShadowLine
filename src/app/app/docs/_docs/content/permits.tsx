'use client';

import React from 'react';
import { Lead, P, H2, CodeBlock, Callout, StepList, PermitFlowDiagram, Reveal } from '../components';

export default function Permits() {
  return (
    <>
      <Lead>
        Reading a confidential balance requires an EIP-712 typed-data signature from the token
        owner&apos;s wallet. This signature authorizes the Zama Gateway to decrypt the ciphertext and
        return the plaintext to the frontend session. It is off-chain — no gas, no transaction.
      </Lead>

      <Callout variant="error">
        <strong>Security rule — never auto-fire permits.</strong> Every call to{' '}
        <code>useConfidentialBalance</code> or <code>useConfidentialBalances</code> with{' '}
        <code>enabled: true</code> immediately requests a wallet signature. Always gate it behind an
        explicit <code>decryptRequested</code> boolean that is only set <code>true</code> on a user
        click.
      </Callout>

      <Reveal>
        <PermitFlowDiagram />
      </Reveal>

      <H2>How it works</H2>
      <StepList
        steps={[
          {
            t: 'User clicks "Decrypt"',
            d: 'Set decryptRequested = true in your component state. Nothing fires until this happens.',
          },
          {
            t: 'SDK requests an EIP-712 signature',
            d: 'The hook builds a typed-data payload and asks the wallet to sign it. Off-chain: no gas, no transaction.',
          },
          {
            t: 'A session key is derived',
            d: 'The signature derives a short-lived key scoped to your address and the specific contract.',
          },
          {
            t: 'The Gateway decrypts',
            d: "The Gateway uses the session key to decrypt the on-chain ciphertext. Only your account's ciphertexts are decryptable with your key.",
          },
          {
            t: 'Plaintext returns to the browser',
            d: 'The decrypted bigint balance is handed to your component. It is never written back on-chain in plaintext.',
          },
        ]}
      />

      <Callout>
        <strong>Reset on token change:</strong> when the user switches the selected token, reset{' '}
        <code>decryptRequested</code> synchronously in the <code>onChange</code> handler — not only
        in a <code>useEffect</code>. A one-frame delay in the effect can let the old <code>true</code>{' '}
        combine with the new token address and auto-fire a permit.
      </Callout>

      <CodeBlock
        lang="tsx"
        filename="permit-gate.tsx"
        code={`const [selectedToken, setSelectedToken] = useState(pairs[0]);
const [decryptRequested, setDecryptRequested] = useState(false);

// ✓ Reset synchronously on token change
const handleTokenChange = (newToken: WrapperPair) => {
  setSelectedToken(newToken);
  setDecryptRequested(false);  // ← same handler, not a useEffect
};

const { data: balance } = useConfidentialBalance({
  tokenAddress: selectedToken.erc7984Address,
  enabled: decryptRequested && !!address,  // ← explicit gate
});`}
      />

      <H2>Rejections are terminal — do not retry</H2>
      <P>
        If the user declines the signature, treat it as done: re-arm the button and wait for another
        click. Do not re-fire the query on error, on window focus, or on remount — that produces the
        &quot;wallet keeps popping up&quot; loop. ShadowLine disables the query after any decrypt
        error and only re-enables it on a fresh click.
      </P>
    </>
  );
}
