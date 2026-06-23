# ZamaVault — CLAUDE.md

## Project Overview

ZamaVault is an all-in-one interface for Zama's confidential token ecosystem: live WrappersRegistry discovery, ERC-20 shield/unshield, encrypted portfolio decryption, and a Sepolia faucet. Built for the **Zama Developer Program Mainnet Season 3 Bounty Track** (deadline: 2026-07-07 AOE).

**Repository:** https://github.com/hosein-ul/zamavault
**Branch:** `feat/dynamic-registry-finding-1` (PR #1 against `main`)
**Stack:** Next.js 16 (App Router, Turbopack), React 19, Wagmi 3, Viem 2, @zama-fhe/react-sdk 3, TypeScript 5 (strict mode)

## Bounty Context

The bounty asks for a production-ready app that:
1. Surfaces every registered ERC-20 ↔ ERC-7984 wrapper pair from the on-chain WrappersRegistry (Sepolia + Mainnet)
2. Lets users wrap (shield) and unwrap (unshield) any registry pair
3. Decrypts any ERC-7984 balance through the EIP-712 user-decryption flow
4. Includes a Sepolia faucet for the official cTokenMocks

**Judged on:** coverage, correctness, extensibility, UX, code quality, production-readiness.
**Broader goal:** "Create templates and resources for the developer ecosystem — turn the registry into a product every developer and user can point to."

## Critical Rules

- **NEVER mention Claude, Claude Code, or Anthropic** anywhere in code, commits, PR descriptions, README, or any file that could be seen by judges. No `Co-Authored-By` headers. This is a competition submission.
- **NEVER auto-fire EIP-712 permit signatures.** Every decrypt/permit must be gated behind an explicit user click (button). The `decryptRequested` state pattern in `wrap/page.tsx` exists specifically for this — do not remove it.
- **NEVER commit secrets** — .env files are gitignored. Use `.env.example` for documentation.
- **Decimal scaling is load-bearing** — wrapper decimals are always 6 (FHE euint64 constraint), underlying can be 6 or 18. See `memory.md` for full explanation. Any change to `formatAmount`/`parseAmount` must be tested against this.

## Tech Stack & Architecture

```
src/
  app/
    page.tsx              — Registry table (main page) with per-row balance reads
    wrap/page.tsx         — Shield/Unshield swap interface
    portfolio/page.tsx    — Confidential portfolio with batch decrypt
    faucet/page.tsx       — Sepolia mock token minting
    error.tsx             — Global error boundary
    api/registry/route.ts — Public REST API endpoint
    ClientLayout.tsx      — Theme/network context providers
    layout.tsx            — Root layout with SSR theme injection
  components/
    ui/                   — Reusable UI components (Badge, Button, Card, Modal, Tooltip, etc.)
    layout/               — Header, Footer
    PendingUnshieldBanner.tsx — Resume interrupted unshield flows
  config/
    contracts.ts          — WrapperPair interface, KNOWN_WRAPPERS fallback, REGISTRY_ADDRESSES
    chains.ts             — SupportedChainId, chain configs (Sepolia + Mainnet)
    tokens.ts             — Display metadata (logos, colors) keyed by symbol
  lib/
    registry.ts           — useRegistryPairs hook (live on-chain + fallback), isMintablePair, blocklist
    errors.ts             — classifyError() using matchZamaError from Zama SDK
    utils.ts              — formatAmount, parseAmount, formatAddress, cn
    wrapper-abi.ts        — WRAPPER_ABI, ERC20_ABI
  providers/
    Providers.tsx         — Wagmi + ZamaProvider + TanStack Query setup
```

## Key Patterns

### Dynamic Registry Reads
`useRegistryPairs(chainId)` in `src/lib/registry.ts` wraps `useListPairs` from the Zama SDK. When wallet is connected and chain matches, reads live from on-chain WrappersRegistry. Falls back to `KNOWN_WRAPPERS` (hardcoded snapshot) when disconnected. Returns `isFromCache` flag so UI can show a banner.

### Permit Gating
All confidential balance reads use `enabled: decryptRequested && !!address && !!tokenAddress`. The `decryptRequested` state is:
- Set to `true` only when user clicks "Decrypt" button
- Reset synchronously in token selector's `onChange` (not in useEffect — prevents one-frame race)
- Reset in `useEffect([selectedToken])` as safety net

### Error Classification
`classifyError(err)` in `src/lib/errors.ts` uses `matchZamaError` to map every Zama SDK error code to a `{ title, message, retryable }` object. Fallback patterns catch common wallet rejections (MetaMask "user rejected", etc.).

### Mock Token Detection
`isMintablePair(pair)` checks `underlyingRawSymbol` for "Mock" suffix. Used by faucet to exclude restricted (non-mock) underlyings like the real `ctGBP` on Sepolia.

### Blocklist
`BLOCKLISTED_WRAPPERS` in `registry.ts` manually excludes suspicious entries from the UI (currently: `cbbqTGBP` on Mainnet — vanity address, unknown asset name). Documented with rationale.

## Sepolia Token Registry (as of 2026-06-22)

8 pairs in on-chain registry:
- 7 Mock pairs (public mint): cUSDCMock, cUSDTMock, cWETHMock, cBRONMock, cZAMAMock, ctGBPMock, cXAUtMock
- 1 Restricted pair (no public mint): ctGBP (`0x167D...A208`)

The app normalizes "Mock" suffix from symbols (e.g., `USDCMock` → `USDC`) and shows a "Mock" badge instead.

## Mainnet Token Registry (as of 2026-06-22)

8 pairs in on-chain registry:
- 7 known pairs: cUSDC, cUSDT, cWETH, cBRON, cZAMA, ctGBP, cXAUt
- 1 suspicious pair: cbbqTGBP (`0xBA4c...6762`) — blocklisted (see ZAMA_REGISTRY_REPORT.md)

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check (no output files)
```

## Environment Variables

See `.env.example`. None are required — app falls back to public RPC nodes.

## Active PR

PR #1: `feat/dynamic-registry-finding-1` → `main`
Contains all work from this session. Push to this branch and the PR updates automatically.

## Files That Must Not Be Modified Without Care

| File | Why |
|---|---|
| `src/lib/utils.ts` (`formatAmount`, `parseAmount`) | Decimal math is load-bearing. Past source of zero-balance bugs. Any change needs test verification. |
| `src/providers/Providers.tsx` | Wagmi + Zama SDK initialization. Breaking this breaks the entire app. |
| `src/app/wrap/page.tsx` (`decryptRequested` pattern) | Permit gating — removing or weakening this causes auto-fire wallet prompts. |
| `src/lib/registry.ts` (blocklist) | `BLOCKLISTED_WRAPPERS` has documented rationale. Don't remove entries without team confirmation. |

## Zama SDK Quick Reference

| Hook / Function | Package | Purpose |
|---|---|---|
| `useListPairs({ page, pageSize, metadata })` | `@zama-fhe/react-sdk` | List on-chain registry pairs |
| `useShield({ tokenAddress })` | `@zama-fhe/react-sdk` | Shield (wrap) ERC-20 → ERC-7984 |
| `useUnshield({ tokenAddress })` | `@zama-fhe/react-sdk` | Unshield (unwrap) ERC-7984 → ERC-20 |
| `useConfidentialBalance({ tokenAddress })` | `@zama-fhe/react-sdk` | Decrypt single encrypted balance |
| `useConfidentialBalances({ tokenAddresses })` | `@zama-fhe/react-sdk` | Batch decrypt multiple balances |
| `useResumeUnshield({ tokenAddress })` | `@zama-fhe/react-sdk` | Resume interrupted unshield |
| `useRevokeSession()` | `@zama-fhe/react-sdk` | Clear cached FHE permits |
| `useZamaSDK()` | `@zama-fhe/react-sdk` | Access SDK instance (storage, etc.) |
| `loadPendingUnshield(storage, tokenAddr)` | `@zama-fhe/react-sdk` | Check for pending unshield tx hash |
| `clearPendingUnshield(storage, tokenAddr)` | `@zama-fhe/react-sdk` | Clear pending unshield record |
| `matchZamaError(err, handlers)` | `@zama-fhe/sdk` | Pattern-match SDK error codes |

## Zama Docs MCP

Installed as user-scope MCP: `zama-protocol`
```
claude mcp add zama-protocol --scope user --transport http https://docs.zama.org/protocol/~gitbook/mcp
```
Tools: `mcp__37f0ef9c...__getPage(url)`, `mcp__37f0ef9c...__searchDocumentation(query)`

## Key Documentation URLs

- SDK overview: https://docs.zama.org/protocol/sdk/overview.md
- WrappersRegistry API: https://docs.zama.org/protocol/sdk/api-references/sdk/wrappersregistry.md
- Errors / matchZamaError: https://docs.zama.org/protocol/sdk/api-references/sdk/errors.md
- useResumeUnshield: https://docs.zama.org/protocol/sdk/api-references/react/useresumeunshield.md
- Sepolia addresses: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
- Mainnet addresses: https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum
- Network presets: https://docs.zama.org/protocol/sdk/api-references/sdk/network-presets.md
- Authentication / relayer keys: https://docs.zama.org/protocol/sdk/guides/authentication.md
