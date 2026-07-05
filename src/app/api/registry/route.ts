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
 * Falls back to the hardcoded snapshot only when the on-chain read fails.
 *
 * Usage:
 *   fetch("https://YOUR_DEPLOYMENT_URL/api/registry?chain=sepolia")
 *     .then(r => r.json())
 *     .then(data => console.log(data.pairs))
 */

/**
 * Real WrappersRegistry ABI — the two view functions we need to paginate the
 * pair list. Verified against the on-chain contract source at
 * https://github.com/zama-ai/protocol-apps/tree/main/contracts/confidential-token-wrappers-registry
 *
 * Note: the previous version of this route called a non-existent `listPairs`
 * function which always reverted, causing every request to fall through to
 * the cached snapshot. That is now fixed.
 */
const REGISTRY_ABI = [
  {
    name: 'getTokenConfidentialTokenPairsLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTokenConfidentialTokenPairsSlice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'fromIndex', type: 'uint256' },
      { name: 'toIndex', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'tokenAddress', type: 'address' },
          { name: 'confidentialTokenAddress', type: 'address' },
          { name: 'isValid', type: 'bool' },
        ],
      },
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

/**
 * Registry entries that are on-chain but that our review flags as unverified
 * (suspected test/placeholder deployments). Instead of hiding them —
 * which would silently drop official registry coverage — we surface them
 * with an `unverified` flag + rationale so consumers can display a warning.
 *
 * Keep in sync with `BLOCKLISTED_WRAPPERS` in `src/lib/registry.ts`.
 */
const UNVERIFIED_WRAPPERS: Record<string, string> = {
  '0xba4cff6ed6f7cb2a58776deca4e984b498446762':
    'Suspected test/placeholder entry (cbbqTGBP). Underlying uses a vanity address (0xbeeff…) and the asset name has no known referent. See docs.zama.org mainnet addresses page.',
};

interface PairResult {
  tokenAddress: string;
  confidentialTokenAddress: string;
  symbol: string;
  confidentialSymbol: string;
  name: string;
  decimals: number;
  wrapperDecimals: number;
  isValid: boolean;
  unverified?: boolean;
  unverifiedReason?: string;
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
    const totalBig = (await client.readContract({
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getTokenConfidentialTokenPairsLength',
    })) as bigint;
    const total = Number(totalBig);

    if (total === 0) {
      return NextResponse.json(
        { pairs: [], total: 0, chain: chainParam, registryAddress, timestamp: Date.now(), source: 'on-chain' },
        { headers: cacheHeaders() },
      );
    }

    // 2. Fetch all pairs in one call (fromIndex inclusive, toIndex exclusive)
    const slice = (await client.readContract({
      address: registryAddress,
      abi: REGISTRY_ABI,
      functionName: 'getTokenConfidentialTokenPairsSlice',
      args: [0n, totalBig],
    })) as readonly {
      tokenAddress: `0x${string}`;
      confidentialTokenAddress: `0x${string}`;
      isValid: boolean;
    }[];

    // 3. Enrich with ERC-20 metadata (parallel)
    const metaPromises = slice.map(async (pair): Promise<PairResult> => {
      const [underlyingMeta, wrapperMeta] = await Promise.all([
        readTokenMeta(client, pair.tokenAddress),
        readTokenMeta(client, pair.confidentialTokenAddress),
      ]);

      const wrapperKey = pair.confidentialTokenAddress.toLowerCase();
      const unverifiedReason = UNVERIFIED_WRAPPERS[wrapperKey];

      return {
        tokenAddress: pair.tokenAddress,
        confidentialTokenAddress: pair.confidentialTokenAddress,
        symbol: underlyingMeta.symbol,
        confidentialSymbol: `c${underlyingMeta.symbol}`,
        name: underlyingMeta.name,
        decimals: underlyingMeta.decimals,
        wrapperDecimals: wrapperMeta.decimals,
        isValid: pair.isValid,
        ...(unverifiedReason ? { unverified: true, unverifiedReason } : {}),
      };
    });

    const pairs = await Promise.all(metaPromises);

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
    // Fallback to hardcoded snapshot only when the RPC read genuinely fails.
    console.error('Registry on-chain read failed, falling back to snapshot:', err);
    const fallback = (KNOWN_WRAPPERS[chain.id as keyof typeof KNOWN_WRAPPERS] ?? []).map((p): PairResult => {
      const wrapperKey = p.erc7984Address.toLowerCase();
      const unverifiedReason = UNVERIFIED_WRAPPERS[wrapperKey];
      return {
        tokenAddress: p.erc20Address,
        confidentialTokenAddress: p.erc7984Address,
        symbol: p.symbol,
        confidentialSymbol: `c${p.symbol}`,
        name: p.name,
        decimals: p.decimals,
        wrapperDecimals: p.wrapperDecimals,
        isValid: p.isValid ?? true,
        ...(unverifiedReason ? { unverified: true, unverifiedReason } : {}),
      };
    });

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
