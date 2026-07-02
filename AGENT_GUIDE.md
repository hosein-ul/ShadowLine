# ShadowLine — Master Reference Document for AI Agents

> This file is a complete guide for any AI agent working on the ShadowLine project.
> It includes all architecture details, critical rules, common mistakes, and lessons learned.

---

## 1. Project Context

**ShadowLine** is a frontend interface for the Zama confidential token ecosystem:  
Dynamic Registry registration, ERC-20 wrap/unwrap, decryption of encrypted portfolios, and a Sepolia faucet.

- **Repository:** https://github.com/hosein-ul/ShadowLine
- **Branch:** `feat/dynamic-registry-finding-1` (PR #1 → main)
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, Wagmi 3, Viem 2, @zama-fhe/react-sdk 3.0.1, TypeScript 5
- **Goal:** Zama Developer Program Mainnet Season 3 Bounty Track (deadline: 2026-07-07 AOE)
- **Directory:** `C:\NEW work\`

---

## 2. Critical Rules — Never Be Broken

### 🚨 Rule 1: No Mentions of Claude/Anthropic
Never place the name Claude, Claude Code, Anthropic, or anything similar in code, commits, PRs, READMEs, or any files visible to the judges. Do not add any `Co-Authored-By` headers. This is a competition submission.

### 🚨 Rule 2: Never Auto-fire EIP-712 Permits
Every decryption/permit must be triggered by an explicit user click. The `decryptRequested` pattern in `wrap/page.tsx` is exactly for this:
- `decryptRequested` is `false` by default
- It only becomes `true` when the user explicitly clicks "Decrypt"
- **Common Bug Source:** Calling `refetch()` directly on `useConfidentialBalance` — TanStack Query's `refetch()` method bypasses the `enabled: false` setting!
- **Solution:** Call `setDecryptRequested(false)` after every successful shield/unshield operation
- Reset the state **synchronously** in the `onChange` handler, not in `useEffect` (prevents a one-frame race condition)

### 🚨 Rule 3: Decimal Scaling is Extremely Critical
```
wrapper decimals: always 6 (euint64 FHE limit)
underlying decimals: 6 or 18

Shield (wrap):   parseAmount(input, underlyingDecimals)   ← underlying decimals
Unshield:        parseAmount(input, 6)                    ← always 6
Display:         formatAmount(balance, 6)                 ← always 6

⚠️ Common Mistake: formatAmount(balance, 18) → displays zero for 18-decimal tokens
```

### 🚨 Rule 4: Never Commit Secrets
The `.env` files are in `.gitignore`. Use `.env.example` for documentation.

### 🚨 Rule 5: Do Not Remove Blocklisted Items Without Team Approval
`BLOCKLISTED_WRAPPERS` in `registry.ts` is documented. `cbbqTGBP` (Mainnet) has a suspicious vanity address.

---

## 3. Architecture and File Structure

```
C:\NEW work\
├── src/
│   ├── app/
│   │   ├── page.tsx                   ← Registry table (Main page)
│   │   ├── wrap/page.tsx              ← Shield/Unshield (Most critical page)
│   │   ├── portfolio/page.tsx         ← Confidential portfolio with batch decrypt
│   │   ├── faucet/page.tsx            ← Sepolia mock token faucet
│   │   ├── analytics/page.tsx         ← TVL and activity dashboard
│   │   ├── learn/page.tsx             ← 5-step interactive FHE tutorial
│   │   ├── developers/page.tsx        ← Code snippet generator
│   │   ├── docs/page.tsx              ← Developer documentation
│   │   ├── error.tsx                  ← Next.js error boundary
│   │   ├── api/registry/route.ts      ← Public REST API
│   │   ├── ClientLayout.tsx           ← Context providers (theme/network)
│   │   ├── layout.tsx                 ← Root layout with SSR theme injection
│   │   └── globals.css                ← Design system (4 Nordic themes)
│   ├── components/
│   │   ├── ui/                        ← 13 reusable UI components
│   │   │   ├── Badge.tsx              ← ⚠️ text-transform:uppercase removed (bug fix)
│   │   │   ├── Button.tsx             ← forwardRef, variants: primary/secondary/ghost/danger
│   │   │   ├── Card.tsx               ← variants: default/glass/outlined/accent
│   │   │   ├── CopyButton.tsx         ← Clipboard copy with checkmark feedback
│   │   │   ├── Skeleton.tsx           ← props: width, height, variant (not style!)
│   │   │   ├── Toast.tsx              ← ToastProvider + useToast() hook
│   │   │   ├── Modal.tsx
│   │   │   ├── Tooltip.tsx            ← Portal-based, HelpCircle as default trigger
│   │   │   ├── TokenIcon.tsx          ← Symbol-to-logo map, removes "c" prefix and "Mock" suffix
│   │   │   ├── BlurIn.tsx             ← Blur-in animation
│   │   │   ├── TypingAnimation.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── TransactionSuccessModal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx             ← 8 nav paths, wallet connect, network switcher
│   │   │   └── Footer.tsx
│   │   └── PendingUnshieldBanner.tsx  ← Recovery for interrupted unshields
│   ├── config/
│   │   ├── contracts.ts               ← WrapperPair, KNOWN_WRAPPERS (fallback), REGISTRY_ADDRESSES
│   │   ├── chains.ts                  ← SupportedChainId, explorer Blockscout
│   │   └── tokens.ts                  ← Token display metadata (logo, color)
│   ├── lib/
│   │   ├── registry.ts                ← useRegistryPairs, isMintablePair, blocklist
│   │   ├── errors.ts                  ← classifyError with 16 error codes
│   │   ├── utils.ts                   ← formatAmount, parseAmount, formatAddress, cn
│   │   ├── wrapper-abi.ts             ← WRAPPER_ABI, ERC20_ABI
│   │   └── __tests__/utils.test.ts    ← 30 Vitest tests
│   └── providers/
│       └── Providers.tsx              ← Wagmi + Zama + TanStack Query (⚠️ Extremely sensitive)
├── .github/workflows/ci.yml           ← TypeScript → Vitest → Build
├── .env.example                       ← All environment variables are optional
├── vitest.config.ts                   ← alias @/ → src/
├── CLAUDE.md                          ← Project documentation
└── memory.md                          ← Lessons learned / Memory
```

---

## 4. Zama SDK Cycle (Flow Perspective)

### Shield (Wrap)
```
useShield({ tokenAddress: erc7984Address })
→ mutateAsync({ amount, onApprovalSubmitted, onShieldSubmitted })
→ If allowance < amount: approve ERC-20 → onApprovalSubmitted(txHash) → setTxStep(2)
→ shield tx → onShieldSubmitted(txHash) → setTxStep(4)
→ res.txHash → setTxStep(5), setDecryptRequested(false)
```

### Unshield (Unwrap) — Two-Step Process
```
useUnshield(erc7984Address)  ← positional in v3.0.1
→ mutateAsync({ amount, onUnwrapSubmitted, onFinalizing, onFinalizeSubmitted })
→ unwrap tx on-chain → onUnwrapSubmitted(txHash) → setTxStep(4)
→ Gateway generates decryption proof → onFinalizing() → toast "15-40s"
→ finalize tx → onFinalizeSubmitted(txHash) → setTxStep(5)
```

### Decrypt Balance — PERMIT GATING
```
const [decryptRequested, setDecryptRequested] = useState(false)

useConfidentialBalance(
  { tokenAddress },
  { enabled: decryptRequested && !!address }
)

// ✅ Correct: Only on explicit click
<button onClick={() => setDecryptRequested(true)}>Decrypt</button>

// ❌ Incorrect: direct refetch() bypasses enabled setting!
refetchWrapperBalance()  ← Never call in success handlers

// ✅ After every successful tx:
setDecryptRequested(false)  ← Prevents refetchOnWindowFocus
```

### Batch Decrypt (Portfolio)
```
useConfidentialBalances(
  { tokenAddresses: requestedAddresses },
  { enabled: isConnected && requestedAddresses.length > 0 }
)
// A single EIP-712 permit decrypts all tokens
```

---

## 5. Key React Patterns

### Registry Detection Pattern
```typescript
// useRegistryPairs calculates
const isChainAligned = isConnected && chain?.id === chainId

if (isChainAligned && sdkResult.data?.items?.length > 0) → live data
else if (isChainAligned && sdkResult.isLoading) → loading + fallback
else → KNOWN_WRAPPERS fallback (isFromCache: true)
```

### Tooltip Replacement Pattern
```tsx
// ✅ Correct: Separate ? icon
<Badge>Confidential</Badge>
<Tooltip content="Short text" />   {/* Defaults to showing HelpCircle */}

// ❌ Incorrect: Badge as trigger
<Tooltip content="..."><Badge>Confidential</Badge></Tooltip>
```

### Skeleton Props Mistake
```tsx
// ✅ Correct
<Skeleton height={48} width={80} />

// ❌ Incorrect — Skeleton does not have a style prop!
<Skeleton style={{ height: 48, width: 80 }} />
```

### Badge — text-transform Removed
```css
/* ❌ Previously existed — bug cZAMA → CZAMA */
.badge { text-transform: uppercase; }

/* ✅ Now — text displays exactly as it is */
/* text-transform removed — cZAMA always remains cZAMA */
```

---

## 6. Lessons Learned (From Past Mistakes)

### 6.1 Auto-Permit Bug (Occurred multiple times)
**Root Cause:** TanStack Query's `refetch()` bypasses `enabled: false`.  
After a successful shield, we were calling `refetchWrapperBalance()` → permit fired without user interaction → wallet prompted 3 times.  
**Solution:** Never call `refetchWrapperBalance()` in success handlers. Only `refetchPublicBalance()` and `refetchAllowance()` are allowed.

### 6.2 Zero Display Bug for 18-Decimal Tokens
**Cause:** `formatAmount(balance, 18)` on 6-decimal FHE balance → value close to zero.  
**Solution:** Always use `formatAmount(balance, 6)` for FHE confidential balances.

### 6.3 Race Condition Bug for Token Select
**Cause:** `setDecryptRequested(false)` only in `useEffect` → one-frame delay → old `true` request triggered with new token address.  
**Solution:** Perform the reset **synchronously** in the `onChange` handler.

### 6.4 How Tooltips Should Be Handled
**Cause:** Tooltip wrapped the entire button → click on Tooltip did not work.  
**Solution:** Always place `<Tooltip />` without children (defaults to a ? icon) **after** the button/badge.

### 6.5 TVL Ranking Bug
**Cause:** Sorting on raw bigint — ZAMA with 18 decimals had a larger raw value than USDC with 6 decimals.  
**Solution:** Calculate `tvlHuman` (normalized float) and use it for sorting and progress bar widths.

### 6.6 CZAMA Instead of cZAMA
**Cause:** `.badge { text-transform: uppercase }` in CSS.  
**Solution:** Removed `text-transform` from `.badge`. Naming convention: Always lowercase `c` — `cZAMA`, `cUSDC`, `cWETH`.

### 6.7 Hardcoded API Domain
**Cause:** `shadowline.xyz` was written directly in code.  
**Solution:** Use `process.env.NEXT_PUBLIC_APP_URL`. In Vercel: Settings → Environment Variables.

### 6.8 useCallback in PendingUnshieldBanner
**Cause:** `useCallback` with `sdk?.storage` dependency had a react-hooks lint issue.  
**Solution:** Use plain async functions instead of `useCallback`.

### 6.9 Unshield Step Indicator
**Cause:** UI always showed the Approve step even when allowance was sufficient.  
**Solution:** `setTxStep(needsApproval ? 1 : 3)` — The Approve step is only shown if `needsApproval === true`.

### 6.10 CSS Scroll Without `margin: auto`
**Cause:** `maxWidth: 640` without `margin: '... auto 0'` → text aligned to the left.  
**Solution:** Always use `margin: 'var(--sp-3) auto 0'` for centered containers with a max-width.

---

## 7. Conventions and Standards

### Token Naming
```
Public ERC-20:         ZAMA, USDC, USDT, WETH, BRON, tGBP, XAUt
Confidential ERC-7984: cZAMA, cUSDC, cUSDT, cWETH, cBRON, ctGBP, cXAUt
                       ↑ Always lowercase c
Mock tokens:           Display: "ZAMA" + "Mock" badge (not "ZAMAMock")
```

### Tooltip
- Short text: 1-2 lines maximum
- Never wrap a badge/button as a tooltip trigger
- Always use standalone `<Tooltip content="..." />` (renders as a ? icon)

### Explorer
- **Blockscout** (not Etherscan) — because it supports FHE/Zama protocol decoding
- Sepolia: `https://eth-sepolia.blockscout.com`
- Mainnet: `https://eth.blockscout.com`

### Commit Messages
- No mentions of AI or Claude
- Format: `fix(scope): description`, `feat: description`

### CSS Variables
```css
--text-xs, --text-sm, --text-base, --text-lg, --text-xl, --text-2xl, --text-3xl
--sp-1 (4px), --sp-2 (8px), --sp-3 (12px), --sp-4 (16px), --sp-6 (24px), --sp-8 (32px)
--accent, --success, --warning, --error, --info
--bg-base, --bg-surface, --bg-elevated, --bg-card
--border, --border-hover, --border-accent
--radius-sm, --radius-md, --radius-lg, --radius-xl
```

---

## 8. Zama SDK — Quick Reference

### Version and API
- **Version:** `@zama-fhe/react-sdk@3.0.1` — still uses the v2 TypeScript API
- The migration guide is for 3.1.x — as long as we use `@^3.0`, migration is not required
- `WagmiSigner`, `RelayerWeb`, and `indexedDBStorage` are still exported in v3.0.1

### Important Hooks
| Hook | Package | Invocation Format |
|------|---------|-------------|
| `useListPairs({ page, pageSize, metadata })` | react-sdk | config object |
| `useShield({ tokenAddress })` | react-sdk | config object |
| `useUnshield(tokenAddress)` | react-sdk | positional in v3! |
| `useConfidentialBalance({ tokenAddress }, { enabled })` | react-sdk | 2 arg |
| `useConfidentialBalances({ tokenAddresses }, { enabled })` | react-sdk | 2 arg |
| `useResumeUnshield({ tokenAddress })` | react-sdk | config object |
| `useRevokeSession()` | react-sdk | no args |
| `useZamaSDK()` | react-sdk | SDK instance |
| `loadPendingUnshield(storage, addr)` | react-sdk | function |
| `clearPendingUnshield(storage, addr)` | react-sdk | function |
| `matchZamaError(err, handlers)` | @zama-fhe/sdk | function |

### Error Codes
`SIGNING_REJECTED`, `SIGNING_FAILED`, `ENCRYPTION_FAILED`, `DECRYPTION_FAILED`, `TRANSACTION_REVERTED`, `INVALID_KEYPAIR`, `KEYPAIR_EXPIRED`, `NO_CIPHERTEXT`, `RELAYER_REQUEST_FAILED`, `CONFIGURATION`, `INSUFFICIENT_CONFIDENTIAL_BALANCE`, `INSUFFICIENT_ERC20_BALANCE`, `BALANCE_CHECK_UNAVAILABLE`, `ERC20_READ_FAILED`, `ACL_PAUSED`, `APPROVAL_FAILED`

---

## 9. Contract Addresses

### WrappersRegistry
- Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`

### Sepolia — 8 Pairs (7 mock + 1 restricted)
| Symbol | ERC-20 | ERC-7984 | Decimals |
|--------|--------|----------|---------|
| USDC | 0x9b5C...FfFF | 0x7c5B...3639 | 6/6 |
| USDT | 0xa7dA...b0 | 0x4E7B...491 | 6/6 |
| WETH | 0xff54...F3F | 0x4620...158 | 18/6 |
| ZAMA | 0x7535...F57 | 0xf2D6...bFB | 18/6 |
| BRON | 0xFf02...E | 0xaa56...891 | 18/6 |
| tGBP | 0x93c9...442 | 0xfCE5...7CC | 18/6 |
| XAUt | 0x2437...940 | 0xe4Fc...0C7 | 6/6 |
| ctGBP (restricted) | 0x167D...A208 | — | 18/6 |

### Mainnet — 7 Pairs + 1 Blocklisted
| Symbol | ERC-20 | ERC-7984 | Decimals |
|--------|--------|----------|---------|
| USDC | 0xa0b8...48 | 0xe978...2B2 | 6/6 |
| USDT | 0xdAC1...c7 | 0xAe02...c50 | 6/6 |
| WETH | 0xc02a...c2 | 0xda93...893 | 18/6 |
| ZAMA | 0xA12C...A3 | 0x80CB...071 | 18/6 |
| BRON | 0xBA2C...83 | 0x85dE...bc | 18/6 |
| tGBP | 0x27f6...87 | 0xa873...DD9 | 18/6 |
| XAUt | 0x6874...38 | 0x73cc...Ef1 | 6/6 |
| cbbqTGBP | **BLOCKLISTED** | Suspicious vanity address | — |

---

## 10. Pages and Routing

| Path | File | Description |
|------|------|-------|
| `/` | `app/page.tsx` | Registry table with live balances |
| `/wrap` | `app/wrap/page.tsx` | Shield/Unshield with query `?token=SYMBOL&action=wrap` |
| `/portfolio` | `app/portfolio/page.tsx` | batch decrypt, activity feed |
| `/faucet` | `app/faucet/page.tsx` | Sepolia only, mock tokens only |
| `/analytics` | `app/analytics/page.tsx` | TVL, ratio, activity (24h) |
| `/learn` | `app/learn/page.tsx` | 5 interactive steps |
| `/developers` | `app/developers/page.tsx` | snippet generator |
| `/docs` | `app/docs/page.tsx` | Complete documentation |
| `/api/registry` | `app/api/registry/route.ts` | `?chain=sepolia\|mainnet` |

**Nav items in Header (in order):**  
Registry → Wrap → Portfolio → Faucet (TESTNET) → Learn → Dev Tools → Analytics → Docs

---

## 11. Environment Variables

All are optional — the app has public fallbacks:

```env
NEXT_PUBLIC_SEPOLIA_RPC=        # Alchemy or other RPC (default: publicnode)
NEXT_PUBLIC_MAINNET_RPC=        # Alchemy or other RPC (default: publicnode)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # If missing, only injected wallets
NEXT_PUBLIC_APP_URL=            # Deployment URL for docs/API (example: https://shadowline.vercel.app)
```

**Setting in Vercel:** Settings → Environment Variables → Add → Redeploy

---

## 12. CI/CD and Commands

```bash
# Development
npm run dev          # Dev server on localhost:3000

# Quality Assurance
npm test             # Vitest — 30 tests
npx tsc --noEmit     # TypeScript type-check (must be clean)
npm run lint         # ESLint (advisory — some pre-existing errors exist)

# Production
npx next build       # Must succeed
```

**GitHub Actions:** Push to `main` or `feat/**` → TypeScript → Vitest → Next build  
ESLint is advisory (non-blocking) — some pre-existing errors are tracked in AUDIT_REPORT.md.

---

## 13. Error Handling Patterns

### In Every Catch Block
```typescript
} catch (err: unknown) {  // ← not err: any
  const classified = classifyError(err);
  addToast({
    variant: classified.retryable ? 'warning' : 'error',
    title: classified.title,
    message: classified.message,
  });
}
```

### In REST API
```typescript
} catch (err) {
  // fallback to KNOWN_WRAPPERS
  return NextResponse.json({ pairs: fallback, source: 'cached-snapshot', warning: '...' })
}
```

---

## 14. Themes and Design

**4 dark Nordic themes:**
- Charcoal (default): accent `#38bdf8` (sky blue)
- Midnight: accent `#f4f4f5` (white)
- Frost: accent `#60a5fa` (ice blue)
- Aurora: accent `#2dd4bf` (teal)

**Light mode:** accent `#09090b` (black/inverse)

**Fonts:**
- Sans: Plus Jakarta Sans
- Mono: JetBrains Mono

---

## 15. Remaining Tasks

### Required User Action
- D1: Deploy to Vercel + configure `NEXT_PUBLIC_APP_URL`
- D2: Mainnet Relayer API key (optional, for enhanced UX)

### Future Tasks
- Phase 2.2: npm package `@shadowline/sdk`
- Phase 5.1: Complete README rewrite
- Phase 4.4: Mobile responsive testing at 360px

---

## 16. Important Zama Documentation URLs

- SDK overview: https://docs.zama.org/protocol/sdk/overview
- useShield: https://docs.zama.org/protocol/sdk/api-references/react/useshield
- useUnshield: https://docs.zama.org/protocol/sdk/api-references/react/useunshield
- useConfidentialBalance: https://docs.zama.org/protocol/sdk/api-references/react/useconfidentialbalance
- useResumeUnshield: https://docs.zama.org/protocol/sdk/api-references/react/useresumeunshield
- matchZamaError/errors: https://docs.zama.org/protocol/sdk/api-references/sdk/errors
- WrappersRegistry: https://docs.zama.org/protocol/sdk/api-references/sdk/wrappersregistry
- Sepolia addresses: https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia
- Mainnet addresses: https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum
- Migration v2→v3: https://docs.zama.org/protocol/sdk/migration/migrate-v2-to-v3
- Relayer API keys: https://docs.zama.org/protocol/sdk/guides/authentication

---

*Last updated: 2026-06-24 | branch: feat/dynamic-registry-finding-1*
