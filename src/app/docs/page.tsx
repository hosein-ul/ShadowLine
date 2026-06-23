'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import CopyButton from '@/components/ui/CopyButton';
import {
  BookOpen,
  Zap,
  Globe,
  Code2,
  Cpu,
  MapPin,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Shield,
  Menu,
  X,
} from 'lucide-react';

/* ─── Sidebar nav structure ──────────────────────────────────────────────────── */

const SIDEBAR_SECTIONS = [
  {
    group: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
      { id: 'quickstart', label: 'Quick Start', icon: <Zap size={14} /> },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { id: 'rest-api', label: 'REST API', icon: <Globe size={14} /> },
      { id: 'sdk-hooks', label: 'React SDK Hooks', icon: <Code2 size={14} /> },
    ],
  },
  {
    group: 'Concepts',
    items: [
      { id: 'concepts', label: 'Core Concepts', icon: <Cpu size={14} /> },
      { id: 'decimal-scaling', label: 'Decimal Scaling', icon: <Shield size={14} /> },
      { id: 'permit-flow', label: 'EIP-712 Permits', icon: <Shield size={14} /> },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'addresses', label: 'Contract Addresses', icon: <MapPin size={14} /> },
      { id: 'errors', label: 'Error Reference', icon: <AlertCircle size={14} /> },
    ],
  },
];

/* ─── CodeBlock component ────────────────────────────────────────────────────── */

function CodeBlock({
  code,
  lang = 'ts',
  filename,
}: {
  code: string;
  lang?: string;
  filename?: string;
}) {
  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-lang">{filename ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="docs-code-pre"><code>{code}</code></pre>
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="docs-section">
      <h2 className="docs-section-title">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="docs-subsection">
      <h3 className="docs-subsection-title">{title}</h3>
      {children}
    </div>
  );
}

/* ─── Endpoint badge ─────────────────────────────────────────────────────────── */

function EndpointBadge({ method, path }: { method: string; path: string }) {
  return (
    <div className="docs-endpoint">
      <span className="docs-endpoint-method">{method}</span>
      <code className="docs-endpoint-path">{path}</code>
    </div>
  );
}

/* ─── Property row (for response schemas) ────────────────────────────────────── */

function PropRow({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <tr className="docs-prop-row">
      <td>
        <code className="docs-prop-name">{name}</code>
        {required && <span className="docs-prop-required">required</span>}
      </td>
      <td><code className="docs-prop-type">{type}</code></td>
      <td className="docs-prop-desc">{description}</td>
    </tr>
  );
}

/* ─── Hook row ───────────────────────────────────────────────────────────────── */

function HookCard({
  name,
  pkg,
  description,
  signature,
  example,
}: {
  name: string;
  pkg: string;
  description: string;
  signature: string;
  example: string;
}) {
  return (
    <div className="docs-hook-card">
      <div className="docs-hook-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <code className="docs-hook-name">{name}</code>
            <Badge variant="default" size="sm">{pkg}</Badge>
          </div>
          <p className="docs-hook-desc">{description}</p>
        </div>
      </div>
      <CodeBlock code={signature} lang="ts" filename="signature" />
      <CodeBlock code={example} lang="tsx" filename="example" />
    </div>
  );
}

/* ─── Error row ──────────────────────────────────────────────────────────────── */

function ErrorRow({
  code,
  title,
  description,
  retryable,
}: {
  code: string;
  title: string;
  description: string;
  retryable: boolean;
}) {
  return (
    <tr className="docs-prop-row">
      <td><code className="docs-prop-name" style={{ color: 'var(--error)' }}>{code}</code></td>
      <td style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{title}</td>
      <td className="docs-prop-desc">{description}</td>
      <td>
        <Badge variant={retryable ? 'success' : 'warning'} size="sm">
          {retryable ? 'Retryable' : 'Terminal'}
        </Badge>
      </td>
    </tr>
  );
}

/* ─── Address table ──────────────────────────────────────────────────────────── */

function AddressTable({
  network,
  registry,
  pairs,
}: {
  network: string;
  registry: string;
  pairs: { symbol: string; erc20: string; wrapper: string; decimals: number }[];
}) {
  const explorerBase = network === 'Sepolia'
    ? 'https://sepolia.etherscan.io/address'
    : 'https://etherscan.io/address';

  return (
    <div className="docs-address-table-wrap">
      <div className="docs-address-registry">
        <span className="text-muted text-sm">WrappersRegistry</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code className="docs-addr-mono">{registry}</code>
          <a href={`${explorerBase}/${registry}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
          </a>
        </div>
      </div>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Decimals</th>
            <th>ERC-20 Address</th>
            <th>ERC-7984 Wrapper</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p) => (
            <tr key={p.symbol} className="docs-prop-row">
              <td style={{ fontWeight: 600 }}>
                {p.symbol}
                <span style={{ marginLeft: 4 }}>
                  <code className="docs-prop-type">c{p.symbol}</code>
                </span>
              </td>
              <td className="text-muted text-sm">{p.decimals} / 6</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code className="docs-addr-mono docs-addr-short">{p.erc20.slice(0, 10)}…{p.erc20.slice(-6)}</code>
                  <a href={`${explorerBase}/${p.erc20}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={11} style={{ color: 'var(--accent)' }} />
                  </a>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code className="docs-addr-mono docs-addr-short">{p.wrapper.slice(0, 10)}…{p.wrapper.slice(-6)}</code>
                  <a href={`${explorerBase}/${p.wrapper}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={11} style={{ color: 'var(--accent)' }} />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track which section is visible
  useEffect(() => {
    const allIds = SIDEBAR_SECTIONS.flatMap((g) => g.items.map((i) => i.id));

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90; // header height + padding
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setSidebarOpen(false);
  }, []);

  return (
    <div className="docs-page">
      {/* Mobile sidebar toggle */}
      <button
        className="docs-mobile-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle docs navigation"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        <span>Navigation</span>
      </button>

      {/* ── Sidebar ── */}
      <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="docs-sidebar-title">
          <BookOpen size={16} />
          ZamaVault Docs
        </div>

        <nav className="docs-sidebar-nav">
          {SIDEBAR_SECTIONS.map((group) => (
            <div key={group.group} className="docs-nav-group">
              <div className="docs-nav-group-label">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`docs-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => scrollTo(item.id)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="docs-sidebar-footer">
          <a
            href="https://docs.zama.org/protocol/sdk/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-ext-link"
          >
            <ExternalLink size={12} /> Zama Official Docs
          </a>
          <a
            href="https://github.com/hosein-ul/zamavault"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-ext-link"
          >
            <ExternalLink size={12} /> GitHub Repo
          </a>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="docs-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ── */}
      <main className="docs-content">

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="overview" title="Overview">
          <p className="docs-lead">
            ZamaVault is the canonical interface and developer toolkit for
            Zama&apos;s confidential token ecosystem. It lets users and developers
            discover, wrap, unwrap, and decrypt ERC-20 tokens that have been
            converted into confidential ERC-7984 wrappers using{' '}
            <strong>Fully Homomorphic Encryption (FHE)</strong>.
          </p>

          <div className="docs-feature-grid">
            {[
              {
                icon: '🔍',
                title: 'Registry Explorer',
                desc: 'Live on-chain discovery of all registered ERC-20 ↔ ERC-7984 wrapper pairs via the WrappersRegistry contract on Sepolia and Mainnet.',
              },
              {
                icon: '🛡️',
                title: 'Shield & Unshield',
                desc: 'Wrap public ERC-20 tokens into encrypted confidential tokens. Unwrap them back — with automatic resume for interrupted operations.',
              },
              {
                icon: '👁️',
                title: 'Confidential Balances',
                desc: 'Decrypt your encrypted portfolio balance using an EIP-712 permit signed in your wallet. Never auto-fires — always explicit user action.',
              },
              {
                icon: '🔌',
                title: 'Public REST API',
                desc: 'Fetch all wrapper pairs from any language with a simple GET request — no SDK or wallet connection required.',
              },
            ].map((f) => (
              <div key={f.title} className="docs-feature-card">
                <div className="docs-feature-icon">{f.icon}</div>
                <div className="docs-feature-body">
                  <strong>{f.title}</strong>
                  <p className="text-sm text-muted" style={{ marginTop: 4 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="docs-info-box">
            <strong>Judging context:</strong> Built for the Zama Developer Program Mainnet Season 3 Bounty Track.
            The goal is to turn the WrappersRegistry into a product every developer and user can point to.
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="quickstart" title="Quick Start">
          <p className="docs-lead">
            Integrate Zama confidential tokens into your app in three steps.
          </p>

          <SubSection id="qs-install" title="1. Install dependencies">
            <CodeBlock
              lang="bash"
              filename="terminal"
              code={`npm install @zama-fhe/react-sdk wagmi viem @tanstack/react-query`}
            />
          </SubSection>

          <SubSection id="qs-providers" title="2. Wrap your app with providers">
            <p className="docs-p">
              ZamaVault uses Wagmi for wallet connections and the Zama React SDK for FHE operations.
              Both must be initialized at the root of your app.
            </p>
            <CodeBlock
              lang="tsx"
              filename="providers.tsx"
              code={`import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ZamaProvider } from '@zama-fhe/react-sdk';
import { http, createConfig, fallback } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';

const config = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: fallback([http(process.env.NEXT_PUBLIC_SEPOLIA_RPC), http()]),
    [mainnet.id]: fallback([http(process.env.NEXT_PUBLIC_MAINNET_RPC), http()]),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider>
          {children}
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}`}
            />
          </SubSection>

          <SubSection id="qs-fetch" title="3. Fetch pairs and shield tokens">
            <p className="docs-p">
              Use the live registry to get all wrapper pairs, then call <code>useShield</code>{' '}
              to wrap your first token.
            </p>
            <CodeBlock
              lang="tsx"
              filename="app.tsx"
              code={`import { useListPairs, useShield } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';
import { useState } from 'react';

function ShieldButton() {
  const { data } = useListPairs({ page: 1, pageSize: 50, metadata: true });
  const firstPair = data?.pairs[0];

  const { mutateAsync: shield, isPending } = useShield({
    tokenAddress: firstPair?.confidentialToken,
  });

  const handleShield = async () => {
    // amount uses underlying token's decimals (e.g. 6 for USDC)
    await shield({ amount: parseUnits('100', 6) });
  };

  return (
    <button onClick={handleShield} disabled={isPending}>
      {isPending ? 'Shielding...' : 'Shield 100 USDC'}
    </button>
  );
}`}
            />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="rest-api" title="REST API">
          <p className="docs-lead">
            ZamaVault exposes a public REST API for querying the on-chain registry.
            No SDK, no wallet, no authentication — just a <code>fetch()</code> call.
          </p>

          <SubSection id="api-registry" title="GET /api/registry">
            <EndpointBadge method="GET" path="/api/registry" />

            <p className="docs-p">
              Returns all registered ERC-20 ↔ ERC-7984 wrapper pairs for the specified chain.
              Data is read directly from the on-chain <code>WrappersRegistry</code> contract and
              cached for 60 seconds (stale-while-revalidate 300s).
            </p>

            <h4 className="docs-h4">Query Parameters</h4>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <PropRow name="chain" type='"sepolia" | "mainnet"' required description='The network to query. Defaults to "sepolia" when omitted.' />
              </tbody>
            </table>

            <h4 className="docs-h4">Response Schema</h4>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <PropRow name="pairs" type="PairResult[]" required description="Array of registered wrapper pair objects." />
                <PropRow name="total" type="number" required description="Number of pairs returned (after blocklist filtering)." />
                <PropRow name="chain" type="string" required description='Chain name: "sepolia" or "mainnet".' />
                <PropRow name="registryAddress" type="string" required description="Address of the WrappersRegistry contract queried." />
                <PropRow name="timestamp" type="number" required description="Unix millisecond timestamp of the response." />
                <PropRow name="source" type='"on-chain" | "cached-snapshot"' required description='"on-chain" = live data; "cached-snapshot" = RPC fallback.' />
                <PropRow name="warning" type="string" description="Present only when source is cached-snapshot." />
              </tbody>
            </table>

            <h4 className="docs-h4">PairResult object</h4>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <PropRow name="tokenAddress" type="string" required description="ERC-20 underlying token contract address." />
                <PropRow name="confidentialTokenAddress" type="string" required description="ERC-7984 confidential wrapper contract address." />
                <PropRow name="symbol" type="string" required description='Normalized underlying symbol, e.g. "USDC" (Mock suffix stripped).' />
                <PropRow name="confidentialSymbol" type="string" required description='Confidential symbol, e.g. "cUSDC".' />
                <PropRow name="name" type="string" required description='Human-readable name, e.g. "USD Coin".' />
                <PropRow name="decimals" type="number" required description="Underlying token precision (e.g. 6 for USDC, 18 for WETH)." />
                <PropRow name="wrapperDecimals" type="number" required description="Always 6 — FHE euint64 constraint (see Decimal Scaling)." />
              </tbody>
            </table>

            <h4 className="docs-h4">Examples</h4>
            <CodeBlock
              lang="bash"
              filename="curl"
              code={`# Fetch all Sepolia pairs
curl "https://zamavault.xyz/api/registry?chain=sepolia"

# Fetch Mainnet pairs
curl "https://zamavault.xyz/api/registry?chain=mainnet"`}
            />
            <CodeBlock
              lang="ts"
              filename="fetch (JavaScript)"
              code={`const res = await fetch('https://zamavault.xyz/api/registry?chain=sepolia');
const data = await res.json();

// data.pairs is an array of PairResult
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

resp = requests.get(
    "https://zamavault.xyz/api/registry",
    params={"chain": "sepolia"}
)
data = resp.json()

for pair in data["pairs"]:
    print(f"{pair['symbol']:8} -> c{pair['symbol']:8} | decimals: {pair['decimals']}/{pair['wrapperDecimals']}")`}
            />

            <h4 className="docs-h4">HTTP Headers</h4>
            <table className="docs-table">
              <thead>
                <tr><th>Header</th><th>Value</th></tr>
              </thead>
              <tbody>
                <tr className="docs-prop-row">
                  <td><code className="docs-prop-name">Cache-Control</code></td>
                  <td className="docs-prop-desc">public, s-maxage=60, stale-while-revalidate=300</td>
                </tr>
                <tr className="docs-prop-row">
                  <td><code className="docs-prop-name">Access-Control-Allow-Origin</code></td>
                  <td className="docs-prop-desc">* (CORS open)</td>
                </tr>
              </tbody>
            </table>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="sdk-hooks" title="React SDK Hooks">
          <p className="docs-lead">
            All confidential token operations are exposed as React hooks from{' '}
            <code>@zama-fhe/react-sdk</code>. Install the package and wrap your app with
            the providers shown in Quick Start.
          </p>

          <HookCard
            name="useListPairs"
            pkg="@zama-fhe/react-sdk"
            description="Query all registered ERC-20 ↔ ERC-7984 pairs from the on-chain WrappersRegistry. Paginated."
            signature={`useListPairs({
  page: number,        // 1-based page number
  pageSize: number,    // items per page (max 100)
  metadata?: boolean,  // include on-chain metadata (name, symbol, decimals)
}): { data, isLoading, error }`}
            example={`function PairList() {
  const { data, isLoading } = useListPairs({
    page: 1,
    pageSize: 50,
    metadata: true,
  });

  return isLoading ? <p>Loading…</p> : (
    <ul>
      {data?.pairs.map(p => (
        <li key={p.confidentialToken}>
          {p.metadata?.symbol} ↔ c{p.metadata?.symbol}
        </li>
      ))}
    </ul>
  );
}`}
          />

          <HookCard
            name="useShield"
            pkg="@zama-fhe/react-sdk"
            description="Shield (wrap) an ERC-20 token into its confidential ERC-7984 wrapper. Handles approval and wrap in one call."
            signature={`useShield({
  tokenAddress: \`0x\${string}\`,  // ERC-7984 wrapper address
}): { mutateAsync: (args: { amount: bigint }) => Promise<TxHash> }`}
            example={`import { useShield } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';

function ShieldForm() {
  const { mutateAsync: shield, isPending } = useShield({
    tokenAddress: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', // cUSDC on Sepolia
  });

  const handleShield = async () => {
    // Parse using UNDERLYING decimals (6 for USDC, 18 for WETH)
    const amount = parseUnits('100', 6);
    const txHash = await shield({ amount });
    console.log('Shielded:', txHash);
  };

  return <button onClick={handleShield} disabled={isPending}>Shield 100 USDC</button>;
}`}
          />

          <HookCard
            name="useUnshield"
            pkg="@zama-fhe/react-sdk"
            description="Unshield (unwrap) a confidential ERC-7984 token back to its public ERC-20. Two-phase: on-chain request + Gateway finalization."
            signature={`useUnshield({
  tokenAddress: \`0x\${string}\`,  // ERC-7984 wrapper address
}): { mutateAsync: (args: { amount: bigint }) => Promise<TxHash> }`}
            example={`import { useUnshield } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';

function UnshieldForm() {
  const { mutateAsync: unshield, isPending } = useUnshield({
    tokenAddress: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', // cUSDC
  });

  const handleUnshield = async () => {
    // Always use WRAPPER decimals (always 6) for unshield amounts
    const amount = parseUnits('50', 6);
    await unshield({ amount });
    // Zama Gateway will finalize the unwrap (~30-60s)
    // Use useResumeUnshield if the user navigates away
  };

  return <button onClick={handleUnshield} disabled={isPending}>Unshield 50 cUSDC</button>;
}`}
          />

          <HookCard
            name="useResumeUnshield"
            pkg="@zama-fhe/react-sdk"
            description="Resume an interrupted unshield operation. Call loadPendingUnshield() from SDK storage to check for a pending tx hash."
            signature={`useResumeUnshield({
  tokenAddress: \`0x\${string}\`,
}): { mutateAsync: (args: { unwrapTxHash: \`0x\${string}\` }) => Promise<void> }`}
            example={`import { useResumeUnshield, useZamaSDK, loadPendingUnshield } from '@zama-fhe/react-sdk';
import { useEffect, useState } from 'react';

function ResumeBanner({ tokenAddress }: { tokenAddress: \`0x\${string}\` }) {
  const sdk = useZamaSDK();
  const [pendingTx, setPendingTx] = useState<\`0x\${string}\` | null>(null);
  const { mutateAsync: resume } = useResumeUnshield({ tokenAddress });

  useEffect(() => {
    if (!sdk?.storage) return;
    loadPendingUnshield(sdk.storage, tokenAddress)
      .then(tx => { if (tx) setPendingTx(tx as \`0x\${string}\`); });
  }, [sdk?.storage, tokenAddress]);

  if (!pendingTx) return null;

  return (
    <div>
      Pending unshield detected!
      <button onClick={() => resume({ unwrapTxHash: pendingTx })}>
        Resume
      </button>
    </div>
  );
}`}
          />

          <HookCard
            name="useConfidentialBalance"
            pkg="@zama-fhe/react-sdk"
            description="Decrypt a single confidential ERC-7984 balance. Triggers an EIP-712 permit signature — NEVER enable without explicit user action."
            signature={`useConfidentialBalance({
  tokenAddress: \`0x\${string}\`,
  enabled?: boolean,  // gate with decryptRequested state
}): { data: bigint | undefined, isLoading, error }`}
            example={`import { useConfidentialBalance } from '@zama-fhe/react-sdk';
import { formatUnits } from 'viem';
import { useState } from 'react';

function ConfidentialBalance({ tokenAddress }: { tokenAddress: \`0x\${string}\` }) {
  const [decryptRequested, setDecryptRequested] = useState(false);

  const { data: balance, isLoading } = useConfidentialBalance({
    tokenAddress,
    // ⚠️ CRITICAL: Only enable when user explicitly clicks "Decrypt"
    // Never set enabled: true unconditionally — it auto-fires the permit!
    enabled: decryptRequested,
  });

  if (!decryptRequested) {
    return <button onClick={() => setDecryptRequested(true)}>Decrypt Balance</button>;
  }
  if (isLoading) return <span>Awaiting signature…</span>;

  // Wrapper decimals are always 6
  return <span>{balance ? formatUnits(balance, 6) : '0'}</span>;
}`}
          />

          <HookCard
            name="useConfidentialBalances"
            pkg="@zama-fhe/react-sdk"
            description="Batch decrypt multiple confidential balances with a single EIP-712 permit. Use this on portfolio pages to avoid multiple wallet prompts."
            signature={`useConfidentialBalances({
  tokenAddresses: \`0x\${string}\`[],
  enabled?: boolean,
}): { data: Record<string, bigint>, isLoading, error }`}
            example={`import { useConfidentialBalances } from '@zama-fhe/react-sdk';

const WRAPPERS = [
  '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', // cUSDC
  '0x46208622DA27d91db4f0393733C8BA082ed83158', // cWETH
];

function Portfolio() {
  const [decryptRequested, setDecryptRequested] = useState(false);

  const { data: balances, isLoading } = useConfidentialBalances({
    tokenAddresses: WRAPPERS,
    // One EIP-712 permit covers all tokens — no permit spam
    enabled: decryptRequested,
  });

  return (
    <div>
      {!decryptRequested && (
        <button onClick={() => setDecryptRequested(true)}>Decrypt All</button>
      )}
      {balances && WRAPPERS.map(addr => (
        <div key={addr}>Balance: {formatUnits(balances[addr.toLowerCase()] ?? 0n, 6)}</div>
      ))}
    </div>
  );
}`}
          />
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="concepts" title="Core Concepts">
          <SubSection id="fhe-erc7984" title="FHE & ERC-7984">
            <p className="docs-p">
              <strong>Fully Homomorphic Encryption (FHE)</strong> is a cryptographic scheme that
              allows arbitrary computations on encrypted data without decrypting it first. Zama&apos;s
              <strong> fhEVM</strong> is a modified Ethereum Virtual Machine that supports FHE
              operations natively in Solidity smart contracts.
            </p>
            <p className="docs-p">
              <strong>ERC-7984</strong> is the confidential token standard built on fhEVM. Instead
              of storing balances as public <code>uint256</code>, wrapper contracts store them as
              <code> euint64</code> — encrypted 64-bit integers. The plaintext is never visible on-chain;
              only the token owner can decrypt it.
            </p>
            <div className="docs-info-box">
              <strong>Key properties of ERC-7984 tokens:</strong>
              <ul className="docs-list">
                <li>Balances are on-chain ciphertexts — unreadable by validators, indexers, or block explorers</li>
                <li>Transfer amounts are encrypted — confidential even from recipients until decrypted</li>
                <li>Decryption requires the owner&apos;s EIP-712 permit (see below)</li>
                <li>Underlying ERC-20 is always 1:1 collateralized in the wrapper contract</li>
              </ul>
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="decimal-scaling" title="Decimal Scaling">
          <p className="docs-lead">
            This is the most common source of bugs when integrating Zama FHE tokens.
            Read carefully.
          </p>
          <p className="docs-p">
            <strong>FHE operates on <code>euint64</code></strong> — a 64-bit unsigned integer
            with a maximum value of ~1.84 × 10¹⁹. A standard 18-decimal ERC-20 token
            represents 1.0 ETH as 10¹⁸. Multiplied by any meaningful token amount, this
            would overflow the 64-bit limit quickly.
          </p>
          <p className="docs-p">
            Therefore, <strong>all ERC-7984 wrapper tokens use 6 decimals</strong>, regardless
            of the underlying token&apos;s precision. The wrapper contract scales amounts
            automatically during shielding and unshielding.
          </p>

          <div className="docs-callout docs-callout-warning">
            <strong>⚠️ Critical rule:</strong> When calling <code>useShield</code>, parse the
            amount using the <em>underlying</em> token&apos;s decimals. When calling{' '}
            <code>useUnshield</code>, always use <strong>6 decimals</strong> (wrapper decimals).
          </div>

          <h4 className="docs-h4">Decision table</h4>
          <table className="docs-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Decimals to use</th>
                <th>Example (1.0 WETH)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="docs-prop-row">
                <td>Shield (wrap)</td>
                <td><code>parseUnits(amount, underlyingDecimals)</code></td>
                <td><code>parseUnits("1", 18)</code> → 10¹⁸</td>
              </tr>
              <tr className="docs-prop-row">
                <td>Unshield (unwrap)</td>
                <td><code>parseUnits(amount, 6)</code></td>
                <td><code>parseUnits("1", 6)</code> → 10⁶</td>
              </tr>
              <tr className="docs-prop-row">
                <td>Display confidential balance</td>
                <td><code>formatUnits(balance, 6)</code></td>
                <td><code>formatUnits(1_000_000n, 6)</code> → "1.0"</td>
              </tr>
            </tbody>
          </table>

          <CodeBlock
            lang="ts"
            filename="decimal-scaling.ts"
            code={`import { parseUnits, formatUnits } from 'viem';

// USDC (6 decimals) — same decimals as wrapper, no confusion
parseUnits('100', 6)   // for shield: 100_000_000n ✓
parseUnits('100', 6)   // for unshield: 100_000_000n ✓  — same!

// WETH (18 decimals underlying, 6 wrapper)
parseUnits('1', 18)    // for shield: 1_000_000_000_000_000_000n ✓
parseUnits('1', 6)     // for unshield: 1_000_000n ✓

// Display: always use 6 (wrapper decimals)
formatUnits(1_000_000n, 6)  // "1.0" ✓
formatUnits(1_000_000n, 18) // "0.000000000001" ✗  ← zero bug!`}
          />
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="permit-flow" title="EIP-712 Permits">
          <p className="docs-lead">
            Reading a confidential balance requires an EIP-712 typed-data signature from the
            token owner&apos;s wallet. This signature authorizes the Zama Gateway to decrypt the
            ciphertext and return the plaintext value to the frontend session.
          </p>

          <div className="docs-callout docs-callout-error">
            <strong>🚨 Security rule — NEVER auto-fire permits.</strong> Every call to{' '}
            <code>useConfidentialBalance</code> or <code>useConfidentialBalances</code> with{' '}
            <code>enabled: true</code> will immediately request a wallet signature. Always gate it
            behind an explicit <code>decryptRequested</code> boolean state that is only set{' '}
            <code>true</code> on user click.
          </div>

          <h4 className="docs-h4">How it works</h4>
          <div className="docs-steps">
            {[
              { n: '1', t: 'User clicks "Decrypt"', d: 'Set decryptRequested = true in your component state.' },
              { n: '2', t: 'SDK requests EIP-712 signature', d: 'The hook constructs a typed data payload and asks MetaMask/Rabby to sign it. This is off-chain — no gas, no transaction.' },
              { n: '3', t: 'Session key derived', d: 'The signature is used to derive a short-lived session key scoped to your wallet address and the specific contract.' },
              { n: '4', t: 'Zama Gateway decrypts', d: 'The Gateway uses the session key to decrypt the on-chain ciphertext. Only your account\'s ciphertexts can be decrypted with your key.' },
              { n: '5', t: 'Plaintext returned to browser', d: 'The decrypted bigint balance is returned to your component. It is never stored on-chain in plaintext.' },
            ].map((s) => (
              <div key={s.n} className="docs-step">
                <div className="docs-step-num">{s.n}</div>
                <div>
                  <strong>{s.t}</strong>
                  <p className="text-sm text-muted" style={{ marginTop: 2 }}>{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="docs-info-box">
            <strong>Token selector reset:</strong> When the user changes the selected token in
            your UI, reset <code>decryptRequested</code> synchronously in the{' '}
            <code>onChange</code> handler — not only in a <code>useEffect</code>. A one-frame
            delay in the effect can cause the old <code>true</code> value to combine with the
            new token address and auto-fire a permit.
          </div>

          <CodeBlock
            lang="tsx"
            filename="permit-gate.tsx"
            code={`const [selectedToken, setSelectedToken] = useState(pairs[0]);
const [decryptRequested, setDecryptRequested] = useState(false);

// ✓ Reset synchronously on token change
const handleTokenChange = (newToken: WrapperPair) => {
  setSelectedToken(newToken);
  setDecryptRequested(false);  // ← must happen in same handler, not useEffect
};

const { data: balance } = useConfidentialBalance({
  tokenAddress: selectedToken.erc7984Address,
  enabled: decryptRequested && !!address,  // ← explicit gate
});`}
          />
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="addresses" title="Contract Addresses">
          <p className="docs-lead">
            All addresses below are sourced from the official Zama documentation and verified
            against the on-chain WrappersRegistry. Blocklisted entries (suspected test/placeholder
            contracts with vanity addresses) are excluded.
          </p>

          <SubSection id="addr-sepolia" title="Sepolia Testnet">
            <AddressTable
              network="Sepolia"
              registry="0x2f0750Bbb0A246059d80e94c454586a7F27a128e"
              pairs={[
                { symbol: 'USDC', erc20: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF', wrapper: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', decimals: 6 },
                { symbol: 'USDT', erc20: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0', wrapper: '0x4E7B06D78965594eB5EF5414c357ca21E1554491', decimals: 6 },
                { symbol: 'WETH', erc20: '0xff54739b16576FA5402F211D0b938469Ab9A5f3F', wrapper: '0x46208622DA27d91db4f0393733C8BA082ed83158', decimals: 18 },
                { symbol: 'ZAMA', erc20: '0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57', wrapper: '0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB', decimals: 18 },
                { symbol: 'BRON', erc20: '0xFf021fB13cA64e5354c62c954b949a88cfDEb25E', wrapper: '0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891', decimals: 18 },
                { symbol: 'tGBP', erc20: '0x93c931278A2aad1916783F952f94276eA5111442', wrapper: '0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC', decimals: 18 },
                { symbol: 'XAUt', erc20: '0x24377AE4AA0C45ecEe71225007f17c5D423dd940', wrapper: '0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7', decimals: 6 },
                { symbol: 'ctGBP (restricted)', erc20: '0x167D...A208', wrapper: '0x167D...A208', decimals: 18 },
              ]}
            />
            <p className="docs-p text-sm text-muted" style={{ marginTop: 8 }}>
              The first 7 pairs are <strong>mock tokens</strong> with a public <code>mint()</code>.
              The 8th (<code>ctGBP</code> restricted) is a non-mintable pair — it does not have
              a public mint function.
            </p>
          </SubSection>

          <SubSection id="addr-mainnet" title="Ethereum Mainnet">
            <AddressTable
              network="Mainnet"
              registry="0xeb5015fF021DB115aCe010f23F55C2591059bBA0"
              pairs={[
                { symbol: 'USDC', erc20: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', wrapper: '0xe978F22157048E5DB8E5d07971376e86671672B2', decimals: 6 },
                { symbol: 'USDT', erc20: '0xdAC17F958D2ee523a2206206994597C13D831ec7', wrapper: '0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50', decimals: 6 },
                { symbol: 'WETH', erc20: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', wrapper: '0xda9396b82634Ea99243cE51258B6A5Ae512D4893', decimals: 18 },
                { symbol: 'ZAMA', erc20: '0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3', wrapper: '0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071', decimals: 18 },
                { symbol: 'BRON', erc20: '0xBA2C598E11eD093079cC324FCa5BbbA99F616E83', wrapper: '0x85dE671c3bec1aDeD752c3Cea943521181C826bc', decimals: 18 },
                { symbol: 'tGBP', erc20: '0x27f6c8289550fce67f6b50bed1f519966afe5287', wrapper: '0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9', decimals: 18 },
                { symbol: 'XAUt', erc20: '0x68749665FF8D2d112Fa859AA293F07A622782F38', wrapper: '0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1', decimals: 6 },
              ]}
            />
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════════ */}
        <Section id="errors" title="Error Reference">
          <p className="docs-lead">
            Use <code>matchZamaError</code> from <code>@zama-fhe/sdk</code> to classify SDK
            errors into user-friendly messages. ZamaVault re-exports this via the{' '}
            <code>classifyError(err)</code> utility in <code>src/lib/errors.ts</code>.
          </p>

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
              <ErrorRow code="INSUFFICIENT_CONFIDENTIAL_BALANCE" title="Insufficient Balance" description="Confidential balance is lower than the unshield amount." retryable={false} />
              <ErrorRow code="INSUFFICIENT_ERC20_BALANCE" title="Insufficient Tokens" description="Public token balance is lower than the shield amount." retryable={false} />
              <ErrorRow code="BALANCE_CHECK_UNAVAILABLE" title="Balance Check Unavailable" description="Cannot verify balance — sign a permit first." retryable />
              <ErrorRow code="ERC20_READ_FAILED" title="Token Read Failed" description="Could not read token balance from chain — network issue." retryable />
              <ErrorRow code="ACL_PAUSED" title="Protocol Paused" description="The FHE access control layer is temporarily paused for maintenance." retryable={false} />
              <ErrorRow code="APPROVAL_FAILED" title="Approval Failed" description="ERC-20 approval transaction failed — check allowance and balance." retryable />
            </tbody>
          </table>

          <div className="docs-info-box" style={{ marginTop: 'var(--sp-6)' }}>
            <strong>Wallet errors (non-SDK):</strong> Common wallet rejection strings like{' '}
            <code>user rejected</code>, <code>User denied</code>, <code>ACTION_REJECTED</code>,
            and <code>user cancelled</code> are caught by the fallback handler in{' '}
            <code>classifyError()</code> and mapped to &quot;Request Cancelled&quot;.
          </div>
        </Section>

        {/* ── Footer ── */}
        <div className="docs-footer">
          <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
            <a
              href="https://docs.zama.org/protocol/sdk/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-ext-link"
            >
              <ExternalLink size={13} /> Zama SDK Docs
            </a>
            <a
              href="https://github.com/hosein-ul/zamavault"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-ext-link"
            >
              <ExternalLink size={13} /> GitHub
            </a>
            <Link href="/api/registry?chain=sepolia" className="docs-ext-link">
              <ExternalLink size={13} /> REST API (Sepolia)
            </Link>
            <Link href="/learn" className="docs-ext-link">
              <BookOpen size={13} /> Interactive Tutorial
            </Link>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 'var(--sp-4)' }}>
            Contract addresses verified against{' '}
            <a
              href="https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              Zama official docs
            </a>
            . Registry entries are live on-chain — always use the REST API or{' '}
            <code>useListPairs</code> for the most current data.
          </p>
        </div>

      </main>
    </div>
  );
}
