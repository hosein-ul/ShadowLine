# 🛡️ ZamaVault — Confidential Asset Vault

ZamaVault is a production-grade Web3 application built on top of the **Zama Protocol** and **ERC-7984 Confidential Token Standard**. It provides a premium, highly responsive interface for shielding public ERC-20 tokens into encrypted, privacy-preserving ERC-7984 confidential tokens and unshielding them back to public balances.

Using Fully Homomorphic Encryption (FHE), ZamaVault ensures that your token balances and transaction amounts remain completely encrypted on-chain, while allowing you to securely decrypt and inspect your balances locally using cryptographic permits.

---

## ✨ Features

*   **🔒 Shielding (Wrap)**: Convert public ERC-20 tokens into encrypted ERC-7984 confidential wrappers. On-chain balances and transfer amounts are completely obfuscated.
*   **🔓 Unshielding (Unwrap)**: Convert encrypted ERC-7984 confidential wrappers back into public ERC-20 tokens.
*   **💼 Confidential Portfolio**: View all confidential assets in one place. Balances remain encrypted on-chain, but can be decrypted on the client side using **EIP-712 permit signatures**.
*   **📊 Wrapper Registry Explorer**: Reads Zama's on-chain `WrappersRegistry` directly (via `useListPairs` from `@zama-fhe/react-sdk`) and lists every registered ERC-20 ↔ ERC-7984 pair on the active network — including pairs added after this client was built. Falls back to a hardcoded snapshot when no wallet is connected so anonymous visitors can still browse. Revoked pairs (`isValid === false`) are flagged with a "Revoked" badge and hidden from the wrap/unwrap selector.
*   **🚰 Test Faucet**: A built-in developer faucet with a **5-second cooldown** to acquire test tokens (USDC, USDT, WETH, ZAMA, etc.) on the Sepolia network.
*   **🎨 Nordic Clean Aesthetic**: A default premium dark-themed design system featuring smooth micro-animations, glassmorphism card layouts, custom typography, and official brand logos.
*   **🎉 Transaction Feedback & Delighters**: Custom transaction tracking with direct links to block explorers and interactive confetti blasts on successful wrap/unwrap actions.

---

## 🏗️ Technical Architecture & Stack

ZamaVault is designed as a secure, decentralized client-side application that interfaces with the Ethereum blockchain:

*   **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router, static compilation, Turbopack enabled).
*   **FHE Integration**: Official Zama React SDK (`@zama-fhe/react-sdk`) for managing FHE permits, querying encrypted balances, shielding (`useShield`), and unshielding (`useUnshield`).
*   **Web3 & Provider Layer**: [Wagmi](https://wagmi.sh/) and [Viem](https://viem.sh/) configured with high-performance, stable RPC endpoints (using Alchemy for Sepolia and Mainnet).
*   **Design & Styling**: Pure Vanilla CSS system (`globals.css`) using custom CSS Custom Properties for maximum flexibility and performance. Fully responsive for mobile, tablet, and desktop screens.
*   **Icons**: [Lucide React](https://lucide.dev/).
*   **Transaction Delighters**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) for victory animations.

---

## 🔑 FHE & Confidential Flows

### 1. Permit-Based Decryption
On-chain confidential balances are stored as encrypted ciphertext handles. To display these balances to the user, ZamaVault utilizes the Zama React SDK's `useConfidentialBalance` hook:
1. The user requests decryption of an asset balance.
2. The application prompts the user to sign an **EIP-712 permit** using their Web3 wallet.
3. This signature registers an ephemeral public key for decryption.
4. The Zama SDK sends the permit signature and ciphertext to Zama's Gateway/Coprocessor.
5. The Coprocessor validates the signature, decrypts the balance handle, and returns the plaintext balance.
6. The plaintext balance is rendered locally; **private keys never leave the wallet and plaintext balances are never stored on-chain**.

### 2. Shielding (Wrap) Flow
1. **Approval**: The user approves the ERC-7984 Wrapper contract to spend the underlying public ERC-20 tokens.
2. **Shielding**: The user submits the shield transaction. The SDK calls `deposit(amount)` on the wrapper contract, which wraps the public ERC-20 and mints encrypted ERC-7984 wrappers to the user's address.

### 3. Unshielding (Unwrap) Flow
1. **Withdrawal**: The user submits the unshield transaction.
2. **Gateway Processing**: The SDK calls `withdraw(amount)` on the wrapper. This burns the encrypted wrappers and triggers Zama's Gateway/Coprocessor flow to securely process the unshielding.
3. **Finalization**: Once processed, the underlying public ERC-20 tokens are returned to the user's public wallet address.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) and a package manager (`npm`, `pnpm`, or `yarn`) installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/hosein-ul/zamavault.git
   cd zamavault
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

### Configuration
ZamaVault is pre-configured to use stable Alchemy RPC endpoints. If you want to use your own RPC endpoints, create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
```

### Running Locally
To launch the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
To generate a fully optimized static and server-rendered production build:
```bash
npm run build
npm run start
```

---

## 🎨 Theme & Design System

ZamaVault supports multiple visual design themes which can be customized via the Header theme-selector. The default theme is **Nordic Clean**:

*   **Nordic Clean**: A sleek, clean layout with high-contrast elements, neutral dark backgrounds, subtle gray borders, and Zama yellow/mint-accent highlights.
*   **Cyber**: A futuristic cyberpunk theme with neon purple borders, green glowing accents, and dark grid backdrops.
*   **Nebula**: A cosmic dark theme using deep indigo/purple gradients and space-like aesthetics.
*   **Emerald**: A clean dark theme featuring vibrant emerald green highlights and green-bordered containers.

All layouts, cards, buttons, badges, tables, and inputs are built using semantic variables declared in `src/app/globals.css`.

---

## 📄 License

This project is licensed under the MIT License.
