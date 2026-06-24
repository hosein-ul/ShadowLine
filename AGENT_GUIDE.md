# ZamaVault — Master Reference Document for AI Agents

> این فایل یک راهنمای کامل برای هر agent هوش مصنوعی است که روی پروژه ZamaVault کار می‌کند.
> شامل همه جزئیات معماری، قوانین حیاتی، اشتباهات رایج، و تجربیات کسب‌شده است.

---

## ۱. بستر پروژه

**ZamaVault** یک رابط کاربری برای اکوسیستم توکن محرمانه Zama است:  
ثبت‌نام پویای Registry، wrap/unwrap ERC-20، رمزگشایی پورتفولیوی رمزنگاری‌شده، و فاست Sepolia.

- **مخزن:** https://github.com/hosein-ul/zamavault
- **شاخه:** `feat/dynamic-registry-finding-1` (PR #1 → main)
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, Wagmi 3, Viem 2, @zama-fhe/react-sdk 3.0.1, TypeScript 5
- **هدف:** Zama Developer Program Mainnet Season 3 Bounty Track (deadline: 2026-07-07 AOE)
- **دایرکتوری:** `C:\NEW work\`

---

## ۲. قوانین حیاتی — هرگز نقض نشوند

### 🚨 قانون ۱: هیچ اشاره‌ای به Claude/Anthropic
هرگز نام Claude، Claude Code، Anthropic، یا هر چیز مشابه را در کد، commit‌ها، PR، README، یا هر فایل قابل مشاهده توسط داوران قرار ندهید. هیچ `Co-Authored-By` header نزنید. این یک ارسال مسابقه است.

### 🚨 قانون ۲: هرگز permit EIP-712 را auto-fire نکنید
هر decrypt/permit باید پشت یک کلیک صریح کاربر باشد. الگوی `decryptRequested` در `wrap/page.tsx` دقیقاً برای این است:
- `decryptRequested` به طور پیش‌فرض `false` است
- فقط وقتی کاربر روی "Decrypt" کلیک می‌کند `true` می‌شود
- **سورس باگ رایج:** صدا زدن `refetch()` مستقیم روی `useConfidentialBalance` — TanStack Query متد `refetch()` را از `enabled: false` bypass می‌کند!
- **راه‌حل:** بعد از هر shield/unshield موفق، `setDecryptRequested(false)` صدا بزنید
- Reset را **به صورت synchronous** در `onChange` کنید، نه در `useEffect` (race condition یک فریمی)

### 🚨 قانون ۳: Decimal Scaling بار حیاتی دارد
```
wrapper decimals: همیشه 6 (محدودیت euint64 FHE)
underlying decimals: 6 یا 18

Shield (wrap):   parseAmount(input, underlyingDecimals)   ← دسیمال underlying
Unshield:        parseAmount(input, 6)                    ← همیشه 6
Display:         formatAmount(balance, 6)                 ← همیشه 6

⚠️ اشتباه رایج: formatAmount(balance, 18) → نمایش صفر برای توکن‌های 18 دسیمال
```

### 🚨 قانون ۴: هرگز secret commit نکنید
فایل‌های `.env` در `.gitignore` هستند. از `.env.example` برای مستندسازی استفاده کنید.

### 🚨 قانون ۵: Blocklist را بدون تأیید تیم حذف نکنید
`BLOCKLISTED_WRAPPERS` در `registry.ts` دارای مستندات است. `cbbqTGBP` (Mainnet) آدرس vanity مشکوک دارد.

---

## ۳. معماری و ساختار فایل

```
C:\NEW work\
├── src/
│   ├── app/
│   │   ├── page.tsx                   ← جدول Registry (صفحه اصلی)
│   │   ├── wrap/page.tsx              ← Shield/Unshield (مهم‌ترین صفحه)
│   │   ├── portfolio/page.tsx         ← پورتفولیو محرمانه با batch decrypt
│   │   ├── faucet/page.tsx            ← فاست توکن mock سپولیا
│   │   ├── analytics/page.tsx         ← داشبورد TVL و activity
│   │   ├── learn/page.tsx             ← آموزش تعاملی ۵ مرحله‌ای FHE
│   │   ├── developers/page.tsx        ← مولد کد snippet
│   │   ├── docs/page.tsx              ← مستندات developer
│   │   ├── error.tsx                  ← مرز خطای Next.js
│   │   ├── api/registry/route.ts      ← REST API عمومی
│   │   ├── ClientLayout.tsx           ← provider‌های context (theme/network)
│   │   ├── layout.tsx                 ← layout ریشه با تزریق theme SSR
│   │   └── globals.css                ← سیستم طراحی (4 تم Nordic)
│   ├── components/
│   │   ├── ui/                        ← 13 کامپوننت UI قابل استفاده مجدد
│   │   │   ├── Badge.tsx              ← ⚠️ text-transform:uppercase حذف شد (باگ fix)
│   │   │   ├── Button.tsx             ← forwardRef, variants: primary/secondary/ghost/danger
│   │   │   ├── Card.tsx               ← variants: default/glass/outlined/accent
│   │   │   ├── CopyButton.tsx         ← کپی clipboard با بازخورد چک‌مارک
│   │   │   ├── Skeleton.tsx           ← props: width, height, variant (نه style!)
│   │   │   ├── Toast.tsx              ← ToastProvider + useToast() hook
│   │   │   ├── Modal.tsx
│   │   │   ├── Tooltip.tsx            ← Portal-based, HelpCircle پیش‌فرض trigger
│   │   │   ├── TokenIcon.tsx          ← نقشه symbol→لوگو، حذف prefix "c" و suffix "Mock"
│   │   │   ├── BlurIn.tsx             ← انیمیشن blur-in
│   │   │   ├── TypingAnimation.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── TransactionSuccessModal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx             ← ۸ مسیر nav، wallet connect، network switcher
│   │   │   └── Footer.tsx
│   │   └── PendingUnshieldBanner.tsx  ← recovery برای unshield قطع‌شده
│   ├── config/
│   │   ├── contracts.ts               ← WrapperPair، KNOWN_WRAPPERS (fallback)، REGISTRY_ADDRESSES
│   │   ├── chains.ts                  ← SupportedChainId، explorer Blockscout
│   │   └── tokens.ts                  ← متادیتای نمایش توکن (لوگو، رنگ)
│   ├── lib/
│   │   ├── registry.ts                ← useRegistryPairs، isMintablePair، blocklist
│   │   ├── errors.ts                  ← classifyError با 16 کد خطا
│   │   ├── utils.ts                   ← formatAmount، parseAmount، formatAddress، cn
│   │   ├── wrapper-abi.ts             ← WRAPPER_ABI، ERC20_ABI
│   │   └── __tests__/utils.test.ts    ← 30 تست Vitest
│   └── providers/
│       └── Providers.tsx              ← Wagmi + Zama + TanStack Query (⚠️ بسیار حساس)
├── .github/workflows/ci.yml           ← TypeScript → Vitest → Build
├── .env.example                       ← همه متغیرهای محیطی اختیاری هستند
├── vitest.config.ts                   ← alias @/ → src/
├── CLAUDE.md                          ← مستندات پروژه
└── memory.md                          ← درس‌های آموخته‌شده
```

---

## ۴. چرخه SDK Zama (از دیدگاه flow)

### Shield (Wrap)
```
useShield({ tokenAddress: erc7984Address })
→ mutateAsync({ amount, onApprovalSubmitted, onShieldSubmitted })
→ اگر allowance < amount: approve ERC-20 → onApprovalSubmitted(txHash) → setTxStep(2)
→ shield tx → onShieldSubmitted(txHash) → setTxStep(4)
→ res.txHash → setTxStep(5), setDecryptRequested(false)
```

### Unshield (Unwrap) — دو مرحله‌ای
```
useUnshield(erc7984Address)  ← positional در v3.0.1
→ mutateAsync({ amount, onUnwrapSubmitted, onFinalizing, onFinalizeSubmitted })
→ unwrap tx on-chain → onUnwrapSubmitted(txHash) → setTxStep(4)
→ Gateway اثبات رمزگشایی تولید می‌کند → onFinalizing() → toast "15-40s"
→ finalize tx → onFinalizeSubmitted(txHash) → setTxStep(5)
```

### Decrypt Balance — PERMIT GATING
```
const [decryptRequested, setDecryptRequested] = useState(false)

useConfidentialBalance(
  { tokenAddress },
  { enabled: decryptRequested && !!address }
)

// ✅ درست: فقط روی کلیک صریح
<button onClick={() => setDecryptRequested(true)}>Decrypt</button>

// ❌ غلط: refetch() مستقیم enabled را bypass می‌کند!
refetchWrapperBalance()  ← هرگز در success handler نزنید

// ✅ بعد از هر tx موفق:
setDecryptRequested(false)  ← جلوگیری از refetchOnWindowFocus
```

### Batch Decrypt (Portfolio)
```
useConfidentialBalances(
  { tokenAddresses: requestedAddresses },
  { enabled: isConnected && requestedAddresses.length > 0 }
)
// یک EIP-712 permit، همه توکن‌ها را decrypt می‌کند
```

---

## ۵. الگوهای کلیدی React

### الگوی تشخیص Registry
```typescript
// useRegistryPairs محاسبه می‌کند
const isChainAligned = isConnected && chain?.id === chainId

if (isChainAligned && sdkResult.data?.items?.length > 0) → live data
else if (isChainAligned && sdkResult.isLoading) → loading + fallback
else → KNOWN_WRAPPERS fallback (isFromCache: true)
```

### الگوی جایگزینی Tooltip
```tsx
// ✅ درست: ? icon جداگانه
<Badge>Confidential</Badge>
<Tooltip content="متن کوتاه" />   {/* HelpCircle پیش‌فرض نشان می‌دهد */}

// ❌ غلط: badge به‌عنوان trigger
<Tooltip content="..."><Badge>Confidential</Badge></Tooltip>
```

### اشتباه Skeleton Props
```tsx
// ✅ درست
<Skeleton height={48} width={80} />

// ❌ غلط — Skeleton prop style ندارد!
<Skeleton style={{ height: 48, width: 80 }} />
```

### Badge — text-transform حذف شد
```css
/* ❌ قبلاً وجود داشت — باگ cZAMA → CZAMA */
.badge { text-transform: uppercase; }

/* ✅ الان — متن دقیقاً همان‌طور که هست نمایش داده می‌شود */
/* text-transform حذف شد — cZAMA همیشه cZAMA می‌ماند */
```

---

## ۶. درس‌های آموخته‌شده (از اشتباهات گذشته)

### ۶.۱ باگ Auto-Permit (بارها رخ داد)
**علت اصلی:** TanStack Query's `refetch()` از `enabled: false` bypass می‌کند.  
بعد از shield موفق، `refetchWrapperBalance()` صدا می‌زدیم → permit بدون کلیک کاربر fire می‌شد → کیف پول ۳ بار prompt می‌داد.  
**راه‌حل:** هرگز `refetchWrapperBalance()` در handler‌های موفقیت صدا نزنید. فقط `refetchPublicBalance()` و `refetchAllowance()` مجاز است.

### ۶.۲ باگ Display صفر برای توکن‌های ۱۸ دسیمال
**علت:** `formatAmount(balance, 18)` روی موجودی FHE با ۶ دسیمال → مقدار نزدیک به صفر.  
**راه‌حل:** همیشه `formatAmount(balance, 6)` برای موجودی‌های FHE confidential.

### ۶.۳ باگ Race Condition برای Token Select
**علت:** `setDecryptRequested(false)` فقط در `useEffect` → یک فریم delay → درخواست قدیمی `true` با آدرس توکن جدید trigger می‌شد.  
**راه‌حل:** reset را **synchronously** در `onChange` handler انجام دهید.

### ۶.۴ Tooltip چه‌طور باید باشد
**علت:** Tooltip کل button را wrap می‌کرد → کلیک روی Tooltip کار نمی‌کرد.  
**راه‌حل:** همیشه `<Tooltip />` بدون children (→ ? icon) را **بعد از** button/badge قرار دهید.

### ۶.۵ باگ TVL Ranking
**علت:** Sort روی raw bigint — ZAMA با ۱۸ دسیمال raw value بزرگتری از USDC با ۶ دسیمال داشت.  
**راه‌حل:** `tvlHuman` (float نرمال‌شده) را محاسبه کنید و برای sort و عرض bar استفاده کنید.

### ۶.۶ CZAMA بجای cZAMA
**علت:** `.badge { text-transform: uppercase }` در CSS.  
**راه‌حل:** `text-transform` از `.badge` حذف شد. نام‌گذاری: همیشه lowercase `c` — `cZAMA`، `cUSDC`، `cWETH`.

### ۶.۷ API Domain هاردکد
**علت:** `zamavault.xyz` مستقیم در کد نوشته شد.  
**راه‌حل:** از `process.env.NEXT_PUBLIC_APP_URL` استفاده کنید. در Vercel: Settings → Environment Variables.

### ۶.۸ useCallback در PendingUnshieldBanner
**علت:** `useCallback` با `sdk?.storage` dependency مشکل react-hooks lint داشت.  
**راه‌حل:** از plain async functions به جای `useCallback` استفاده کنید.

### ۶.۹ Unshield step indicator
**علت:** UI همیشه Approve step نشان می‌داد حتی وقتی allowance کافی بود.  
**راه‌حل:** `setTxStep(needsApproval ? 1 : 3)` — Approve step فقط وقتی `needsApproval === true` نشان داده می‌شود.

### ۶.۱۰ اسکرول CSS بدون `margin: auto`
**علت:** `maxWidth: 640` بدون `margin: '... auto 0'` → متن به چپ می‌رفت.  
**راه‌حل:** همیشه `margin: 'var(--sp-3) auto 0'` برای centered containers با max-width.

---

## ۷. قراردادها و استانداردها

### نام‌گذاری توکن‌ها
```
ERC-20 عمومی:          ZAMA، USDC، USDT، WETH، BRON، tGBP، XAUt
ERC-7984 محرمانه:      cZAMA، cUSDC، cUSDT، cWETH، cBRON، ctGBP، cXAUt
                       ↑ همیشه lowercase c
توکن‌های mock:         نمایش: "ZAMA" + badge "Mock" (نه "ZAMAMock")
```

### Tooltip
- متن کوتاه: ۱-۲ خط حداکثر
- هیچ‌وقت badge/button را به‌عنوان trigger tooltip wrap نکنید
- همیشه `<Tooltip content="..." />` standalone (→ ? icon)

### Explorer
- **Blockscout** (نه Etherscan) — چون FHE/Zama protocol decode را پشتیبانی می‌کند
- Sepolia: `https://eth-sepolia.blockscout.com`
- Mainnet: `https://eth.blockscout.com`

### Commit Messages
- هیچ اشاره‌ای به AI یا Claude
- format: `fix(scope): description`، `feat: description`

### CSS Variables
```css
--text-xs، --text-sm، --text-base، --text-lg، --text-xl، --text-2xl، --text-3xl
--sp-1 (4px)، --sp-2 (8px)، --sp-3 (12px)، --sp-4 (16px)، --sp-6 (24px)، --sp-8 (32px)
--accent، --success، --warning، --error، --info
--bg-base، --bg-surface، --bg-elevated، --bg-card
--border، --border-hover، --border-accent
--radius-sm، --radius-md، --radius-lg، --radius-xl
```

---

## ۸. SDK Zama — مرجع سریع

### نسخه و API
- **نسخه:** `@zama-fhe/react-sdk@3.0.1` — هنوز v2 TypeScript API
- Migration guide برای ۳.۱.x است — تا وقتی از `@^3.0` استفاده می‌کنیم، نیازی به migration نیست
- `WagmiSigner`، `RelayerWeb`، `indexedDBStorage` هنوز در v3.0.1 export می‌شوند

### Hook‌های مهم
| Hook | Package | نحوه فراخوانی |
|------|---------|-------------|
| `useListPairs({ page, pageSize, metadata })` | react-sdk | config object |
| `useShield({ tokenAddress })` | react-sdk | config object |
| `useUnshield(tokenAddress)` | react-sdk | positional در v3! |
| `useConfidentialBalance({ tokenAddress }, { enabled })` | react-sdk | 2 arg |
| `useConfidentialBalances({ tokenAddresses }, { enabled })` | react-sdk | 2 arg |
| `useResumeUnshield({ tokenAddress })` | react-sdk | config object |
| `useRevokeSession()` | react-sdk | no args |
| `useZamaSDK()` | react-sdk | SDK instance |
| `loadPendingUnshield(storage, addr)` | react-sdk | function |
| `clearPendingUnshield(storage, addr)` | react-sdk | function |
| `matchZamaError(err, handlers)` | @zama-fhe/sdk | function |

### کدهای خطا
`SIGNING_REJECTED`، `SIGNING_FAILED`، `ENCRYPTION_FAILED`، `DECRYPTION_FAILED`، `TRANSACTION_REVERTED`، `INVALID_KEYPAIR`، `KEYPAIR_EXPIRED`، `NO_CIPHERTEXT`، `RELAYER_REQUEST_FAILED`، `CONFIGURATION`، `INSUFFICIENT_CONFIDENTIAL_BALANCE`، `INSUFFICIENT_ERC20_BALANCE`، `BALANCE_CHECK_UNAVAILABLE`، `ERC20_READ_FAILED`، `ACL_PAUSED`، `APPROVAL_FAILED`

---

## ۹. آدرس‌های قرارداد

### WrappersRegistry
- Sepolia: `0x2f0750Bbb0A246059d80e94c454586a7F27a128e`
- Mainnet: `0xeb5015fF021DB115aCe010f23F55C2591059bBA0`

### Sepolia — ۸ pair (۷ mock + ۱ restricted)
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

### Mainnet — ۷ pair + ۱ blocklisted
| Symbol | ERC-20 | ERC-7984 | Decimals |
|--------|--------|----------|---------|
| USDC | 0xa0b8...48 | 0xe978...2B2 | 6/6 |
| USDT | 0xdAC1...c7 | 0xAe02...c50 | 6/6 |
| WETH | 0xc02a...c2 | 0xda93...893 | 18/6 |
| ZAMA | 0xA12C...A3 | 0x80CB...071 | 18/6 |
| BRON | 0xBA2C...83 | 0x85dE...bc | 18/6 |
| tGBP | 0x27f6...87 | 0xa873...DD9 | 18/6 |
| XAUt | 0x6874...38 | 0x73cc...Ef1 | 6/6 |
| cbbqTGBP | **BLOCKLISTED** | آدرس vanity مشکوک | — |

---

## ۱۰. صفحات و routing

| مسیر | فایل | توضیح |
|------|------|-------|
| `/` | `app/page.tsx` | جدول Registry با موجودی‌های live |
| `/wrap` | `app/wrap/page.tsx` | Shield/Unshield با query `?token=SYMBOL&action=wrap` |
| `/portfolio` | `app/portfolio/page.tsx` | batch decrypt، activity feed |
| `/faucet` | `app/faucet/page.tsx` | فقط Sepolia، فقط mock token‌ها |
| `/analytics` | `app/analytics/page.tsx` | TVL، ratio، activity (24h) |
| `/learn` | `app/learn/page.tsx` | ۵ مرحله تعاملی |
| `/developers` | `app/developers/page.tsx` | snippet generator |
| `/docs` | `app/docs/page.tsx` | مستندات کامل |
| `/api/registry` | `app/api/registry/route.ts` | `?chain=sepolia\|mainnet` |

**Nav items در Header (به ترتیب):**  
Registry → Wrap → Portfolio → Faucet (TESTNET) → Learn → Dev Tools → Analytics → Docs

---

## ۱۱. متغیرهای محیطی

همه اختیاری هستند — app fallback عمومی دارد:

```env
NEXT_PUBLIC_SEPOLIA_RPC=        # Alchemy یا RPC دیگر (پیش‌فرض: publicnode)
NEXT_PUBLIC_MAINNET_RPC=        # Alchemy یا RPC دیگر (پیش‌فرض: publicnode)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # اگر نبود، فقط injected wallets
NEXT_PUBLIC_APP_URL=            # URL deployment برای docs/API (مثال: https://zamavault.vercel.app)
```

**تنظیم در Vercel:** Settings → Environment Variables → Add → Deploy دوباره

---

## ۱۲. CI/CD و دستورات

```bash
# توسعه
npm run dev          # سرور dev روی localhost:3000

# بررسی کیفیت
npm test             # Vitest — 30 تست
npx tsc --noEmit     # TypeScript type-check (باید clean باشد)
npm run lint         # ESLint (advisory — برخی خطاهای pre-existing وجود دارند)

# تولید
npx next build       # باید موفق باشد
```

**GitHub Actions:** Push به `main` یا `feat/**` → TypeScript → Vitest → Next build  
ESLint advisory است (نه blocking) — برخی خطاهای pre-existing در AUDIT_REPORT.md ردیابی شده‌اند.

---

## ۱۳. الگوهای Error Handling

### در هر catch block
```typescript
} catch (err: unknown) {  // ← نه err: any
  const classified = classifyError(err);
  addToast({
    variant: classified.retryable ? 'warning' : 'error',
    title: classified.title,
    message: classified.message,
  });
}
```

### در REST API
```typescript
} catch (err) {
  // fallback به KNOWN_WRAPPERS
  return NextResponse.json({ pairs: fallback, source: 'cached-snapshot', warning: '...' })
}
```

---

## ۱۴. تم‌ها و طراحی

**۴ تم dark Nordic:**
- Charcoal (پیش‌فرض): accent `#38bdf8` (sky blue)
- Midnight: accent `#f4f4f5` (white)
- Frost: accent `#60a5fa` (ice blue)
- Aurora: accent `#2dd4bf` (teal)

**Light mode:** accent `#09090b` (black/inverse)

**فونت‌ها:**
- Sans: Plus Jakarta Sans
- Mono: JetBrains Mono

---

## ۱۵. کارهای باقی‌مانده

### کاربر باید انجام دهد
- D1: Deploy Vercel + تنظیم `NEXT_PUBLIC_APP_URL`
- D2: Mainnet Relayer API key (اختیاری، برای بهتر شدن UX)

### کارهای آینده
- Phase 2.2: npm package `@zamavault/sdk`
- Phase 5.1: README rewrite کامل
- Phase 4.4: تست mobile responsive در 360px

---

## ۱۶. URL های مهم مستندات Zama

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

*آخرین بروزرسانی: 2026-06-24 | branch: feat/dynamic-registry-finding-1*
