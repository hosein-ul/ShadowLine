'use client';

import React, { useState, useMemo } from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://YOUR_DEPLOYMENT_URL';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import CopyButton from '@/components/ui/CopyButton';
import BlurIn from '@/components/ui/BlurIn';
import { useActiveNetwork } from '@/app/ClientLayout';
import { useRegistryPairs } from '@/lib/registry';
import { type WrapperPair } from '@/config/contracts';
import {
  Code2,
  Shield,
  Unlock,
  Eye,
  List,
  ExternalLink,
  Terminal,
  BookOpen,
} from 'lucide-react';

/* ─── Operation types ───────────────────────────────────────────────────────── */

type Operation = 'list' | 'shield' | 'unshield' | 'decrypt';
type Framework = 'react' | 'viem' | 'ethers';

interface OperationMeta {
  id: Operation;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const OPERATIONS: OperationMeta[] = [
  {
    id: 'list',
    label: 'List Pairs',
    description: 'Query all registered ERC-20 ↔ ERC-7984 wrapper pairs from the on-chain registry',
    icon: <List size={16} />,
    color: 'var(--accent)',
  },
  {
    id: 'shield',
    label: 'Shield (Wrap)',
    description: 'Convert public ERC-20 tokens into confidential ERC-7984 tokens',
    icon: <Shield size={16} />,
    color: 'var(--success)',
  },
  {
    id: 'unshield',
    label: 'Unshield (Unwrap)',
    description: 'Convert confidential ERC-7984 tokens back to public ERC-20',
    icon: <Unlock size={16} />,
    color: 'var(--warning)',
  },
  {
    id: 'decrypt',
    label: 'Decrypt Balance',
    description: 'Read an encrypted FHE balance by signing an EIP-712 permit',
    icon: <Eye size={16} />,
    color: '#a78bfa',
  },
];

const FRAMEWORKS: { id: Framework; label: string; badge: string }[] = [
  { id: 'react', label: 'React (Zama SDK)', badge: '@zama-fhe/react-sdk' },
  { id: 'viem', label: 'Viem (Raw)', badge: 'viem' },
  { id: 'ethers', label: 'Ethers.js', badge: 'ethers v6' },
];

/* ─── Snippet generators ────────────────────────────────────────────────────── */

function generateSnippet(
  operation: Operation,
  framework: Framework,
  pair: WrapperPair | null,
  chainName: string,
): string {
  const sym = pair?.symbol ?? 'USDC';
  const erc20 = pair?.erc20Address ?? '0x...underlying';
  const erc7984 = pair?.erc7984Address ?? '0x...wrapper';
  const registryAddr = chainName === 'sepolia'
    ? '0x2f0750Bbb0A246059d80e94c454586a7F27a128e'
    : '0xeb5015fF021DB115aCe010f23F55C2591059bBA0';

  switch (operation) {
    case 'list':
      return listSnippet(framework, registryAddr, chainName);
    case 'shield':
      return shieldSnippet(framework, sym, erc20, erc7984);
    case 'unshield':
      return unshieldSnippet(framework, sym, erc7984);
    case 'decrypt':
      return decryptSnippet(framework, sym, erc7984);
  }
}

function listSnippet(fw: Framework, registry: string, chain: string): string {
  if (fw === 'react') {
    return `import { useListPairs } from '@zama-fhe/react-sdk';

function RegistryList() {
  const { data, isLoading, error } = useListPairs({
    page: 1,
    pageSize: 50,
    metadata: true,
  });

  if (isLoading) return <p>Loading pairs...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.pairs.map((pair) => (
        <li key={pair.confidentialToken}>
          {pair.metadata?.symbol} — {pair.token} ↔ {pair.confidentialToken}
        </li>
      ))}
    </ul>
  );
}`;
  }

  if (fw === 'viem') {
    return `import { createPublicClient, http } from 'viem';
import { ${chain} } from 'viem/chains';

const REGISTRY = '${registry}';

const client = createPublicClient({
  chain: ${chain},
  transport: http(),
});

// 1. Get total pair count
const total = await client.readContract({
  address: REGISTRY,
  abi: [{
    name: 'getTokenConfidentialTokenPairsLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  }],
  functionName: 'getTokenConfidentialTokenPairsLength',
});

// 2. Fetch all pairs
const [tokens, wrappers] = await client.readContract({
  address: REGISTRY,
  abi: [{
    name: 'listPairs',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    outputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'confidentialTokens', type: 'address[]' },
    ],
  }],
  functionName: 'listPairs',
  args: [0n, total],
});

console.log('Pairs:', tokens.map((t, i) => ({
  underlying: t,
  wrapper: wrappers[i],
})));`;
  }

  // ethers
  return `import { ethers } from 'ethers';

const REGISTRY = '${registry}';
const RPC = 'https://ethereum-${chain === 'mainnet' ? '' : 'sepolia-'}rpc.publicnode.com';

const provider = new ethers.JsonRpcProvider(RPC);

const registry = new ethers.Contract(REGISTRY, [
  'function getTokenConfidentialTokenPairsLength() view returns (uint256)',
  'function listPairs(uint256 start, uint256 count) view returns (address[], address[])',
], provider);

// 1. Get total count
const total = await registry.getTokenConfidentialTokenPairsLength();

// 2. Fetch all pairs
const [tokens, wrappers] = await registry.listPairs(0, total);

tokens.forEach((token, i) => {
  console.log(\`Pair \${i}: \${token} ↔ \${wrappers[i]}\`);
});`;
}

function shieldSnippet(fw: Framework, sym: string, erc20: string, erc7984: string): string {
  if (fw === 'react') {
    return `import { useShield } from '@zama-fhe/react-sdk';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

function Shield${sym}() {
  const { address } = useAccount();
  const { mutateAsync: shield, isPending } = useShield({
    tokenAddress: '${erc7984}', // ERC-7984 wrapper
  });

  const handleShield = async () => {
    try {
      // Amount in underlying token decimals (e.g. 6 for USDC, 18 for WETH)
      const amount = parseUnits('100', 6); // 100 ${sym}

      const tx = await shield({ amount });
      console.log('Shield tx:', tx);
    } catch (err) {
      console.error('Shield failed:', err);
    }
  };

  return (
    <button onClick={handleShield} disabled={isPending}>
      {isPending ? 'Shielding...' : 'Shield 100 ${sym}'}
    </button>
  );
}`;
  }

  if (fw === 'viem') {
    return `import { createWalletClient, createPublicClient, http, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';

const ERC20 = '${erc20}';
const WRAPPER = '${erc7984}';

// 1. Approve the wrapper to spend your ERC-20
const approveHash = await walletClient.writeContract({
  address: ERC20,
  abi: [{
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  }],
  functionName: 'approve',
  args: [WRAPPER, parseUnits('100', 6)], // underlying decimals
});

await publicClient.waitForTransactionReceipt({ hash: approveHash });

// 2. Call wrap() on the ERC-7984 wrapper
const wrapHash = await walletClient.writeContract({
  address: WRAPPER,
  abi: [{
    name: 'wrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  }],
  functionName: 'wrap',
  args: [parseUnits('100', 6)],
});

console.log('Wrap tx:', wrapHash);`;
  }

  // ethers
  return `import { ethers } from 'ethers';

const ERC20 = '${erc20}';
const WRAPPER = '${erc7984}';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 1. Approve
const erc20Contract = new ethers.Contract(ERC20, [
  'function approve(address spender, uint256 amount) returns (bool)',
], signer);

const amount = ethers.parseUnits('100', 6); // underlying decimals
const approveTx = await erc20Contract.approve(WRAPPER, amount);
await approveTx.wait();

// 2. Wrap (shield)
const wrapperContract = new ethers.Contract(WRAPPER, [
  'function wrap(uint256 amount)',
], signer);

const wrapTx = await wrapperContract.wrap(amount);
console.log('Wrap tx:', wrapTx.hash);`;
}

function unshieldSnippet(fw: Framework, sym: string, erc7984: string): string {
  if (fw === 'react') {
    return `import { useUnshield } from '@zama-fhe/react-sdk';
import { parseUnits } from 'viem';

function Unshield${sym}() {
  const { mutateAsync: unshield, isPending } = useUnshield({
    tokenAddress: '${erc7984}', // ERC-7984 wrapper
  });

  const handleUnshield = async () => {
    try {
      // Amount in WRAPPER decimals (always 6 for FHE tokens)
      const amount = parseUnits('50', 6); // 50 c${sym}

      const tx = await unshield({ amount });
      console.log('Unshield tx:', tx);
      // Note: unshield is a 2-phase process.
      // The SDK handles finalization automatically,
      // but if the user closes the tab, use useResumeUnshield.
    } catch (err) {
      console.error('Unshield failed:', err);
    }
  };

  return (
    <button onClick={handleUnshield} disabled={isPending}>
      {isPending ? 'Unshielding...' : 'Unshield 50 c${sym}'}
    </button>
  );
}`;
  }

  if (fw === 'viem') {
    return `import { parseUnits } from 'viem';

const WRAPPER = '${erc7984}';

// Note: Unshielding with raw viem requires two steps:
// 1. Call unwrap() to initiate
// 2. Wait for the Zama Gateway to process, then call finalizeUnwrap()
// The Zama React SDK handles step 2 automatically.

// Step 1: Initiate unwrap
const unwrapHash = await walletClient.writeContract({
  address: WRAPPER,
  abi: [{
    name: 'unwrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  }],
  functionName: 'unwrap',
  args: [parseUnits('50', 6)], // wrapper decimals (always 6)
});

console.log('Unwrap initiated:', unwrapHash);

// Step 2: Finalization happens via the Zama Gateway.
// For production apps, use the SDK's useResumeUnshield
// to handle this automatically.`;
  }

  // ethers
  return `import { ethers } from 'ethers';

const WRAPPER = '${erc7984}';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const wrapper = new ethers.Contract(WRAPPER, [
  'function unwrap(uint256 amount)',
], signer);

// Step 1: Initiate unwrap (wrapper decimals = 6)
const amount = ethers.parseUnits('50', 6);
const tx = await wrapper.unwrap(amount);
console.log('Unwrap initiated:', tx.hash);

// Step 2: Finalization is handled by the Zama Gateway.
// For production usage, use the Zama React SDK's
// useResumeUnshield hook to handle interrupted flows.`;
}

function decryptSnippet(fw: Framework, sym: string, erc7984: string): string {
  if (fw === 'react') {
    return `import { useConfidentialBalance } from '@zama-fhe/react-sdk';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { formatUnits } from 'viem';

function DecryptBalance() {
  const { address } = useAccount();
  const [decryptRequested, setDecryptRequested] = useState(false);

  const { data: balance, isLoading, error } = useConfidentialBalance({
    tokenAddress: '${erc7984}',
    // IMPORTANT: Only enable when user explicitly clicks "Decrypt"
    // Never auto-fire EIP-712 permits!
    enabled: decryptRequested && !!address,
  });

  if (!decryptRequested) {
    return (
      <button onClick={() => setDecryptRequested(true)}>
        Decrypt c${sym} Balance
      </button>
    );
  }

  if (isLoading) return <p>Awaiting wallet signature...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // Wrapper decimals are always 6
  const formatted = balance
    ? formatUnits(balance, 6)
    : '0';

  return <p>c${sym} balance: {formatted}</p>;
}`;
  }

  if (fw === 'viem') {
    return `// Decryption requires the Zama SDK's EIP-712 permit flow.
// Raw viem cannot decrypt FHE ciphertexts directly — you need
// the SDK to generate the permit signature and communicate
// with the Zama Gateway.
//
// For non-React apps, use the Zama Core SDK:

import { ZamaSDK } from '@zama-fhe/sdk';

const WRAPPER = '${erc7984}';

// Initialize the SDK (see Zama docs for full setup)
const sdk = new ZamaSDK({ /* config */ });

// The SDK handles:
// 1. Generating an EIP-712 typed data signature
// 2. Sending it to the Zama Gateway
// 3. Receiving the decrypted plaintext value
//
// See: https://docs.zama.org/protocol/sdk/guides/authentication`;
  }

  // ethers
  return `// Decryption requires the Zama SDK's EIP-712 permit flow.
// The Zama Gateway performs the decryption off-chain using
// a session key derived from your wallet signature.
//
// For ethers.js-based apps, use the Zama Core SDK alongside
// your ethers provider:

import { ZamaSDK } from '@zama-fhe/sdk';

const WRAPPER = '${erc7984}';

// The recommended approach for production apps is to use
// the Zama React SDK (useConfidentialBalance hook) which
// handles the full permit → decrypt → display flow.
//
// For custom integrations, refer to:
// https://docs.zama.org/protocol/sdk/guides/authentication
//
// Key principle: NEVER auto-fire EIP-712 permits.
// Always require an explicit user action (button click)
// before requesting a wallet signature.`;
}

/* ─── REST API snippet (special — framework-independent) ── */

function restApiSnippet(chain: string): string {
  return `// ShadowLine Public REST API — no SDK required!
// Returns all registered wrapper pairs with metadata.

const response = await fetch(
  '${APP_URL}/api/registry?chain=${chain}'
);

const data = await response.json();

// Response shape:
// {
//   pairs: [{
//     tokenAddress: "0x...",
//     confidentialTokenAddress: "0x...",
//     symbol: "USDC",
//     confidentialSymbol: "cUSDC",
//     name: "USD Coin",
//     decimals: 6,
//     wrapperDecimals: 6
//   }, ...],
//   total: 8,
//   chain: "${chain}",
//   source: "on-chain",
//   timestamp: 1719100000000
// }

console.log(\`Found \${data.total} pairs on \${data.chain}\`);
data.pairs.forEach(p => {
  console.log(\`  \${p.symbol} → \${p.confidentialSymbol}\`);
});`;
}

/* ─── Doc links per operation ───────────────────────────────────────────────── */

const DOC_LINKS: Record<Operation, { label: string; url: string }> = {
  list: {
    label: 'WrappersRegistry API Reference',
    url: 'https://docs.zama.org/protocol/sdk/api-references/sdk/wrappersregistry',
  },
  shield: {
    label: 'useShield Hook Reference',
    url: 'https://docs.zama.org/protocol/sdk/overview',
  },
  unshield: {
    label: 'useResumeUnshield Reference',
    url: 'https://docs.zama.org/protocol/sdk/api-references/react/useresumeunshield',
  },
  decrypt: {
    label: 'Authentication & Permits Guide',
    url: 'https://docs.zama.org/protocol/sdk/guides/authentication',
  },
};

/* ─── Main page ─────────────────────────────────────────────────────────────── */

export default function DevelopersPage() {
  const { activeChainId, isTestnet } = useActiveNetwork();
  const { pairs, isLoading } = useRegistryPairs(activeChainId);

  const [selectedOp, setSelectedOp] = useState<Operation>('list');
  const [selectedFw, setSelectedFw] = useState<Framework>('react');
  const [selectedPairIdx, setSelectedPairIdx] = useState(0);
  const [showRestApi, setShowRestApi] = useState(false);

  const chainName = isTestnet ? 'sepolia' : 'mainnet';
  const selectedPair: WrapperPair | null = pairs[selectedPairIdx] ?? null;

  const snippet = useMemo(() => {
    if (showRestApi) return restApiSnippet(chainName);
    return generateSnippet(selectedOp, selectedFw, selectedPair, chainName);
  }, [selectedOp, selectedFw, selectedPair, chainName, showRestApi]);

  const currentOpMeta = OPERATIONS.find((o) => o.id === selectedOp)!;
  const docLink = DOC_LINKS[selectedOp];

  return (
    <div className="dev-page">
      {/* ── Header ── */}
      <div className="dev-header">
        <Badge variant="accent" style={{ marginBottom: 'var(--sp-3)' }}>
          <Code2 size={12} style={{ marginRight: 4 }} /> Developer Tools
        </Badge>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
          <BlurIn text="Code Snippet Generator" duration={600} />
        </h1>
        <p
          className="text-secondary"
          style={{
            fontSize: 'var(--text-lg)',
            maxWidth: 640,
            margin: 'var(--sp-3) auto 0',
            lineHeight: 'var(--lh-relaxed)',
          }}
        >
          Select a token, pick an operation, choose your framework — get
          copy-paste ready code for Zama&apos;s confidential token ecosystem.
        </p>
      </div>

      <div className="dev-layout">
        {/* ── Left panel: Controls ── */}
        <div className="dev-controls">
          {/* Operation selector */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-4)', fontSize: 'var(--text-sm)' }}>
              <Terminal size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
              Operation
            </h3>
            <div className="dev-op-grid">
              {OPERATIONS.map((op) => (
                <button
                  key={op.id}
                  className={`dev-op-btn ${selectedOp === op.id && !showRestApi ? 'active' : ''}`}
                  onClick={() => { setSelectedOp(op.id); setShowRestApi(false); }}
                  style={{
                    '--op-color': op.color,
                  } as React.CSSProperties}
                >
                  <span className="dev-op-icon">{op.icon}</span>
                  <span className="dev-op-label">{op.label}</span>
                </button>
              ))}
            </div>

            {/* REST API toggle */}
            <button
              className={`dev-op-btn dev-op-rest ${showRestApi ? 'active' : ''}`}
              onClick={() => setShowRestApi(true)}
              style={{
                marginTop: 'var(--sp-3)',
                width: '100%',
                '--op-color': 'var(--info)',
              } as React.CSSProperties}
            >
              <span className="dev-op-icon"><ExternalLink size={16} /></span>
              <span className="dev-op-label">REST API (No SDK)</span>
            </button>
          </Card>

          {/* Token selector */}
          {!showRestApi && selectedOp !== 'list' && (
            <Card variant="glass" padding="md">
              <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)' }}>
                Token
              </h3>
              {isLoading ? (
                <div className="text-sm text-muted">Loading pairs...</div>
              ) : (
                <select
                  className="dev-select"
                  value={selectedPairIdx}
                  onChange={(e) => setSelectedPairIdx(Number(e.target.value))}
                  aria-label="Select token"
                >
                  {pairs.map((p, i) => (
                    <option key={p.erc7984Address} value={i}>
                      {p.symbol} — c{p.symbol}
                    </option>
                  ))}
                </select>
              )}
              {selectedPair && (
                <div className="text-xs text-muted" style={{ marginTop: 'var(--sp-2)' }}>
                  <div>ERC-20: <code className="font-mono">{selectedPair.erc20Address.slice(0, 10)}...{selectedPair.erc20Address.slice(-6)}</code></div>
                  <div>ERC-7984: <code className="font-mono">{selectedPair.erc7984Address.slice(0, 10)}...{selectedPair.erc7984Address.slice(-6)}</code></div>
                </div>
              )}
            </Card>
          )}

          {/* Framework selector */}
          {!showRestApi && (
            <Card variant="glass" padding="md">
              <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)' }}>
                Framework
              </h3>
              <div className="dev-fw-list">
                {FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.id}
                    className={`dev-fw-btn ${selectedFw === fw.id ? 'active' : ''}`}
                    onClick={() => setSelectedFw(fw.id)}
                  >
                    <span style={{ fontWeight: 600 }}>{fw.label}</span>
                    <Badge variant="default" size="sm">{fw.badge}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Docs link */}
          {!showRestApi && (
            <a
              href={docLink.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              <Card variant="glass" padding="sm" hover>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{docLink.label}</span>
                  <ExternalLink size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </div>
              </Card>
            </a>
          )}
        </div>

        {/* ── Right panel: Code output ── */}
        <div className="dev-output">
          <Card variant="default" padding="none" className="dev-code-card">
            {/* Code header */}
            <div className="dev-code-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                {showRestApi ? (
                  <>
                    <Badge variant="info">REST API</Badge>
                    <span className="text-sm text-muted">fetch() — No SDK required</span>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        color: currentOpMeta.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {currentOpMeta.icon}
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                        {currentOpMeta.label}
                      </span>
                    </span>
                    <Badge variant="default">
                      {FRAMEWORKS.find((f) => f.id === selectedFw)?.badge}
                    </Badge>
                    {selectedOp !== 'list' && selectedPair && (
                      <Badge variant="accent">{selectedPair.symbol}</Badge>
                    )}
                  </>
                )}
              </div>
              <CopyButton text={snippet} />
            </div>

            {/* Code block */}
            <div className="dev-code-body">
              <pre className="dev-code-pre">
                <code>{snippet}</code>
              </pre>
            </div>
          </Card>

          {/* Usage notes */}
          <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
              <Badge variant="warning">Note</Badge>
              <p className="text-sm text-secondary" style={{ lineHeight: 'var(--lh-relaxed)' }}>
                {showRestApi ? (
                  <>
                    The REST API endpoint reads directly from the on-chain registry
                    and caches results for 60 seconds. No authentication or SDK
                    installation required — use it from any language or platform.
                  </>
                ) : selectedOp === 'decrypt' && selectedFw !== 'react' ? (
                  <>
                    Balance decryption requires the Zama SDK&apos;s EIP-712 permit
                    flow. Raw contract calls alone cannot decrypt FHE ciphertexts.
                    For the best developer experience, use the React SDK hooks.
                  </>
                ) : selectedOp === 'unshield' ? (
                  <>
                    Unshielding is a two-phase process: the on-chain unwrap request
                    is followed by Zama Gateway finalization (~30-60s). If the user
                    closes their browser during this window, use{' '}
                    <code>useResumeUnshield</code> to complete the operation later.
                  </>
                ) : selectedOp === 'shield' ? (
                  <>
                    The wrapper always uses 6 decimals (FHE euint64 constraint).
                    When shielding, parse the amount using the <strong>underlying</strong>{' '}
                    token&apos;s decimals. The wrapper contract handles the scaling
                    automatically.
                  </>
                ) : (
                  <>
                    The on-chain WrappersRegistry is the canonical source for all
                    registered token pairs. Use <code>listPairs(start, count)</code>{' '}
                    to paginate through entries. Each pair maps an ERC-20 underlying
                    to its ERC-7984 confidential wrapper.
                  </>
                )}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
