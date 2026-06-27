# ZamaVault — Confidential Wrapper Registry App

> **Zama Developer Program Season 3 · Bounty Track**  
> Build the Confidential Wrapper Registry App

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Zama SDK](https://img.shields.io/badge/Zama%20SDK-3-ffd208)](https://docs.zama.org/protocol)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready dApp that turns the official [Zama Wrappers Registry](https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry) into a usable product for every developer and user in the ecosystem.

---

## Live URL

> **[https://zamavault.vercel.app](https://zamavault.vercel.app)**
> *(Update with final deployment URL before submission)*

---

## Supported Networks

| Network | Chain ID | Status |
|---|---|---|
| Ethereum Sepolia | 11155111 | ✅ Primary — all features |
| Ethereum Mainnet | 1 | ✅ Registry browsing |

All bounty features (shield, unshield, decrypt, faucet) are live on **Sepolia**.

---

## Features

All four bounty requirements are fully implemented:

| Bounty Requirement | Feature | Page |
|---|---|---|
| Browse the registry | Live ERC-20 ↔ ERC-7984 pair table sourced from on-chain WrappersRegistry | `/app` |
| Wrap and unwrap | ERC-20 → ERC-7984 (shield) and ERC-7984 → ERC-20 (unshield) with multi-step tx flow | `/app/wrap` |
| Decrypt ERC-7984 balances | EIP-712 permit flow for registry tokens AND arbitrary address paste | `/app/portfolio` |
| Faucet for cTokenMocks | Claim all official Sepolia cTokenMock test tokens | `/app/faucet` |

Additional pages:
- **Portfolio** — batch decrypt all registry positions + decrypt any arbitrary ERC-7984 address
- **Analytics** — Total Value Shielded, 24h shield/unshield volume, per-token stats
- **Learn** — step-by-step tutorial: connect → faucet → shield → decrypt → unshield
- **Developer Tools** — contract ABI explorer, SDK hook reference, integration guide
- **Docs** — ERC-7984 architecture, permit model, full SDK API

---

## How the Registry is Sourced

ZamaVault uses a **three-layer hybrid** strategy:

### Layer 1 — On-chain WrappersRegistry (primary, canonical)

When a wallet is connected on the matching chain, the app reads the official Zama WrappersRegistry live via `@zama-fhe/react-sdk`'s `useListPairs` hook. This is the canonical source of truth.

Registry contracts:
- Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`

All pairs (including revoked ones with `isValid: false`) are shown. Revoked pairs display a "Revoked" badge and have disabled wrap/unwrap actions.

### Layer 2 — Local snapshot fallback (`src/config/contracts.ts`)

When the wallet is disconnected or the on-chain fetch is loading, the app falls back to `KNOWN_WRAPPERS`, a hardcoded snapshot. A "Cached" banner alerts users that the list may be incomplete. This allows unconnected visitors to browse.

### Layer 3 — Local config (`src/config/custom-pairs.ts`)

Custom or dev-only pairs can be declared in `src/config/custom-pairs.ts` without touching the on-chain registry or any other file. These appear with a "Custom" badge so users can distinguish them from official pairs.

**De-duplication rule**: if a custom pair's ERC-20 address later appears in the on-chain registry, the registry version wins and the custom entry is silently dropped.

---

## How to Add a New ERC-20 ↔ ERC-7984 Pair

### Option A — Local Config (immediate, no on-chain action required)

Best for: dev-only pairs, staging tokens, or pairs awaiting official registration.

**Step 1.** Open `src/config/custom-pairs.ts`

**Step 2.** Add an entry to the `CUSTOM_PAIRS` array:

```ts
import type { CustomPair } from '@/config/contracts';

export const CUSTOM_PAIRS: CustomPair[] = [
  {
    erc20Address:    '0xYourERC20TokenAddress',    // underlying ERC-20
    erc7984Address:  '0xYourERC7984WrapperAddress', // confidential wrapper
    symbol:          'MYT',
    name:            'My Test Token',
    decimals:        18,    // underlying ERC-20 decimals
    wrapperDecimals: 6,     // almost always 6 for ERC-7984 wrappers
    source:          'custom',
    note:            'Dev token deployed 2025-06-27 — awaiting on-chain registration',
  },
];
```

**Step 3.** Run `npm run dev` — the pair appears immediately in:
- Registry table `/app` — with a "Custom" badge
- Wrap/Unwrap selector `/app/wrap` — in the token dropdown
- Portfolio `/app/portfolio` — as a decryptable position
- Faucet `/app/faucet` — if the ERC-20 has a public `mint()` function

**Step 4.** Commit `custom-pairs.ts` to persist the pair across deployments.

> ⚠️ ZamaVault cannot verify that `erc7984Address` is a legitimate ERC-7984 implementation. The wrapper must implement ERC-165 with interface ID `0x4958f2a4`. Only add addresses you deployed and control.

---

### Option B — Official On-chain Registration

Once a pair is registered in the official Zama WrappersRegistry, ZamaVault surfaces it automatically for all users — no code change needed.

**Prerequisites:**
- An ERC-7984 confidential wrapper that:
  - Implements ERC-165 and returns `true` for interface ID `0x4958f2a4`
  - Wraps a specific ERC-20 underlying token
- Authorization from the Zama Protocol DAO governance (registry owner)

**Registration call** (Solidity):
```solidity
// Sepolia registry: 0x2f0750Bbb0A246059d80e94c454586a7F27a128e
registry.registerConfidentialToken(
    address erc20TokenAddress,
    address confidentialWrapperAddress
);
```

Validation performed on-chain:
- Neither address can be zero
- Confidential token must implement ERC-165 with interface `0x4958f2a4`
- ERC-20 must not already have an associated wrapper
- Wrapper must not already be associated with another ERC-20

See [Zama Registry docs](https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry) for full details.

---

### Option C — Decrypt an Arbitrary ERC-7984 Address (no registration needed)

To decrypt the balance of any ERC-7984 token not in the registry:

1. Go to `/app/portfolio`
2. Scroll to **"Decrypt Any ERC-7984 Token"**
3. Paste the contract address — ZamaVault auto-fetches the token symbol from the contract
4. Click **Add Token**, then **Decrypt Balance**

This uses the same EIP-712 permit flow as registry tokens. Always verify the address on a block explorer before decrypting.

---

## Architecture

```
Browser (Next.js 16 / React 19)
  │
  ├── @zama-fhe/react-sdk       — useShield / useUnshield / useConfidentialBalance(s)
  │     └── FHEVM WASM          — FHE encryption (input) + local decryption (output)
  │
  ├── wagmi v2 + viem           — Wallet connection, on-chain reads/writes
  │
  ├── Zama WrappersRegistry     — Official on-chain pair source
  │     ├── Sepolia: 0x2f0750Bbb0A246059d80e94c454586a7F27a128e
  │     └── Mainnet: 0xeb5015fF021DB115aCe010f23F55C2591059bBA0
  │
  └── Zama KMS / Gateway        — Re-encrypts ciphertexts for EIP-712 user-decrypt
```

**Shield flow:**
1. User enters amount → WASM encrypts to `euint64` ciphertext
2. SDK auto-selects 1-tx (ERC-1363 `transferAndCall`) or 2-tx (`approve` + `shield`) path
3. Zama Coprocessor executes FHE arithmetic, publishes result on-chain
4. Balance stored as an on-chain `euint64` ciphertext handle

**Decrypt flow:**
1. User clicks "Decrypt Balance"
2. SDK generates EIP-712 typed-data permit — no tokens moved
3. KMS validates permit, re-encrypts from network FHE key to session transport key
4. WASM decrypts locally → plaintext shown only in browser, never transmitted

---

## Security Model

- **Value-privacy, not anonymity**: sender and recipient addresses are public on-chain. Only amounts and balances are encrypted.
- **TFHE on-chain**: balances are stored as `euint64` ciphertexts — arithmetic can be performed without decrypting.
- **EIP-712 permits are read-only**: the permit signature cannot transfer tokens or approve contracts. Default TTL: 30 days, cached in `localStorage`.
- **Non-custodial**: ZamaVault never holds funds. All operations go directly to on-chain contracts.
- **KMS guarantee**: the Zama KMS re-encrypts ciphertexts under your session transport key via a cryptographic protocol — it cannot learn your plaintext balance.

---

## Local Development

```bash
# Install
npm install

# Dev server
npm run dev        # → http://localhost:3000

# Type check
npx tsc --noEmit

# Production build
npm run build
```

No environment variables required for local development. The app uses public RPC endpoints for Sepolia/Mainnet configured in `src/config/chains.ts`.

---

## Repository Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (scrollytelling)
│   └── app/
│       ├── page.tsx          # Registry — browse all pairs
│       ├── wrap/             # Shield / Unshield
│       ├── portfolio/        # Decrypt (registry + arbitrary address)
│       ├── faucet/           # Claim cTokenMocks
│       ├── analytics/        # TVS + volume stats
│       ├── learn/            # Step-by-step tutorial
│       ├── developers/       # ABI explorer, SDK hooks
│       └── docs/             # Architecture docs
├── config/
│   ├── contracts.ts          # WrapperPair type + KNOWN_WRAPPERS snapshot
│   ├── custom-pairs.ts       # ← ADD NEW PAIRS HERE
│   ├── chains.ts             # Chain config
│   └── tokens.ts             # Display metadata
├── lib/
│   ├── registry.ts           # useRegistryPairs (hybrid merge logic)
│   ├── wrapper-abi.ts        # ERC-20 + ERC-7984 ABIs
│   ├── errors.ts             # Error classification
│   └── utils.ts              # Format helpers
└── components/               # Reusable UI
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Wallet | wagmi v2 + viem |
| FHE SDK | `@zama-fhe/react-sdk` v3 |
| UI | Custom design system (no Tailwind) |
| Styling | Vanilla CSS custom properties |

---

## Submission

- **Bounty submission form:** [forms.zama.org/developer-program-mainnet-season3-bounty-track](https://forms.zama.org/developer-program-mainnet-season3-bounty-track)
- **Deadline:** July 7, 2026 — 23:59 AOE

---

## License

MIT
