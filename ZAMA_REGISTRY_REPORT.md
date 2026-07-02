# Zama WrappersRegistry — Potential Documentation / Registry Issue Report

**Prepared by:** ShadowLine team
**Date:** 2026-06-22
**Context:** While building [ShadowLine](https://github.com/hosein-ul/ShadowLine) — a confidential token registry explorer and wrapping dApp for the Zama Developer Program Mainnet Season 3 Bounty Track — we read the on-chain `WrappersRegistry` dynamically via `useListPairs` from `@zama-fhe/react-sdk` and cross-referenced the results against the official Zama address documentation. We identified one entry on Ethereum Mainnet that appears to be a test/placeholder rather than a legitimate production wrapper.

---

## Flagged Entry: `cbbqTGBP` on Ethereum Mainnet

| Field | Value |
|---|---|
| **Wrapper name (per docs)** | Confidential bbqTGBP |
| **Wrapper symbol** | `cbbqTGBP` |
| **Wrapper address** | [`0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762`](https://etherscan.io/address/0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762) |
| **Underlying token address** | [`0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F`](https://etherscan.io/token/0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F) |
| **Listed in docs?** | Yes — [Mainnet / Ethereum / Confidential wrappers](https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum) |
| **Listed in on-chain registry?** | Presumably yes (docs reflect registry state) |

### Why we flagged it

1. **Name is not a known asset.** "bbqTGBP" does not correspond to any recognized ERC-20 token on Ethereum. All other Mainnet wrappers (USDC, USDT, WETH, BRON, ZAMA, tGBP, XAUt) wrap well-known, publicly-traded tokens.

2. **Underlying address is a vanity address.** The underlying token address `0xbeeffABcd0dB09589Dd21854aa760C52aB4bf04F` begins with `beeff` followed by `ABcd` — a clear vanity-generation pattern. While not inherently wrong, this is atypical for production token deployments and is commonly associated with test contracts.

3. **Possible relationship to `tGBP`.** The name "bbqTGBP" contains "TGBP" as a suffix, raising the possibility that this is a variant, fork, or test deployment related to the existing `ctGBP` wrapper (`0xa873...eDD9`). If so, having both in the production registry without any disambiguation could confuse users and developers building on the registry.

### What we did in ShadowLine

- ShadowLine reads the `WrappersRegistry` **live on-chain** via `useListPairs({ metadata: true })` from `@zama-fhe/react-sdk`. This means any pair registered on-chain appears automatically in our app.
- We added a **manual blocklist** specifically for `cbbqTGBP` (`0xBA4cFF6ED6F7Cb2A58776dECa4E984b498446762`) to exclude it from the user-facing display. The blocklist is documented in our source code (`src/lib/registry.ts`) with a full rationale.
- If this entry is confirmed as legitimate and has a corrected name, we will remove it from the blocklist immediately.

### Questions for the Zama team

1. **Is `cbbqTGBP` intentional?** If so, what asset does "bbqTGBP" represent, and should it be displayed to end-users in registry explorers?
2. **Is it a test entry that should be removed from the Mainnet registry?** If this was deployed for internal testing, it may be worth deregistering it from the production registry to avoid confusion for bounty participants and future developers building on the registry.
3. **Is the documentation correct?** If the entry is legitimate but the name is wrong (e.g., it should be `ctGBP v2` or another name), the docs page at [mainnet/ethereum](https://docs.zama.org/protocol/protocol-apps/addresses/mainnet/ethereum) should be updated.

---

## Observation: Dual `tGBP` Wrappers on Sepolia (Not a Bug)

For completeness, we also note that the Sepolia testnet has **two distinct tGBP wrapper pairs**:

| Name | Symbol | Wrapper | Underlying | Mint |
|---|---|---|---|---|
| Confidential tGBP (Mock) | `ctGBPMock` | `0xfCE5...F7CC` | `0x93c9...1442` | Public (1M limit) |
| Confidential tGBP | `ctGBP` | `0x167D...A208` | `0xf6Ef...7ff3` | Restricted |

We understand this is **intentional** — the mock version is for developer testing (with a public `mint` function), and the non-mock version wraps the "official" testnet tGBP with restricted minting. We handle both correctly in ShadowLine:
- The mock `ctGBPMock` appears in both the registry table and the faucet (mintable).
- The restricted `ctGBP` appears in the registry table but is **excluded from the faucet** (since its underlying does not have a public `mint`).
- Both appear in the Portfolio for balance decryption.

We mention this only because the dual-entry pattern might confuse other bounty participants — a brief note in the Sepolia address docs clarifying "the mock wrapper is for development, the non-mock wrapper wraps the real testnet asset" would be helpful.

---

## Summary

| Entry | Network | Status | Our Action |
|---|---|---|---|
| `cbbqTGBP` (`0xBA4c...6762`) | Mainnet | Suspected test/placeholder | Blocklisted in ShadowLine display |
| Dual `ctGBP` / `ctGBPMock` | Sepolia | Intentional (mock + real) | Both displayed correctly, faucet filters mock-only |

We appreciate any clarification the Zama team can provide. This report is shared in good faith as part of our bounty development work to help improve the ecosystem documentation and registry hygiene.
