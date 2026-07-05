'use client';

import React from 'react';
import { Lead, P, H2, CodeBlock, Callout, PropTable } from '../components';

export default function DecimalScaling() {
  return (
    <>
      <Lead>
        This is the most common source of bugs when integrating Zama FHE tokens. Read it carefully —
        it is short.
      </Lead>

      <P>
        <strong>
          FHE operates on <code>euint64</code>
        </strong>{' '}
        — a 64-bit unsigned integer with a maximum of ~1.84 × 10¹⁹. A standard 18-decimal ERC-20
        represents 1.0 token as 10¹⁸; multiplied by any meaningful amount that overflows 64 bits
        quickly.
      </P>
      <P>
        Therefore <strong>all ERC-7984 wrapper tokens use 6 decimals</strong>, regardless of the
        underlying token&apos;s precision. The wrapper scales amounts automatically during shielding
        and unshielding.
      </P>

      <Callout variant="warning">
        <strong>Critical rule:</strong> when calling <code>useShield</code>, parse the amount with
        the <em>underlying</em> token&apos;s decimals. When calling <code>useUnshield</code>, always
        use <strong>6 decimals</strong> (the wrapper decimals). When displaying a confidential
        balance, always format with <strong>6</strong>.
      </Callout>

      <H2>Decision table</H2>
      <PropTable columns={['Operation', 'Decimals to use', 'Example (1.0 WETH)']}>
        <tr className="docs-prop-row">
          <td>Shield (wrap)</td>
          <td>
            <code className="docs-prop-type">parseUnits(amount, underlyingDecimals)</code>
          </td>
          <td>
            <code>{"parseUnits('1', 18)"}</code> → 10¹⁸
          </td>
        </tr>
        <tr className="docs-prop-row">
          <td>Unshield (unwrap)</td>
          <td>
            <code className="docs-prop-type">parseUnits(amount, 6)</code>
          </td>
          <td>
            <code>{"parseUnits('1', 6)"}</code> → 10⁶
          </td>
        </tr>
        <tr className="docs-prop-row">
          <td>Display balance</td>
          <td>
            <code className="docs-prop-type">formatUnits(balance, 6)</code>
          </td>
          <td>
            <code>{"formatUnits(1_000_000n, 6)"}</code> → &apos;1.0&apos;
          </td>
        </tr>
      </PropTable>

      <CodeBlock
        lang="ts"
        filename="decimal-scaling.ts"
        code={`import { parseUnits, formatUnits } from 'viem';

// USDC (6 decimals) — same decimals as wrapper, no confusion
parseUnits('100', 6)   // for shield:   100_000_000n ✓
parseUnits('100', 6)   // for unshield: 100_000_000n ✓  — same!

// WETH (18 decimals underlying, 6 wrapper)
parseUnits('1', 18)    // for shield:   1_000_000_000_000_000_000n ✓
parseUnits('1', 6)     // for unshield: 1_000_000n ✓

// Display: always use 6 (wrapper decimals)
formatUnits(1_000_000n, 6)   // "1.0" ✓
formatUnits(1_000_000n, 18)  // "0.000000000001" ✗  ← the zero-balance bug!`}
      />
    </>
  );
}
