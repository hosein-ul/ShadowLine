/**
 * Custom ERC-20 ↔ ERC-7984 pairs — the local-config extension point.
 *
 * PURPOSE
 * -------
 * The app sources wrapper pairs primarily from the official on-chain
 * Zama WrappersRegistry. This file lets you declare ADDITIONAL pairs
 * that are not (yet) in the official registry — for example, pairs you
 * deployed yourself for local testing, or pairs awaiting registration.
 *
 * HOW TO ADD A PAIR
 * -----------------
 * 1. Fill in the entry below (see the commented-out example).
 * 2. Run `npm run dev` — the pair appears immediately in:
 *      - Registry table  (/app)           — with a "Custom" badge
 *      - Wrap / Unwrap   (/app/wrap)      — in the token selector
 *      - Portfolio        (/app/portfolio) — as a decryptable position
 *      - Faucet           (/app/faucet)   — only if isMintable: true
 * 3. Commit the file if you want the pair to persist across deployments.
 *
 * IMPORTANT NOTES
 * ---------------
 * - Custom pairs are NOT validated by the on-chain registry. The app
 *   cannot verify that the ERC-7984 wrapper is legitimate. Only add
 *   addresses you deployed and control.
 * - If a custom pair's erc20Address later gets registered on-chain, the
 *   registry version automatically takes precedence and the custom entry
 *   is dropped (de-duplication happens in src/lib/registry.ts).
 * - The `note` field is shown in the UI tooltip so users know why this
 *   pair exists. Always fill it in.
 *
 * FIELD REFERENCE
 * ---------------
 * erc20Address     — address of the underlying ERC-20 token
 * erc7984Address   — address of the ERC-7984 confidential wrapper
 * symbol           — short ticker, e.g. "USDC" (without the "c" prefix)
 * name             — full display name
 * decimals         — ERC-20 token decimals
 * wrapperDecimals  — confidential wrapper decimals (almost always 6)
 * isMintable       — set true if the ERC-20 has a public mint() function
 *                    (i.e. it is a cTokenMock) so the Faucet page can use it
 * note             — human-readable reason; shown as a UI tooltip
 *
 * EXAMPLE
 * -------
 * {
 *   erc20Address:   '0xYourERC20TokenAddress',
 *   erc7984Address: '0xYourERC7984WrapperAddress',
 *   symbol:         'MYT',
 *   name:           'My Test Token',
 *   decimals:       18,
 *   wrapperDecimals: 6,
 *   source:         'custom',
 *   note:           'Dev-only wrapper deployed 2025-06-27 for local testing',
 * },
 */

import type { CustomPair } from '@/config/contracts';

export const CUSTOM_PAIRS: CustomPair[] = [
  // ── Add your custom pairs below ──────────────────────────────────────────
  // Uncomment and fill in the example above to register a custom pair.
];
