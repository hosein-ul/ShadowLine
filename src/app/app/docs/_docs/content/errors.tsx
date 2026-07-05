'use client';

import React from 'react';
import { Lead, CodeBlock, Callout, ErrorRow } from '../components';

export default function Errors() {
  return (
    <>
      <Lead>
        Use <code>matchZamaError</code> from <code>@zama-fhe/sdk</code> to classify SDK errors into
        user-friendly messages. ShadowLine re-exports this via the <code>classifyError(err)</code>{' '}
        utility in <code>src/lib/errors.ts</code>.
      </Lead>

      <CodeBlock
        lang="ts"
        filename="usage"
        code={`import { matchZamaError } from '@zama-fhe/sdk';

try {
  await shield({ amount });
} catch (err) {
  const result = matchZamaError(err, {
    SIGNING_REJECTED: () => ({ title: 'Declined', message: 'You cancelled the signature.' }),
    INSUFFICIENT_ERC20_BALANCE: () => ({ title: 'Low Balance', message: 'Not enough tokens.' }),
    _: (e) => ({ title: 'Error', message: e.message }),
  });
  showToast(result);
}`}
      />

      <table className="docs-table" style={{ marginTop: 'var(--sp-6)' }}>
        <thead>
          <tr>
            <th>Error Code</th>
            <th>Title</th>
            <th>Description</th>
            <th>Retry?</th>
          </tr>
        </thead>
        <tbody>
          <ErrorRow code="SIGNING_REJECTED" title="Signature Declined" description="User declined the EIP-712 permit request in their wallet." retryable />
          <ErrorRow code="SIGNING_FAILED" title="Wallet Signing Failed" description="Wallet could not complete the signature — connection issue or wrong account." retryable />
          <ErrorRow code="ENCRYPTION_FAILED" title="Encryption Failed" description="FHE encryption failed client-side. Browser may not support WebAssembly." retryable />
          <ErrorRow code="DECRYPTION_FAILED" title="Decryption Failed" description="Session permit may have expired. Request a new permit." retryable />
          <ErrorRow code="TRANSACTION_REVERTED" title="Transaction Reverted" description="On-chain transaction reverted — check balance, allowance, or contract state." retryable />
          <ErrorRow code="INVALID_KEYPAIR" title="Session Key Rejected" description="Session key was rejected by the relayer. Generate a fresh key." retryable />
          <ErrorRow code="KEYPAIR_EXPIRED" title="Session Expired" description="Session key has expired. Sign again to refresh." retryable />
          <ErrorRow code="NO_CIPHERTEXT" title="No Confidential Balance" description="This account has no confidential balance for this wrapper. Shield first." retryable={false} />
          <ErrorRow code="RELAYER_REQUEST_FAILED" title="Relayer Unavailable" description="Zama relayer is temporarily unavailable. Retry in a few seconds." retryable />
          <ErrorRow code="CONFIGURATION" title="Configuration Error" description="SDK misconfiguration — likely a bug in the integration." retryable={false} />
          <ErrorRow code="INSUFFICIENT_CONFIDENTIAL_BALANCE" title="Insufficient Balance" description="Confidential balance is lower than the unshield/transfer amount." retryable={false} />
          <ErrorRow code="INSUFFICIENT_ERC20_BALANCE" title="Insufficient Tokens" description="Public token balance is lower than the shield amount." retryable={false} />
          <ErrorRow code="BALANCE_CHECK_UNAVAILABLE" title="Balance Check Unavailable" description="Cannot verify balance — sign a permit first." retryable />
          <ErrorRow code="ERC20_READ_FAILED" title="Token Read Failed" description="Could not read token balance from chain — network issue." retryable />
          <ErrorRow code="ACL_PAUSED" title="Protocol Paused" description="The FHE access-control layer is temporarily paused for maintenance." retryable={false} />
          <ErrorRow code="APPROVAL_FAILED" title="Approval Failed" description="ERC-20 approval transaction failed — check allowance and balance." retryable />
        </tbody>
      </table>

      <Callout>
        <strong>Wallet errors (non-SDK):</strong> common rejection strings like{' '}
        <code>user rejected</code>, <code>User denied</code>, <code>ACTION_REJECTED</code>, and{' '}
        <code>user cancelled</code> are caught by the fallback in <code>classifyError()</code> and
        mapped to &quot;Request Cancelled.&quot;
      </Callout>
    </>
  );
}
