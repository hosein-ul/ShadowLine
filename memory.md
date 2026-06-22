# ZamaVault — Developer Memory & Lessons Learned

This document serves as a persistent record of the core technical insights, issues encountered, and architectural solutions discovered while building and debugging **ZamaVault** (a confidential token registry explorer and wrapping dApp utilizing Zama's Fully Homomorphic Encryption SDK).

---

## 💡 Core Insights & Technical Learnings

### 1. FHE Decimals Scaling (The Decimals Mismatch)
* **The Insight:** On-chain ERC-7984 wrapper contracts utilize `decimals() = 6` regardless of the underlying ERC-20 token's decimals (e.g., WETH, ZAMA, BRON, tGBP have 18 decimals, but their wrappers have 6).
* **The Reason:** Zama's fhEVM and FHE coprocessors represent encrypted amounts as 64-bit unsigned integers (`euint64`). Storing full 18-decimal values (e.g., $10^{18}$ wei) would cause an overflow at relatively small amounts (max value of `uint64` is $\approx 1.84 \times 10^{19}$). Therefore, wrapper contracts scale the deposited amounts down by $10^{12}$ during the shielding process.
* **The Impact:** 
  - The UI must format decrypted FHE balances using **6 decimals** (wrapper decimals), not 18. Formatting a 6-decimal FHE balance of `1,000,000` (which is $1.0$ token) with 18 decimals yields `0.000000000001` (truncated to `0` in the UI).
  - **Wrap (Shield) inputs** must be parsed using the underlying token's decimals (18 decimals) to approve and transfer the correct wei amount to the contract.
  - **Unwrap (Unshield) inputs** must be parsed using the wrapper's decimals (6 decimals) because the contract's `withdraw` function expects the input in FHE wrapper units.

---

## 🛠️ Problems Encountered & Solutions

### Problem 1: Confidential Balances Displaying as `0`
* **Symptom:** WETH, ZAMA, BRON, and tGBP confidential balances showed as `0` on the Portfolio and Wrap pages, despite successful wallet permits and decryption.
* **Cause:** Frontend configuration `wrapperDecimals` was set to `18` to match the underlying token. This caused `formatAmount` to divide the 6-decimal FHE balance (`10^6` for 1.0 token) by $10^{18}$, resulting in `0`.
* **Solution:** 
  1. Updated `contracts.ts` to set `wrapperDecimals: 6` for all tokens.
  2. Modified the Wrap/Unwrap UI to parse Wrap with `underlyingDecimals` and Unwrap with `wrapperDecimals`.
  3. Added a dynamic indicator in the Registry table displaying `decimals / wrapperDecimals` (e.g., `18 / 6`) to clarify the dual-precision nature of FHE wrappers.

### Problem 2: Permit Spam & MetaMask Crashing
* **Symptom:** Decrypting the portfolio triggered multiple simultaneous signature requests (one for each wrapper token). This spammed the user's wallet, causing MetaMask to hang, reject requests, or crash.
* **Cause:** The page rendering loop invoked individual `useConfidentialBalance` hooks for each token card, leading to race conditions and simultaneous permit requests.
* **Solution:** 
  - Refactored `portfolio/page.tsx` to use Zama's plural hook `useConfidentialBalances` at the page level.
  - Users sign **exactly one** EIP-712 permit signature in their wallet, which decrypts all portfolio balances in a single batch.

### Problem 3: Theme Flashing (Flickering) on Page Load
* **Symptom:** On initial load, the site would flash the bright default yellow theme ("Cyber") before applying the stored dark mode preference, creating an unpleasant visual jarring effect.
* **Cause:** React state hydration occurred client-side after initial HTML render, causing a delay in reading `localStorage` settings.
* **Solution:** 
  - Injected a lightweight, synchronous inline script in the `<head>` of `layout.tsx`.
  - The script executes immediately when the browser receives the HTML header (before rendering the body), reading `localStorage` and attaching `data-theme` and `data-design-theme` attributes to `document.documentElement` to prevent any visual layout shifts or flashes.

### Problem 4: Low-Contrast Dark Mode & Nordic Clean Aesthetics
* **Symptom:** The initial dark mode layout had low readability, undefined card boundaries, and dark-on-dark text.
* **Solution:**
  - Restored a clean white Light Mode ("Snow White").
  - Designed four distinct Nordic-themed dark modes (`Charcoal`, `Midnight`, `Frost`, `Aurora`) featuring higher contrast border properties (`rgba(255,255,255,0.15)` to `rgba(255,255,255,0.28)`) and vibrant accent colors (sky-blue, zinc-white, ice-blue, aurora-teal).

### Problem 5: RPC Reliability Failover
* **Symptom:** Slow page loads or RPC disconnection issues when relying on a single Alchemy key or public node.
* **Solution:** 
  - Configured Wagmi's `fallback` transport utility.
  - The app attempts to query the dedicated Alchemy RPC first. If it is rate-limited or unavailable, it automatically falls back to public node backups without throwing UI errors.

---

### Problem 6: Hardcoded Registry — Missing Pairs
* **Symptom:** The app listed only 7 pairs on Sepolia and 7 on Mainnet, but the on-chain WrappersRegistry had 8 on each.
* **Cause:** Every page read from a static `KNOWN_WRAPPERS` map in `contracts.ts`. The `REGISTRY_ABI` file existed but was dead code with wrong function names (`getAllWrappers` instead of `listPairs`).
* **Missing pairs:** Sepolia `ctGBP` (restricted, `0x167D...A208`); Mainnet `cbbqTGBP` (suspicious test entry, `0xBA4c...6762`).
* **Solution:**
  1. Created `src/lib/registry.ts` with `useRegistryPairs(chainId)` hook wrapping `useListPairs` from `@zama-fhe/react-sdk`.
  2. `KNOWN_WRAPPERS` demoted to offline fallback — UI shows "Showing cached snapshot" banner when using it.
  3. Deleted the dead `registry-abi.ts` file entirely.
  4. `cbbqTGBP` blocklisted with documented rationale (vanity address, unknown asset name).

### Problem 7: Auto-Firing EIP-712 Permits on Token Select
* **Symptom:** On the Wrap page, selecting a different token from the dropdown immediately triggered a MetaMask signature prompt without the user clicking "Decrypt."
* **Cause:** `useConfidentialBalance` had `enabled: !!address && !!selectedWrapper?.erc7984Address` — as soon as a token was selected and wallet connected, the hook fired. Additionally, `useEffect` for resetting `decryptRequested` ran one frame late, creating a window where the old `decryptRequested=true` combined with the new token address.
* **Solution:**
  1. Added `decryptRequested` state, defaulting to `false`. Hook now uses `enabled: decryptRequested && !!address && !!tokenAddress`.
  2. Reset `decryptRequested` **synchronously** inside the token `<select>`'s `onChange` handler (not just in a `useEffect`).
  3. Removed `refetchWrapperBalance()` from the automatic balance-sync `useEffect` — only public balance and allowance auto-refresh.
  4. Created `ConfidentialBalanceInline` component with proper states: Decrypt button → Awaiting signature → Value → Retry on error.

### Problem 8: Generic Error Messages for All Failures
* **Symptom:** Every SDK error (signature rejected, relayer down, tx reverted, insufficient balance) showed the same "Transaction Failed" toast with raw `err.message`.
* **Solution:**
  1. Created `src/lib/errors.ts` with `classifyError(err)` using `matchZamaError` from `@zama-fhe/sdk`.
  2. Maps 15+ Zama SDK error codes to distinct user-friendly `{ title, message, retryable }` objects.
  3. Fallback patterns catch common wallet rejections (MetaMask "user rejected", WalletConnect "ACTION_REJECTED", etc.).
  4. All three `catch (err: any)` sites replaced with `catch (err: unknown)` + `classifyError`.

### Problem 9: No Recovery for Interrupted Unshield
* **Symptom:** A user closing their browser tab between the `unwrap` transaction and the `finalizeUnwrap` step had no way to resume — their tokens were stuck pending.
* **Solution:**
  1. Created `PendingUnshieldBanner` component using `loadPendingUnshield` (checks SDK storage on mount) and `useResumeUnshield` (completes finalization).
  2. Shows a yellow warning banner with "Resume" button when a pending unshield is detected.
  3. Integrated on both Portfolio page (per-wrapper) and Wrap page (for selected token).

---

## 💡 Best Practices for Zama FHE Frontend Projects

1. **Always Verify Decimals On-Chain:** Never assume a wrapper matches the underlying token's decimals. Write a quick read script (like `scratch_check.js`) to verify the wrapper's `decimals()` output.
2. **Batch Permits Where Possible:** Use batch hooks for decryption (`useConfidentialBalances`) to minimize wallet interaction prompts.
3. **Handle Case Insensitivity:** FHE Relayer/Gateway responses might return token address keys in lowercase or mixed case. Implement `.toLowerCase()` keys when lookup results are cached.
4. **Use Fallback Transports:** In Wagmi configs, always provide fallback providers to guarantee dapp stability.
5. **Never Auto-Fire Permits:** Gate every `useConfidentialBalance` behind an explicit `decryptRequested` state. Reset it synchronously on token change — not in `useEffect` (one-frame race condition).
6. **Use matchZamaError for Error Handling:** The Zama SDK exports typed error codes. Use `matchZamaError(err, { SIGNING_REJECTED: ..., ... })` instead of `err.message` for user-facing errors.
7. **Normalize Mock Symbols:** Sepolia mock tokens have on-chain symbols like `USDCMock`. Strip the `Mock` suffix at the registry-read boundary and show a separate "Mock" badge in the UI.
8. **Blocklist Suspicious Registry Entries:** The on-chain registry may contain test/placeholder entries (e.g., `cbbqTGBP` on Mainnet with vanity address `0xbeeff...`). Use a documented blocklist rather than hiding the issue.
9. **Read the Registry Dynamically:** Never hardcode wrapper pairs as the sole data source. Use `useListPairs` from the SDK or raw `listPairs` contract calls. Keep hardcoded pairs only as a disconnected-wallet fallback.

---

## 📋 Remaining Plan (as of 2026-06-23)

See `CLAUDE.md` for full project context. See the plan file for the master checklist.

### Completed
- Phase 1: Bug fixes (tooltip, matchZamaError, useResumeUnshield, error boundary, .env.example)
- Phase 2.1: REST API `/api/registry`
- Phase 4.1: GitHub Actions CI

### Next Up
- Phase 2.3: Interactive tutorial `/learn` page
- Phase 2.4: Code snippet generator `/developers` page
- Phase 2.2: npm package `@zamavault/sdk`
- Phase 3: Analytics dashboard + activity feed
- Phase 4.2-4.4: Vitest tests, dead code cleanup, mobile test
- Phase 5: README rewrite, final polish

### Deferred (User Handles)
- D1: Vercel deploy + live URL
- D2: Mainnet Relayer API key + read-only fallback
