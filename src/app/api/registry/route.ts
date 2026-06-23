import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, type PublicClient } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { REGISTRY_ADDRESSES, KNOWN_WRAPPERS } from '@/config/contracts';

/**
 * GET /api/registry?chain=sepolia|mainnet
 *
 * Public REST API for querying the Zama WrappersRegistry.
 *
 * Returns every registered ERC-20 ↔ ERC-7984 wrapper pair with metadata.
 * Falls back to the hardcoded snapshot when the on-chain read fails.
 *
 * Usage:
 *   fetch("https://YOUR_DEPLOYMENT_URL/api/registry?chain=sepolia")
 *     .then(r => r.json())
 *     .then(data => console.log(data.pairs))
 */

// Minimal ABI for the WrappersRegistry — only the methods we need.
// The real contract exposes more, but these two give us the full pair list.
const REGISTRY_ABI = [
  {
    name: 'getTokenConfidentialTokenPairsLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    // listPairs(uint256 start, uint256 count) → (address[] tokens, address[] confidentialTokens)
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
  },
] as const;

// ERC-20 metadata ABI for enrichment
const ERC20_META_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
] as const;

const CHAIN_MAP: Record<string, typeof sepolia | typeof mainnet> = {
  sepolia,
  mainnet,
};

const RPC_URLS: Record<number, string> = {
  [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://ethereum-rpc.publicnode.com',
};

// cbbqTGBP blocklist — same as client-side, see src/lib/registry.ts
const BLOCKLISTED = new Set([
  '0xba4cff6ed6f7cb2a58776deca4e984b498446762',
]);

interface PairResult {
  tokenAddress: string;
  confidentialTokenAddress: string;
  symbol: string;
  confidentialSymbol: string;
  name: string;
  decimals: number;
  wrapperDecimals: number;
}

async function readTokenMeta(
  client: PublicClient,
  address: `0x${string}`,
): Promise<{ name: string; symbol: string; decimals: number }> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'name' }),
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'symbol' }),
      client.readContract({ address, abi: ERC20_META_ABI, functionName: 'decimals' }),
    ]);
    return {
      name: name as string,
      symbol: (symbol as string).replace(/Mock$/i, ''),
      decimals: Number(decimals),
    };
  } catch {
    return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
  }
}

export async function GET(request: NextRequest) {
  const chainParam = request.nextUrl.searchParams.get('chain') ?? 'sepolia';
  const chain = CHAIN_MAP[chainParam.toLowerCase()];

  if (!chain) {
    return NextResponse.json(
      { error: `Invalid chain "${chainParam}". Use "sepolia" or "mainnet".` },
      { status: 400 },
    );
  }

  const registryAddress = REGISTRY_ADDRESSES[chain.id as keyof typeof REGISTRY_ADDRESSES];
  if (!registryAddress) {
    return NextResponse.json(
      { error: `No registry address configured for chain ${chain.id}.` },
      { status: 400 },
    );
  }

  const client = createPublicClient({
    chain,
    transport: http(RPC_URLS[chain.id]),
  });

  try {
    // 1. Get pair count
    const totalBig = await client.readContract({
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getTokenConfidentialTokenPairsLength',
    }) as bigint;
    const total = Number(totalBig);

    if (total === 0) {
      return NextResponse.json(
        { pairs: [], total: 0, chain: chainParam, registryAddress, timestamp: Date.now() },
        { headers: cacheHeaders() },
      );
    }

    // 2. Fetch all pairs in one call
    const [tokens, confidentialTokens] = await client.readContract({
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'listPairs',
      args: [0n, BigInt(total)],
    }) as [readonly `0x${string}`[], readonly `0x${string}`[]];

    // 3. Enrich with ERC-20 metadata (parallel)
    const pairs: PairResult[] = [];
    const metaPromises = tokens.map(async (tokenAddr, i) => {
      const wrapper = confidentialTokens[i];
      if (BLOCKLISTED.has(wrapper.toLowerCase())) return null;

      const [underlyingMeta, wrapperMeta] = await Promise.all([
        readTokenMeta(client, tokenAddr),
        readTokenMeta(client, wrapper),
      ]);

      return {
        tokenAddress: tokenAddr,
        confidentialTokenAddress: wrapper,
        symbol: underlyingMeta.symbol,
        confidentialSymbol: `c${underlyingMeta.symbol}`,
        name: underlyingMeta.name,
        decimals: underlyingMeta.decimals,
        wrapperDecimals: wrapperMeta.decimals,
      } satisfies PairResult;
    });

    const results = await Promise.all(metaPromises);
    for (const r of results) {
      if (r) pairs.push(r);
    }

    return NextResponse.json(
      {
        pairs,
        total: pairs.length,
        chain: chainParam,
        registryAddress,
        timestamp: Date.now(),
        source: 'on-chain',
      },
      { headers: cacheHeaders() },
    );
  } catch (err) {
    // Fallback to hardcoded snapshot
    console.error('Registry on-chain read failed, falling back to snapshot:', err);
    const fallback = (KNOWN_WRAPPERS[chain.id as keyof typeof KNOWN_WRAPPERS] ?? [])
      .filter((p) => !BLOCKLISTED.has(p.erc7984Address.toLowerCase()))
      .map((p) => ({
        tokenAddress: p.erc20Address,
        confidentialTokenAddress: p.erc7984Address,
        symbol: p.symbol,
        confidentialSymbol: `c${p.symbol}`,
        name: p.name,
        decimals: p.decimals,
        wrapperDecimals: p.wrapperDecimals,
      }));

    return NextResponse.json(
      {
        pairs: fallback,
        total: fallback.length,
        chain: chainParam,
        registryAddress,
        timestamp: Date.now(),
        source: 'cached-snapshot',
        warning: 'On-chain read failed. Showing cached snapshot which may be incomplete.',
      },
      { headers: cacheHeaders() },
    );
  }
}

function cacheHeaders(): HeadersInit {
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
  };
}
