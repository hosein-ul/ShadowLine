'use client';

import React from 'react';
import { Lead, P, H2, H4, CodeBlock, EndpointBadge, UL, Callout } from '../components';

export default function AiAgents() {
  return (
    <>
      <Lead>
        ShadowLine is built from the ground up for autonomous AI agents, LLMs, and programmatic
        wallets. Discover verified asset pairs via standard AI manifests and execute MEV-resistant
        confidential DeFi operations.
      </Lead>

      <H2>Why Autonomous AI Agents Need ShadowLine</H2>
      <P>
        AI agents executing on-chain trading strategies, DAO treasury management, or automated payroll
        face critical vulnerabilities when holding public ERC-20 tokens:
      </P>
      <UL>
        <li>
          <strong>MEV Exploitation & Sandwiche Attacks:</strong> Searchers monitor public mempools and agent balances to front-run automated trades.
        </li>
        <li>
          <strong>Strategy Copy-Trading:</strong> Observers can copy or counter-trade an AI agent&apos;s portfolio rebalancing in real time.
        </li>
        <li>
          <strong>Treasury Exposure:</strong> DAO and agent operational wallets reveal sensitive cash flow and runway data.
        </li>
      </UL>
      <P>
        By wrapping public tokens into ERC-7984 confidential wrappers (<code>cTokens</code>) on Zama&apos;s
        fhEVM, AI agents hold encrypted balances (<code>euint64</code>) and execute confidential transfers
        completely hidden from public scrutiny.
      </P>

      <H2>1. llms.txt — AI Discovery Standard</H2>
      <P>
        ShadowLine adheres to the emerging <a href="https://llmstxt.org" target="_blank" rel="noopener noreferrer">llmstxt.org</a> specification. LLMs and autonomous coding agents can read our structured summaries directly:
      </P>
      <UL>
        <li>
          <a href="/llms.txt" target="_blank" rel="noopener noreferrer"><code>/llms.txt</code></a> — High-level protocol summary, capabilities, and core concepts.
        </li>
        <li>
          <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer"><code>/llms-full.txt</code></a> — Complete developer reference including smart contract ABIs, Viem code patterns, and decimal scaling rules.
        </li>
      </UL>

      <H2>2. OpenAI & Universal AI Plugin Manifests</H2>
      <P>
        ShadowLine hosts standard discovery manifests, allowing AI frameworks (ChatGPT plugins, LangChain, Vercel AI SDK, Eliza) to auto-discover our REST API and query confidential asset pairs without manual schema configuration:
      </P>
      <UL>
        <li>
          <code>/.well-known/ai-plugin.json</code> — Plugin metadata and authentication spec.
        </li>
        <li>
          <code>/openapi.json</code> — OpenAPI 3.0 specification for the <code>/api/registry</code> endpoint.
        </li>
      </UL>

      <H2>3. Agent Tools SDK (`@shadowline/agent-tools`)</H2>
      <P>
        For developers building AI agents with TypeScript, we provide pre-built tool definitions in{' '}
        <code>src/lib/agent-tools.ts</code>. These tools can be plugged directly into LangChain or Vercel AI SDK:
      </P>
      <CodeBlock
        lang="typescript"
        code={`import { shadowlineTools } from '@/lib/agent-tools';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Equip your agent with native understanding of ShadowLine FHE assets!
const response = await generateText({
  model: openai('gpt-4o'),
  tools: shadowlineTools,
  prompt: 'Check Sepolia for available confidential token pairs and tell me the decimal rule for shielding USDC.',
});`}
      />

      <H2>4. Headless Execution Harness (`ShadowlineAgentHarness`)</H2>
      <P>
        To enable autonomous AI agents to execute real FHE asset shielding, confidential transfers, and balance decryption in a backend or script environment (without a web browser), use the headless execution harness in <code>src/lib/agent-harness.ts</code>:
      </P>
      <CodeBlock
        lang="typescript"
        code={`import { ShadowlineAgentHarness } from '@/lib/agent-harness';

// 1. Initialize Headless Agent Harness (Node.js worker pool mode)
const agent = new ShadowlineAgentHarness({
  privateKey: process.env.AGENT_PRIVATE_KEY as \`0x\${string}\`,
  relayerApiKey: process.env.ZAMA_RELAYER_API_KEY || 'YOUR_API_KEY',
});
await agent.init();

// 2. Discover pairs and execute confidential DeFi actions
const pairs = await agent.getPairs();
const usdcWrapper = pairs.find(p => p.symbol === 'USDC')?.confidentialTokenAddress || pairs[0].confidentialTokenAddress;

// Shield (wrap) public USDC into confidential cUSDC
const shieldHash = await agent.shield(usdcWrapper, '10.0');

// Decrypt balance via EIP-712 permit & WASM decryption
const balance = await agent.getConfidentialBalance(usdcWrapper);

// Send confidential cUSDC (client-side WASM encryption + FHE input proof)
const transferHash = await agent.transfer(usdcWrapper, '0xRecipient', '5.0');`}
      />

      <Callout variant="warning">
        <strong>Critical Rule for AI Agents:</strong> When shielding (depositing), input amounts MUST use the underlying token&apos;s decimals (e.g. 6 for USDC, 18 for WETH). When unshielding (withdrawing) or transferring, amounts MUST always use the wrapper&apos;s fixed <code>euint64</code> 6-decimal scale.
      </Callout>
    </>
  );
}
