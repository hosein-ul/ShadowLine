# ZamaVault

> The canonical web interface for the Zama Confidential Wrappers Registry — discover every ERC-20 ↔ ERC-7984 pair, shield in seconds, decrypt on demand.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Wagmi](https://img.shields.io/badge/Wagmi-3-1c1b1f?logo=ethereum)](https://wagmi.sh/)
[![Zama SDK](https://img.shields.io/badge/Zama%20SDK-3-ffd208)](https://docs.zama.org/protocol)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What it is

ZamaVault is a Next.js dApp that turns the on-chain `WrappersRegistry` into a product. Every registered ERC-20 ↔ ERC-7984 confidential wrapper pair on **Sepolia** and **Ethereum mainnet** is discovered live; users can shield (wrap) public tokens into encrypted balances, transfer them privately, decrypt with a single EIP-712 signature, and unshield back to public ERC-20 — all from one consistent interface.

Built around the official `@zama-fhe/react-sdk` and `WrappersRegistry` contract, it serves both end-users (Portfolio, Wrap, Faucet, Learn) and developers (REST API, snippet generator, on-chain Analytics).

---

## Pages & routes

| Route                  | Purpose                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `/`                    | Marketing landing page with scroll-narrative onboarding                                |
| `/app`                 | Live wrapper registry table with per-row public + confidential balance reads           |
| `/app/wrap`            | Shield (wrap) and unshield (unwrap) swap interface for any registered pair             |
| `/app/portfolio`       | Confidential portfolio with batch EIP-712 decrypt, re-shield, and unshield             |
| `/app/analytics`       | TVS (Total Value Shielded) by token + 24h shield/unshield activity, since 00:00 UTC    |
| `/app/faucet`          | Sepolia mock token mint (USDC, USDT, WETH, BRON, ZAMA, tGBP, XAUt)                     |
| `/app/learn`           | 5-step interactive tutorial covering FHE → faucet → shield → decrypt → unshield        |
| `/app/developers`      | Copy-paste code snippets (React hook / viem / ethers)                                  |
| `/app/docs`            | In-app reference for the SDK calls ZamaVault uses                                      |
| `/api/registry`        | Public REST endpoint returning every wrapper pair on a given chain                     |

The landing (`/`) and the application (`/app/*`) are deliberately isolated — they use independent stylesheets, fonts, and providers (see [Architecture](#architecture)).

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx             ← root: <html>, fonts, theme bootstrap (no CSS)
│   ├── landing.css            ← Tailwind v4, scoped to landing only
│   ├── page.tsx               ← landing route (cream/gold design)
│   ├── error.tsx              ← global error boundary
│   ├── ClientLayout.tsx       ← providers + theme/network context (app only)
│   ├── globals.css            ← app design system (vanilla CSS, scoped to /app)
│   ├── app/
│   │   ├── layout.tsx         ← imports globals.css + ClientLayout
│   │   ├── page.tsx           ← /app — registry table
│   │   ├── wrap/page.tsx
│   │   ├── portfolio/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── faucet/page.tsx
│   │   ├── learn/page.tsx
│   │   ├── developers/page.tsx
│   │   └── docs/page.tsx
│   └── api/registry/route.ts  ← public REST endpoint
├── components/
│   ├── landing/               ← landing sections (hero, features, etc.)
│   ├── magic/                 ← Magic UI primitives (TextAnimate, MagicCard…)
│   ├── ui/                    ← in-app design system (Card, Button, Badge…)
│   ├── layout/                ← in-app Header, Footer
│   └── PendingUnshieldBanner.tsx
├── config/
│   ├── chains.ts              ← Sepolia + Mainnet definitions
│   ├── contracts.ts           ← WrappersRegistry addresses, KNOWN_WRAPPERS fallback
│   └── tokens.ts              ← logo + colour metadata keyed by symbol
├── lib/
│   ├── registry.ts            ← useRegistryPairs hook + blocklist + helpers
│   ├── errors.ts              ← classifyError() using matchZamaError
│   ├── utils.ts               ← formatAmount, parseAmount (decimal scaling)
│   └── wrapper-abi.ts         ← WRAPPER_ABI, ERC20_ABI
└── providers/
    └── Providers.tsx          ← Wagmi + ZamaProvider + TanStack Query
```

### Two design systems, hermetically separated

The landing (`/`) and the application (`/app/*`) need to look completely different — the landing is editorial gold-on-cream, the app is a dense data UI. They live in the same Next.js project but never share CSS:

- `src/app/layout.tsx` (the root) imports **no** CSS. It only sets `<html lang>`, the font variables (Fraunces + Plus Jakarta Sans), and the theme bootstrap script.
- `src/app/page.tsx` (landing) imports **`landing.css`** — Tailwind v4 with `@import 'tailwindcss'` and a `@theme` block of gold/cream/ink tokens.
- `src/app/app/layout.tsx` imports **`globals.css`** — the vanilla-CSS app design system with `--bg-base`, `--accent`, `--sp-*` tokens — and wraps everything in `ClientLayout` (providers + Header + Footer).

Because Next.js route-subtree layouts only apply CSS within their own subtree, Tailwind's preflight never leaks into `/app`, and the app's design tokens never leak into `/`.

---

## FHE & flows

### Permit-based decryption

Confidential balances are stored on-chain as `euint64` ciphertext handles. To display the plaintext to the user, ZamaVault uses Zama's `useConfidentialBalance` hook, gated behind an **explicit user click** — the EIP-712 permit signature must never auto-fire on render. The flow:

1. User clicks **Decrypt** next to any encrypted balance.
2. Wallet shows a typed-data signature request (EIP-712, not a transaction — zero gas).
3. The signature scopes an ephemeral session key to that wallet + contract.
4. SDK sends ciphertext + permit to the Zama Gateway/Coprocessor.
5. Coprocessor verifies the signature, decrypts, returns plaintext to the browser.
6. The plaintext is rendered client-side; private keys never leave the wallet and plaintext is never stored on-chain.

### Shield (wrap) — one or two transactions

`WrappedToken.shield(amount)` routes through one of two paths depending on the underlying ERC-20:

| Path                | Triggered when                                | Wallet prompts | Tokens (mainnet)     |
| ------------------- | --------------------------------------------- | -------------- | -------------------- |
| `transferAndCall`   | Underlying implements **ERC-1363**            | 1              | cTGBP, cZAMA         |
| `approve` + `wrap`  | Underlying does **not** implement ERC-1363    | 2              | cUSDC, cUSDT, cWETH, cBRON |

The SDK detects ERC-1363 support automatically via `supportsInterface` — callers don't choose a path. On the two-tx path, ZamaVault checks the existing ERC-20 allowance and passes `approvalStrategy: 'skip'` when it's already sufficient, so users aren't prompted for a fresh `approve(0)` + `approve(amount)` every time.

### Unshield (unwrap) — two phases

Unshielding is **not** a single transaction:

1. **Unwrap request** — user submits an on-chain transaction burning the encrypted wrapper amount.
2. **Gateway finalize** — the Zama Gateway generates a decryption proof (~15–40 s), then submits a finalize transaction that releases the underlying ERC-20.

If the user closes the browser between (1) and (2), ZamaVault's `PendingUnshieldBanner` detects the unfinalized request on next visit and offers a one-click Resume.

### Decimal scaling

All wrapper tokens use **6 decimals** regardless of the underlying token's precision. This is because FHE operates on `euint64` (a 64-bit unsigned integer), which would overflow at 18-decimal values. The wrapper contract scales amounts during shield and unshield. `formatAmount`/`parseAmount` in `src/lib/utils.ts` must be kept in sync with this constraint — see the inline comments.

---

## Tech stack

| Layer             | Library / version                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Framework         | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, static prerender)                                      |
| UI runtime        | [React 19](https://react.dev/)                                                                                   |
| Web3              | [Wagmi 3](https://wagmi.sh/) + [Viem 2](https://viem.sh/)                                                        |
| FHE               | [`@zama-fhe/react-sdk` 3](https://docs.zama.org/protocol/sdk/overview)                                           |
| Data fetching     | [TanStack Query 5](https://tanstack.com/query)                                                                   |
| Animation         | [motion (Framer Motion) 12](https://motion.dev/) for landing primitives                                          |
| 3D / canvas       | [three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/)                               |
| Landing styling   | [Tailwind v4](https://tailwindcss.com/) (scoped to `/`)                                                          |
| App styling       | Vanilla CSS custom properties (scoped to `/app/*`)                                                               |
| Icons             | [lucide-react](https://lucide.dev/) + [react-icons](https://react-icons.github.io/react-icons/)                  |
| Magic UI          | [magicui.design](https://magicui.design/) — TextAnimate, MagicCard, BorderBeam, NumberTicker, Marquee, BlurFade  |
| Confetti          | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)                                                 |
| Language          | TypeScript 5 (strict mode)                                                                                       |

---

## Quick start

### Prerequisites
- Node.js v18 or newer
- npm / pnpm / yarn

### Install

```bash
git clone https://github.com/hosein-ul/zamavault.git
cd zamavault
npm install
```

### Run

```bash
npm run dev          # Dev server on http://localhost:3000
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript check (no output files)
```

### Environment (all optional)

ZamaVault works with no configuration — it falls back to public RPC endpoints. To use your own, create `.env.local`:

```env
NEXT_PUBLIC_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## REST API

`GET /api/registry?chain=sepolia|mainnet`

Returns every registered wrapper pair on the given chain, with ERC-20 metadata enriched on the server. CORS-enabled, cached at the edge for 60 s.

### Example

```bash
curl https://your-deployment.vercel.app/api/registry?chain=sepolia
```

### Response

```json
{
  "pairs": [
    {
      "tokenAddress": "0x...",
      "confidentialTokenAddress": "0x...",
      "symbol": "USDC",
      "confidentialSymbol": "cUSDC",
      "name": "USD Coin",
      "decimals": 6,
      "wrapperDecimals": 6
    }
  ],
  "total": 8,
  "chain": "sepolia",
  "registryAddress": "0x...",
  "timestamp": 1735000000000,
  "source": "on-chain"
}
```

If the on-chain read fails (RPC issue), the endpoint falls back to a hardcoded snapshot and sets `source: "cached-snapshot"` with a `warning` field.

---

## Registry & blocklist

ZamaVault reads the on-chain `WrappersRegistry` via `useListPairs` whenever a wallet is connected to a supported chain. When disconnected (or the chain doesn't match), it falls back to `KNOWN_WRAPPERS` in `src/config/contracts.ts` — a hand-curated snapshot — so anonymous visitors can still browse.

Revoked pairs (`isValid === false`) are tagged with a red "Revoked" badge in the registry table and excluded from the wrap/unwrap selector.

A small `BLOCKLISTED_WRAPPERS` set in `src/lib/registry.ts` hides one suspicious mainnet entry (`cbbqTGBP` at `0xBA4c…6762`) — vanity-prefix wrapper for an unknown underlying token; documented in code with the rationale.

---

## Project conventions

- **No auto-fire signatures.** Every `useConfidentialBalance` is gated behind a `decryptRequested` boolean set only by an explicit user click. The state pattern in `src/app/app/wrap/page.tsx` is the reference — do not weaken it.
- **No secrets in the repo.** `.env*` files are gitignored. `.env.example` documents the optional vars.
- **Strict mode TS.** All new code must type-check with `npx tsc --noEmit`.
- **Two design systems, never mix.** If a CSS rule touches the landing, it belongs in `landing.css`; if it touches the app, in `globals.css`.

---

## Roadmap

- [ ] Polygon, Base, Arbitrum support (once Zama deploys WrappersRegistry there)
- [ ] Confidential transfer UI (send encrypted balance to another address)
- [ ] Multi-account permit caching in browser storage
- [ ] WalletConnect v2 + Safe support
- [ ] Subgraph-backed historical analytics

---

## License

MIT — see [LICENSE](LICENSE).
