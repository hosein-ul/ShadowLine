# ZamaVault — Bounty Submission Audit Report

**Audit date:** 2026-06-21
**Submission deadline:** 2026-07-07 AOE
**Target:** Zama Developer Program Mainnet Season 3 — Bounty Track
**Repository:** https://github.com/hosein-ul/zamavault
**Audited commit:** local `main` HEAD as of 2026-06-21

---

## 1. Executive summary

ZamaVault is a visually polished Next.js front-end for the Zama confidential wrapper flows (shield/unshield/decrypt) plus a Sepolia mint faucet. However, **the application does not actually read the on-chain Wrappers Registry**: every page renders pairs from a hardcoded list in [contracts.ts](src/config/contracts.ts), and the registry ABI in [registry-abi.ts](src/lib/registry-abi.ts) is dead code. This is the single biggest gap versus the bounty brief, which explicitly asks the app to "surface every registered ERC-20 ↔ ERC-7984 wrapper pair from Zama's on-chain Wrappers Registry." It also directly undermines two of the six judging criteria — *coverage* and *extensibility* — because any new wrapper added to the registry tomorrow will never appear without a redeploy.

Other meaningful gaps: no `useResumeUnshield` (a user who closes their tab between `unwrap` and `finalizeUnwrap` has no recovery path), no `matchZamaError` classification (every failure surfaces as a raw `err.message`), no relayer-API-key plumbing for Mainnet (Mainnet decrypt/shield/unshield will silently fail — *deferred, user-handled*), no live deployed URL (*deferred, user-handled*), no tests, no CI, no `.env.example`, no error boundaries, no pagination, no detection of revoked (`isValid == false`) registry entries, and no separation between reusable SDK-layer logic and the Next.js app (the bounty's stated category goal is "templates and resources for the developer ecosystem" — a flat single-app structure does not deliver that).

What is solid: the decimals scaling fix described in [memory.md](memory.md) is correctly applied across the wrap, portfolio, and faucet flows; batched `useConfidentialBalances` on the Portfolio page is the right pattern; the wrap page is correctly gated behind an explicit "Decrypt to view" click rather than auto-prompting a permit on token select; RPC fallback transports are configured; and the visual design is genuinely strong.

The path to a competitive submission is clear: replace the hardcoded list with a registry-backed hook (top priority); add `useResumeUnshield`, `matchZamaError`, an error boundary, and CI; and (time permitting) extract the registry/wrap/unwrap logic into a reusable `packages/` module. Mainnet relayer key and Vercel deploy are out of scope for this implementation pass — the user will handle them separately before submission.

---

## 2. Findings table

| # | Criterion | Finding | Severity | File(s) | Recommended fix |
|---|-----------|---------|----------|---------|-----------------|
| 1 | Coverage / Extensibility | Registry is never read on-chain; all pairs come from hardcoded `KNOWN_WRAPPERS`. `REGISTRY_ABI` and `REGISTRY_ADDRESSES` are dead code. | **Critical** | [src/config/contracts.ts](src/config/contracts.ts), [src/lib/registry-abi.ts](src/lib/registry-abi.ts), [src/app/page.tsx:26](src/app/page.tsx:26), [src/app/wrap/page.tsx:58](src/app/wrap/page.tsx:58), [src/app/portfolio/page.tsx:155](src/app/portfolio/page.tsx:155), [src/app/faucet/page.tsx:59](src/app/faucet/page.tsx:59) | Replace `KNOWN_WRAPPERS[chainId]` lookups with the SDK's `useListPairs` / `useTokenPairsRegistry` hook (or a `useReadContract` against `listPairs` + `getTokenConfidentialTokenPairsLength` + slice). Keep hardcoded metadata only as a *display-only* enrichment layer (logos, friendly names) keyed by address. |
| 2 | Correctness / UX | No `useResumeUnshield` implementation. A user closing their tab between the on-chain `unwrap` request and the `finalizeUnwrap` step has no recovery path; their wrapped balance is stuck pending. | **High** | [src/app/wrap/page.tsx:178-203](src/app/wrap/page.tsx:178) (only) | Add a "Pending unshield" banner on Portfolio and Wrap pages that calls `useResumeUnshield` to detect outstanding requests on mount, with a "Resume" action that completes finalization. |
| 3 | Correctness | All SDK errors are reduced to `err.message` strings; no `matchZamaError` classification. Signature-rejected, tx-reverted, allowance-too-low, relayer-down, ratelimit, and bad-chain all surface identically to the user. | **High** | [src/app/wrap/page.tsx:204-213](src/app/wrap/page.tsx:204), [src/app/faucet/page.tsx:129-137](src/app/faucet/page.tsx:129), [src/app/portfolio/page.tsx:219-232](src/app/portfolio/page.tsx:219) | Wrap every SDK call site in `matchZamaError(err, { signatureRejected: ..., relayerUnavailable: ..., decryptionFailed: ..., ... })` and produce a distinct toast title + recovery hint per case. |
| 4 | Production-readiness | No Relayer API key is plumbed into `RelayerWeb` for Mainnet. Mainnet shield / unshield / decrypt will fail with an unhelpful relayer-auth error and no fallback. ***Deferred — user-handled (key obtained later).*** | **High** | [src/providers/Providers.tsx:43-55](src/providers/Providers.tsx:43) | (a) Add `NEXT_PUBLIC_RELAYER_API_KEY` support **only** for build-time configuration and document the backend-proxy pattern per [Zama auth guide](https://docs.zama.org/protocol/sdk/guides/authentication.md); (b) when no key is configured, detect Mainnet selection and degrade to read-only mode with an explanatory banner ("Mainnet write operations require a Zama Relayer API key — browsing pairs only"). Do **not** ship a real key in `NEXT_PUBLIC_*`. |
| 5 | Production-readiness | No live deployed URL in [README.md](README.md), [package.json](package.json), or anywhere else. No `vercel.json`. Judges must `git clone && npm install` to evaluate. ***Deferred — user will deploy separately.*** | **High** | [README.md](README.md), [package.json](package.json) | Deploy to Vercel before submission; add the URL to the README headline and to a `homepage` field in `package.json`. |
| 6 | Coverage | Revoked registry entries (`isValid == false` but non-zero wrapper) are not detected anywhere. They would render as normal usable pairs and a user clicking "Shield" would hit a revert. | **Medium** | [src/config/contracts.ts](src/config/contracts.ts), [src/app/page.tsx](src/app/page.tsx) | When migrating to dynamic registry reads, expose `isValid` from the pair tuple, hide invalid pairs by default with a "Show revoked" toggle, and visually mark them with a "Revoked" badge. |
| 7 | Extensibility | Mainnet wrapper addresses are hardcoded with a stale comment ("Update as needed or read dynamically"). No mechanism to refresh. They may already drift from the [official mainnet addresses page](https://docs.zama.org/protocol/protocol-apps/addresses/mainnet.md). | **Medium** | [src/config/contracts.ts:86-143](src/config/contracts.ts:86) | Same fix as #1 — dynamic registry reads make this self-healing. As an interim mitigation, add a CI check (or a one-off script) that diffs the hardcoded list against the on-chain registry. |
| 8 | Coverage / UX | No pagination. Renders all pairs in one unpaginated table. A registry of 50+ pairs will produce a wall of rows; mobile becomes unusable. | **Medium** | [src/app/page.tsx:119-233](src/app/page.tsx:119) | Add page-size + `useMemo`-based slice, or virtualize with `@tanstack/react-virtual`. |
| 9 | Correctness / Extensibility | `REGISTRY_ABI` in [src/lib/registry-abi.ts](src/lib/registry-abi.ts) declares `getAllWrappers` / `getWrapperCount` / `getWrapper` / `getUnderlying` / `isRegistered` — these names **do not match** Zama's documented registry surface (`listPairs`, `getTokenConfidentialTokenPairsLength`, `isValid`, etc.). The ABI is wrong *and* unused. | **Medium** | [src/lib/registry-abi.ts](src/lib/registry-abi.ts) | Delete this file and use the SDK hooks (`useListPairs` / `useTokenPairsRegistry`) instead. If raw ABI is still needed (e.g. CLI/indexer), regenerate it from the official `WrappersRegistry` ABI. |
| 10 | UX | Mainnet vs Sepolia selector is duplicated in the header and on the home page (two independent `network-switcher` widgets). Visual inconsistency, and the in-page one bypasses wallet chain switching. | **Medium** | [src/components/layout/Header.tsx:173-186](src/components/layout/Header.tsx:173), [src/app/page.tsx:102-116](src/app/page.tsx:102) | Keep one network switcher (the header's, which correctly calls `switchChain` when connected). Remove or pure-display the in-page one. |
| 11 | UX | Portfolio uses batched `useConfidentialBalances` (good), but Wrap page uses single `useConfidentialBalance` per token selection. Selecting four tokens in succession on Wrap can prompt four separate permits. | **Medium** | [src/app/wrap/page.tsx:80-88](src/app/wrap/page.tsx:80) | Hoist permit issuance to a shared cache (already via `indexedDBStorage`); ensure the SDK reuses the session permit across token selections without re-prompting. Verify against `useRevokeSession` reset flow. |
| 12 | UX | "Awaiting Permit..." string is shown for both *signing in progress* and *fetch in progress*. A user who never clicked "Decrypt to view" sees nothing — but a user who clicked and then rejected sees the same "Awaiting Permit..." stuck indefinitely with no recovery button. | **Medium** | [src/app/wrap/page.tsx:261-263](src/app/wrap/page.tsx:261) | Surface the `decryptWrapperError` (already destructured at line 84 but never rendered) with a retry button. |
| 13 | UX / Accessibility | Only one `aria-*` attribute in the entire codebase ([TokenIcon.tsx](src/components/ui/TokenIcon.tsx)). Icon-only buttons (close, copy, theme toggle, swap-arrow) lack labels. Modal lacks `role="dialog"` + `aria-modal`. Color contrast in some themes (Frost) likely fails WCAG AA on `text-muted` over glassmorphism. | **Medium** | [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx), [src/components/ui/CopyButton.tsx](src/components/ui/CopyButton.tsx), [src/components/layout/Header.tsx](src/components/layout/Header.tsx) | Add `aria-label` to all icon-only buttons; add `role="dialog" aria-modal="true" aria-labelledby` to Modal; run an axe-core or Lighthouse pass and fix critical issues. |
| 14 | UX | No stale-while-revalidate / persisted cache for registry & balances. A slow RPC produces a blank screen. The QueryClient's `staleTime: 30_000` does not survive a refresh because there is no persistence layer. | **Medium** | [src/providers/Providers.tsx:58-65](src/providers/Providers.tsx:58) | Add `@tanstack/react-query-persist-client` with `localStorage` persistence for the registry-listing query. |
| 15 | Correctness | The faucet's `COOLDOWN_SECONDS = 5` is a UI-only timer that resets on refresh. The comment in [README.md:15](README.md) calls it a feature but it is not enforced on-chain. | **Low** | [src/app/faucet/page.tsx:42](src/app/faucet/page.tsx:42), [README.md:15](README.md) | Either remove the cooldown (and the README claim) or persist `nextEligibleAt` in `localStorage` so the timer survives a refresh. Be explicit in copy that it is a client-side limiter. |
| 16 | Code quality | TS strict mode is **enabled** ([tsconfig.json:7](tsconfig.json:7)) but three critical paths still use `err: any`. | **Low** | [src/app/faucet/page.tsx:129](src/app/faucet/page.tsx:129), [src/app/wrap/page.tsx:204](src/app/wrap/page.tsx:204), [src/app/portfolio/page.tsx:269](src/app/portfolio/page.tsx:269) | Type as `unknown` and narrow with `matchZamaError` (fix #3). |
| 17 | Code quality | No test suite, no `.github/workflows`, no CI. | **Medium** | (none) | Add a GitHub Actions workflow that runs `eslint`, `tsc --noEmit`, and `next build` on PR. Add at minimum a Vitest test for [utils.ts](src/lib/utils.ts) `formatAmount` / `parseAmount` (the decimals math is load-bearing per [memory.md](memory.md) and is exactly the kind of regression a test catches). |
| 18 | Code quality / Extensibility | Single flat Next.js app. No separation between reusable logic and the UI. The bounty track's category goal is "templates and resources for the developer ecosystem"; a flat repo signals the opposite. | **High** *(differentiation)* | (whole repo) | Convert to a thin monorepo: `packages/registry-sdk` (pure-TS module exporting `listPairs(client, chainId)`, `shield`, `unshield`, `decryptBalance` — viem-based, no React) and `apps/web` (Next.js app, depends on the package). The package then doubles as a publishable artifact and a CLI substrate. |
| 19 | Production-readiness | No `.env.example`. The README documents `NEXT_PUBLIC_SEPOLIA_RPC` / `NEXT_PUBLIC_MAINNET_RPC` / `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` but a new developer must read source to discover the third one. | **Low** | [README.md:74-79](README.md:74), [src/providers/Providers.tsx:12](src/providers/Providers.tsx:12) | Add `.env.example` at repo root with all three keys (empty values) and document each. |
| 20 | Production-readiness | No error boundary. An unexpected error in any page component will white-screen the whole app. | **Medium** | [src/app/layout.tsx](src/app/layout.tsx), [src/app/ClientLayout.tsx](src/app/ClientLayout.tsx) | Add a top-level `error.tsx` (Next.js App Router error boundary) with a "Reload" action and the underlying error message in a `<details>`. |
| 21 | Code quality | `import { sepolia } from 'wagmi/chains'` in [wrap/page.tsx:21](src/app/wrap/page.tsx:21) is unused. Several `style={{...}}` blocks duplicate values that already exist in `globals.css`. | **Low** | [src/app/wrap/page.tsx:21](src/app/wrap/page.tsx:21) | Remove unused imports; run `eslint --fix`. |
| 22 | Coverage | The README claims "discover all verified ERC-20 ↔ ERC-7984 wrapper pairs on Ethereum and Sepolia" — currently false (no discovery, no verification). | **High** | [README.md:14](README.md:14), [src/app/page.tsx:54-56](src/app/page.tsx:54) | Either fix the registry coverage (preferred) or correct the copy until it is fixed. Misrepresenting capability to judges is worse than under-promising. |
| 23 | Differentiation | No activity / history view, no operator approvals UI, no extracted package, no indexer, no Hoodi support, no CLI. Competing teams are almost certain to ship at least one of these. | **Medium** *(differentiation)* | (none) | See section 4 (Opportunities) for ranking. |

---

## 3. Detailed findings by criterion

### 3.1 Coverage

**3.1.1 Registry is not read on-chain (Finding #1, Critical).**
`KNOWN_WRAPPERS` is the *sole* source of pair data for every page:
- Registry table at [src/app/page.tsx:26](src/app/page.tsx:26): `const wrappers = KNOWN_WRAPPERS[activeChainId] ?? [];`
- Wrap page at [src/app/wrap/page.tsx:58](src/app/wrap/page.tsx:58): same.
- Portfolio at [src/app/portfolio/page.tsx:155](src/app/portfolio/page.tsx:155): same.
- Faucet at [src/app/faucet/page.tsx:59](src/app/faucet/page.tsx:59): same (hardcoded to Sepolia only).

A grep across `src/` for `REGISTRY_ABI`, `REGISTRY_ADDRESSES`, `listPairs`, `useListPairs`, `useTokenPairsRegistry`, `useWrapperDiscovery`, `getAllWrappers`, `getWrapperCount` returns **zero call sites**. The ABI file and the registry address constant exist purely as decoration. This is the single most impactful change the project needs: the bounty's coverage criterion is defined by registry-completeness, and the registry is not being consulted.

**Recommended fix.** Replace the hardcoded source with one of:
- `useListPairs({ chainId })` from `@zama-fhe/react-sdk` (preferred — handles pagination and caching),
- or `useReadContract` against the real registry ABI (`getTokenConfidentialTokenPairsLength` + a sliced `listPairs(start, count)` call).

Keep `TOKEN_INFO` in [src/config/tokens.ts](src/config/tokens.ts) as a display-only enrichment layer keyed by symbol or underlying address.

**3.1.2 No revoked-pair detection (Finding #6, Medium).** When a pair has `isValid == false` but the wrapper address is still non-zero, the UI will treat it as a healthy pair and Shield will revert. Surface `isValid` and visually mark revoked entries.

**3.1.3 No pagination (Finding #8, Medium).** The table renders all rows. Acceptable today (7 pairs), structurally broken at 50+.

**3.1.4 Wrong ABI surface (Finding #9, Medium).** [registry-abi.ts](src/lib/registry-abi.ts) declares `getAllWrappers`, `getWrapperCount`, `getWrapper`, `getUnderlying`, `isRegistered` — none of which match the documented `WrappersRegistry` surface (`listPairs`, `getTokenConfidentialTokenPairsLength`, `isValid`, `getPairFromConfidentialToken`, etc.). Either the file is from a prototype or hallucinated. Delete it.

### 3.2 Correctness

**3.2.1 No `useResumeUnshield` (Finding #2, High).** The unshield flow involves two on-chain interactions plus an off-chain decryption hop. A user who closes the tab after `unwrap` but before `finalizeUnwrap` has no UI affordance to recover. Implementing `useResumeUnshield` on Portfolio (and showing a "1 pending unshield" banner) is a small change with disproportionate UX impact and a direct match to the docs' "Activity Feeds" and "useResumeUnshield" references.

**3.2.2 No `matchZamaError` (Finding #3, High).** All three SDK call sites collapse every failure into a single toast:
- [wrap/page.tsx:204-213](src/app/wrap/page.tsx:204): `err.message || 'The transaction was rejected or failed.'`
- [faucet/page.tsx:129-137](src/app/faucet/page.tsx:129): `err.message || 'The faucet mint transaction was rejected.'`
- [portfolio/page.tsx:222-228](src/app/portfolio/page.tsx:222): `err.message || 'The permit signature request was rejected or failed.'`

Note: with the dynamic registry migration (Finding #1) eliminating one of the three faucet call sites is not in scope — the faucet keeps its own write path against the underlying mock ERC-20, which can still revert (insufficient ETH for gas, paused contract, etc.); `matchZamaError` is still the right wrapper there even though it is not a relayer call.

Concrete scenarios that produce *no distinct* feedback today:
- User rejects MetaMask signature → identical to "tx reverted".
- Relayer rate-limited → identical to "network error".
- Wrapper not registered for the connected chain → identical to "tx reverted".
- Encrypted balance is zero / address never held the token → no error, just a `0n` value indistinguishable from "decrypt succeeded with zero".

Wrap each call site in `matchZamaError(err, { signatureRejected, relayerUnavailable, decryptionFailed, allowanceTooLow, ... })`.

**3.2.4 Decimals scaling.** The fix described in [memory.md](memory.md) is applied correctly in the code I read:
- Wrap input parses with `underlyingDecimals` ([wrap/page.tsx:121](src/app/wrap/page.tsx:121)).
- Unwrap input parses with `wrapperDecimals` (same line).
- Portfolio formats with `wrapper.wrapperDecimals` ([portfolio/page.tsx:85](src/app/portfolio/page.tsx:85)).
- Public-vs-confidential balances in the wrap panel use the right decimals on each side ([wrap/page.tsx:253-260](src/app/wrap/page.tsx:253)).

Faucet parses with `selectedWrapper.decimals` (underlying) at [faucet/page.tsx:112-113](src/app/faucet/page.tsx:112) — also correct.

**3.2.5 Permit auto-fire.** The Wrap page passes `enabled: !!address && !!selectedWrapper?.erc7984Address` to `useConfidentialBalance` ([wrap/page.tsx:87](src/app/wrap/page.tsx:87)), which would normally fire as soon as a token is selected. In practice the UI gates display behind a "Decrypt to view" button ([wrap/page.tsx:264-281](src/app/wrap/page.tsx:264)) that calls `refetch()`. This works *only because* the SDK does not pre-issue a permit on the initial enabled fetch — it returns `undefined` until refetch. This is a fragile contract; if the SDK behavior changes, every token-select will trigger a wallet prompt. Consider switching to `enabled: hasUserClickedDecrypt` to make the gating explicit.

### 3.3 Extensibility

**3.3.1 Hardcoded wrapper list (Finding #1 again).** Already covered above — this is *the* extensibility failure.

**3.3.2 Hardcoded Mainnet addresses (Finding #7, Medium).** The Mainnet block in [contracts.ts:86-143](src/config/contracts.ts:86) has the same problem with extra blast radius: Mainnet pair additions cannot reach the app without a redeploy, and a wrong address there silently routes user funds to the wrong contract. I did not full-text-cross-check every Mainnet address against the official page in this session — the well-known underlyings (USDC, USDT, WETH) are correct, but the seven hardcoded ERC-7984 wrapper addresses **must** be verified against [docs.zama.org/protocol/protocol-apps/addresses/mainnet.md](https://docs.zama.org/protocol/protocol-apps/addresses/mainnet.md) before submission. Better still, eliminate them via dynamic reads (#1).

**3.3.3 No logic / UI separation (Finding #18, High for differentiation).** Every wrapper-related operation is implemented inside a Next.js page component. There is no `lib/registry.ts` exporting `listPairs(client, chainId)`, no `lib/shield.ts` exporting a viem-based `shield(client, account, pair, amount)`, no CLI, no published package. The bounty's category goal is "templates and resources for the developer ecosystem" — a competing team that ships even a thin `@zamavault/sdk` npm package will out-position this submission on the extensibility axis.

**3.3.4 Chain configuration.** This is one of the better parts: [src/config/chains.ts](src/config/chains.ts) centralizes Sepolia + Mainnet config, and `SupportedChainId` is reused across files. Adding Hoodi is a 10-line change here — see Opportunities.

### 3.4 UX

**3.4.1 Permit signing surprise.** The wrap page is correctly gated behind "Decrypt to view" (good). The portfolio page is correctly gated behind "Decrypt Balance" / "Decrypt All" (good). No silent permit prompts on page load — confirmed by inspection.

**3.4.2 Failure states.** As noted in #12 and #3, the wrap page destructures `decryptWrapperError` ([wrap/page.tsx:84](src/app/wrap/page.tsx:84)) but never renders it. A user who rejects a permit gets stuck on "Awaiting Permit..." with no retry path.

**3.4.3 "Balance 0" vs "Balance not decrypted."** Handled adequately: portfolio shows `••••••` + "Encrypted" badge when not decrypted, and `0 cXXX` when decrypted-and-zero. Wrap page shows the literal value (`0`) once decrypted, which is correct.

**3.4.4 Revoked / invalid pairs.** No handling — see #6.

**3.4.5 Duplicate network switchers.** See #10 — the home page's switcher does not call `switchChain` and so silently desyncs from the wallet's actual chain.

**3.4.6 Accessibility.** Only one `aria-*` attribute in the entire `src/` tree. Modal lacks `role="dialog" aria-modal aria-labelledby`. Theme variants (Frost especially) need a contrast pass. The custom `<select>` in [wrap/page.tsx:304](src/app/wrap/page.tsx:304) styled with `appearance: none` and no visible chevron is hard to discover via keyboard.

**3.4.7 RPC failure / stale-while-revalidate.** [providers/Providers.tsx:27-37](src/providers/Providers.tsx:27) configures `fallback([alchemy, publicnode, gateway])` (good), but the QueryClient has no persistence — a slow first load shows a blank screen. Add `@tanstack/react-query-persist-client`.

**3.4.8 Mobile responsiveness.** Not tested in this audit. The table at [page.tsx:119](src/app/page.tsx:119) has no horizontal scroll wrapper class visible in the snippet; verify on a 360px viewport before submission.

### 3.5 Code quality

| Aspect | Status |
|---|---|
| TS strict | ✅ Enabled ([tsconfig.json:7](tsconfig.json:7)) |
| `any` in critical paths | ⚠️ 3 occurrences, all `catch (err: any)` (Finding #16) |
| Test suite | ❌ None |
| CI workflow | ❌ No `.github/` |
| Lint config | ✅ ESLint configured ([eslint.config.mjs](eslint.config.mjs)) |
| Dead code | ⚠️ Entire [registry-abi.ts](src/lib/registry-abi.ts) is unused (Finding #9); `import { sepolia }` unused in [wrap/page.tsx:21](src/app/wrap/page.tsx:21) (Finding #21) |
| Reusability separation | ❌ Single flat Next.js app (Finding #18) |
| Component docs (Storybook) | ❌ None |
| Inline-style sprawl | ⚠️ Many components use `style={{...}}` for spacing/color values that already exist as CSS variables — cosmetic, not blocking |

### 3.6 Production-readiness

**3.6.1 No live deployment (Finding #5, deferred).** Highest practical impact: judges who have to clone-and-build see a fraction of submissions. Vercel deploy should take well under an hour. *User has indicated this will be handled separately, outside this implementation pass.*

**3.6.2 No Relayer API key plumbing (Finding #4, deferred).** [providers/Providers.tsx:43-55](src/providers/Providers.tsx:43) constructs `RelayerWeb` with `transports: { ...SepoliaConfig, network: <rpc> }` for both chains. There is no API key. On Mainnet, the relayer will refuse shield/unshield/decrypt requests. Today the failure mode is silent → opaque error toast. Fix: either accept a build-time key via `NEXT_PUBLIC_RELAYER_API_KEY` *and* document the backend-proxy alternative, or gate Mainnet write actions behind a "Mainnet writes require a Relayer API key — contact the operator" banner.

Importantly: **Sepolia and registry browsing do NOT need a key.** The audit prompt's note is correct — only Mainnet write/decrypt paths need one. So the right fallback is "read-only Mainnet, full Sepolia" when no key is present.

*User has indicated the Mainnet key will be obtained later; the plumbing/fallback work also waits for that step.*

**3.6.3 No `.env.example` (Finding #19, Low).** Trivial to add; signals production-readiness.

**3.6.4 `.env*` is gitignored (good).** No secrets in the repo.

**3.6.5 No error boundary (Finding #20).** Next.js App Router supports `app/error.tsx`. Add one.

**3.6.6 No `homepage` in package.json.** Trivial signal of polish.

---

## 4. Opportunities ranked by effort vs impact

(Two-week window: 2026-06-21 → 2026-07-07 AOE.)

| Opportunity | Est. effort | Differentiation impact | Verdict |
|---|---|---|---|
| **Dynamic registry reads** (fixes #1) | 0.5–1 day | Critical — fixes the headline gap | **Must do** |
| **`matchZamaError` + `useResumeUnshield`** | 1 day total | High — correctness + UX criteria | **Must do** |
| **Live Vercel deploy** | 1–2 hours | High — judges' first impression | *Deferred — user handles separately* |
| **Mainnet relayer-key + read-only fallback** | 0.5 day | High — Mainnet writes are currently broken | *Deferred — waits on user obtaining API key* |
| **`useActivityFeed` wrap/unwrap history tab** | 1 day | Medium-high — visible product surface most teams will skip | **Worth doing** |
| **Extract `packages/registry-sdk` + publish to npm** | 1.5–2 days | High — directly addresses category goal ("templates for the ecosystem"); installable from `npm` is a powerful demo asset | **Worth doing** |
| **Operator approvals UI** (`useConfidentialApprove` / `useConfidentialIsApproved`, list approvals + revoke) | 1–1.5 days | Medium — niche but technically impressive; few teams will ship this | **Worth doing if time** |
| **Hoodi testnet support** | 0.5 day | Low-medium — easy chain-config addition; demonstrates extensibility | **Nice to have** |
| **Lightweight indexer (subgraph or ponder) for registry + wrapper events** | 3–4 days | High in theory, but late-stage indexer work tends to ship broken; activity feed via SDK is the safer path | **Skip** (do `useActivityFeed` instead) |
| **CLI scripting against the registry** | 2 days | Low for judging, falls naturally out of `registry-sdk` extraction | **Skip standalone; bundle inside the package** |
| **Contribute fix / example back to Zama's SDK or protocol-apps repos** | 0.5–2 days | High signal for a "developer ecosystem" track, especially if the PR is merged before judging | **Worth doing if a small, real fix is identified during the dynamic-registry migration** |
| **Storybook for reusable components** | 1 day | Low for this bounty's judging axes | **Skip** |
| **Unit tests for `lib/utils.ts` + `lib/registry.ts`** | 0.5 day | Low-medium — defensive against the decimals regression | **Worth doing as part of the registry migration** |
| **GitHub Actions CI (`tsc`, `eslint`, `next build`)** | 1 hour | Low-medium — code-quality signal | **Worth doing** |
| **Stale-while-revalidate cache via `@tanstack/react-query-persist-client`** | 1 hour | Low — better UX on cold start | **Nice to have** |

---

## 5. Prioritized action plan

### Must fix before submission (in this order)

> **Important:** before starting any item below, **re-verify any concrete numeric or address claim** (mainnet wrapper addresses, ABI signatures, hook names, decimals values, etc.) against current Zama docs or on-chain reads. Do not trust the addresses or function names in this report — they were captured from the codebase and from doc references at audit time and may have drifted.

1. **Dynamic registry reads.** Replace `KNOWN_WRAPPERS[chainId]` lookups with `useListPairs` (or equivalent). Add a `useRegistryPairs(chainId)` hook in `src/lib/registry.ts` that returns `{ pairs, isLoading, error, isFromCache }`. Delete or rewrite [registry-abi.ts](src/lib/registry-abi.ts). Wire it into all four pages. Keep [tokens.ts](src/config/tokens.ts) for display metadata only.
2. **`matchZamaError` everywhere.** Replace all three `catch (err: any)` sites with `matchZamaError` and produce distinct toast messages per case.
3. **`useResumeUnshield` banner on Portfolio + Wrap.** Auto-detect pending unwraps on mount; offer "Resume" CTA.
4. **Add `app/error.tsx` error boundary.**
5. **Add `.env.example`.**
6. **Add GitHub Actions CI** (`tsc --noEmit`, `eslint`, `next build`).
7. **Strip dead code** ([registry-abi.ts](src/lib/registry-abi.ts) if unused after #1; unused imports; the duplicate in-page network switcher).
8. **Verify Mainnet hardcoded ERC-7984 wrapper addresses** against the official Mainnet addresses page **only if** #1 cannot fully replace them (it should). If any are kept, cross-check them.
9. **Smoke-test mobile** on a 360px viewport.

### Deferred — handled separately by the user

- **D1. Live Vercel deploy** + add URL to README headline and `package.json`'s `homepage` field.
- **D2. Mainnet Relayer API key + read-only Mainnet fallback** — wait for the user to obtain the key, then plumb it through `RelayerWeb` and ship the read-only banner when absent.

### Do only if time remains

10. **Extract `packages/registry-sdk`** as a thin viem-based module. Even a minimal published `0.0.1` on npm gives the submission a unique selling point.
11. **`useActivityFeed` wrap/unwrap/transfer history tab** on Portfolio.
12. **Operator approvals UI** (list + revoke).
13. **Hoodi testnet support** (chains.ts + Providers.tsx).
14. **Stale-while-revalidate persistence.**
15. **Accessibility pass** (aria labels, Modal role, contrast).
16. **Pagination on the Registry table.**
17. **Revoked-pair handling.**
18. **Unit tests for `formatAmount` / `parseAmount` / `useRegistryPairs`.**
19. **Open a small PR back to a Zama official repo** if a real, narrow opportunity surfaces during the registry migration (e.g. a docs fix or a small example).

---

*End of audit. No code modifications were made in this session.*
