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

## 💡 Best Practices for Zama FHE Frontend Projects

1. **Always Verify Decimals On-Chain:** Never assume a wrapper matches the underlying token's decimals. Write a quick read script (like `scratch_check.js`) to verify the wrapper's `decimals()` output.
2. **Batch Permits Where Possible:** Use batch hooks for decryption (`useConfidentialBalances`) to minimize wallet interaction prompts.
3. **Handle Case Insensitivity:** FHE Relayer/Gateway responses might return token address keys in lowercase or mixed case. Implement `.toLowerCase()` keys when lookup results are cached.
4. **Use Fallback Transports:** In Wagmi configs, always provide fallback providers to guarantee dapp stability.
