'use client';

import React from 'react';
import { Lead, P, H2, H4, CodeBlock, EndpointBadge, PropTable, PropRow } from '../components';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://YOUR_DEPLOYMENT_URL';

export default function RestApi() {
  return (
    <>
      <Lead>
        ShadowLine exposes a public REST API for querying the on-chain registry. No SDK, no wallet,
        no authentication — just a <code>fetch()</code>.
      </Lead>

      <H2>GET /api/registry</H2>
      <EndpointBadge method="GET" path="/api/registry" />
      <P>
        Returns all registered ERC-20 ↔ ERC-7984 wrapper pairs for the specified chain. Data is read
        directly from the on-chain <code>WrappersRegistry</code> and cached for 60 seconds
        (stale-while-revalidate 300s).
      </P>

      <H4>Query parameters</H4>
      <PropTable columns={['Parameter', 'Type', 'Description']}>
        <PropRow
          name="chain"
          type='"sepolia" | "mainnet"'
          required
          description='The network to query. Defaults to "sepolia" when omitted.'
        />
      </PropTable>

      <H4>Response schema</H4>
      <PropTable>
        <PropRow name="pairs" type="PairResult[]" required description="Array of registered wrapper pair objects." />
        <PropRow name="total" type="number" required description="Number of pairs returned (after blocklist filtering)." />
        <PropRow name="chain" type="string" required description='Chain name: "sepolia" or "mainnet".' />
        <PropRow name="registryAddress" type="string" required description="Address of the WrappersRegistry contract queried." />
        <PropRow name="timestamp" type="number" required description="Unix millisecond timestamp of the response." />
        <PropRow name="source" type='"on-chain" | "cached-snapshot"' required description='"on-chain" = live data; "cached-snapshot" = RPC fallback.' />
        <PropRow name="warning" type="string" description="Present only when source is cached-snapshot." />
      </PropTable>

      <H4>PairResult object</H4>
      <PropTable>
        <PropRow name="tokenAddress" type="string" required description="ERC-20 underlying token contract address." />
        <PropRow name="confidentialTokenAddress" type="string" required description="ERC-7984 confidential wrapper contract address." />
        <PropRow name="symbol" type="string" required description='Normalized underlying symbol, e.g. "USDC" (Mock suffix stripped).' />
        <PropRow name="confidentialSymbol" type="string" required description='Confidential symbol, e.g. "cUSDC".' />
        <PropRow name="name" type="string" required description='Human-readable name, e.g. "USD Coin".' />
        <PropRow name="decimals" type="number" required description="Underlying token precision (e.g. 6 for USDC, 18 for WETH)." />
        <PropRow name="wrapperDecimals" type="number" required description="Always 6 — the FHE euint64 constraint." />
      </PropTable>

      <H4>Examples</H4>
      <CodeBlock
        lang="bash"
        filename="curl"
        code={`# Fetch all Sepolia pairs
curl "${APP_URL}/api/registry?chain=sepolia"

# Fetch Mainnet pairs
curl "${APP_URL}/api/registry?chain=mainnet"`}
      />
      <CodeBlock
        lang="ts"
        filename="fetch (JavaScript)"
        code={`const res = await fetch('${APP_URL}/api/registry?chain=sepolia');
const data = await res.json();

console.log(\`\${data.total} pairs on \${data.chain} (source: \${data.source})\`);
for (const pair of data.pairs) {
  console.log(\`\${pair.symbol} → c\${pair.symbol}\`);
  console.log(\`  ERC-20:   \${pair.tokenAddress}\`);
  console.log(\`  ERC-7984: \${pair.confidentialTokenAddress}\`);
}`}
      />
      <CodeBlock
        lang="py"
        filename="Python"
        code={`import requests

resp = requests.get("${APP_URL}/api/registry", params={"chain": "sepolia"})
data = resp.json()

for pair in data["pairs"]:
    print(f"{pair['symbol']:8} -> c{pair['symbol']:8} | decimals: {pair['decimals']}/{pair['wrapperDecimals']}")`}
      />

      <H4>HTTP headers</H4>
      <PropTable columns={['Header', 'Value']}>
        <tr className="docs-prop-row">
          <td>
            <code className="docs-prop-name">Cache-Control</code>
          </td>
          <td className="docs-prop-desc">public, s-maxage=60, stale-while-revalidate=300</td>
        </tr>
        <tr className="docs-prop-row">
          <td>
            <code className="docs-prop-name">Access-Control-Allow-Origin</code>
          </td>
          <td className="docs-prop-desc">* (CORS open)</td>
        </tr>
      </PropTable>
    </>
  );
}
