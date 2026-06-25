'use client';

import { motion } from 'motion/react';

/**
 * Problem — a mock public ledger.
 *
 * Two-column split: left shows transparent transfers (addresses + amounts),
 * right shows what an observer can derive (cluster, total, behaviour).
 * Plain text, monospace, deliberately ugly to make the point.
 *
 * Not scroll-pinned — that's reserved for the Solution beat which scrambles
 * these very rows letter-by-letter.
 */
const ROWS: { hash: string; from: string; to: string; value: string; token: string }[] = [
  { hash: '0xa3d2…',  from: '0x9b…fff',  to: '0x7c…639',  value: '1,240.00',  token: 'USDC' },
  { hash: '0xd11e…',  from: '0x9b…fff',  to: '0xfa…412',  value: '300.00',    token: 'USDC' },
  { hash: '0x55a0…',  from: '0xfa…412',  to: '0x71…a12',  value: '290.00',    token: 'USDC' },
  { hash: '0x9f3c…',  from: '0x9b…fff',  to: '0x7c…639',  value: '11.500',    token: 'WETH' },
  { hash: '0x4b81…',  from: '0x71…a12',  to: '0x9b…fff',  value: '850.00',    token: 'USDC' },
];

export function ProblemLedger() {
  return (
    <section id="problem" data-section className="v2-section">
      <div className="v2-container">

        <div className="grid md:grid-cols-12 gap-10 md:gap-16">

          {/* Left — the ledger */}
          <div className="md:col-span-7">
            <p className="v2-eyebrow mb-4">A typical block</p>
            <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900 max-w-xl">
              What the chain shows the world.
            </h2>

            <div className="mt-10 border-y border-ink-900/[0.08] divide-y divide-ink-900/[0.06]">
              {ROWS.map((r, i) => (
                <motion.div
                  key={r.hash}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-12 gap-3 py-3 font-mono text-[12px] text-ink-700"
                >
                  <span className="col-span-2 text-ink-400">{r.hash}</span>
                  <span className="col-span-3 truncate">{r.from}</span>
                  <span className="col-span-1 text-ink-400">→</span>
                  <span className="col-span-3 truncate">{r.to}</span>
                  <span className="col-span-2 text-right font-semibold text-ink-900">{r.value}</span>
                  <span className="col-span-1 text-right text-gold-700">{r.token}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — derived intelligence */}
          <div className="md:col-span-5">
            <div className="md:sticky md:top-28 space-y-6">
              <p className="v2-eyebrow">An observer can derive</p>

              <Derived label="Wallet 0x9b…fff total held" value="$24,890" hint="across 4 tokens" />
              <Derived label="Most active counterparty"   value="0x7c…639" hint="3 transfers in 2 days" />
              <Derived label="Largest single transfer"    value="1,240 USDC" hint="visible to every indexer" />
              <Derived label="Probable cluster"           value="3 linked addresses" hint="via shared funding source" />

              <p className="pt-4 text-sm text-ink-400 leading-relaxed max-w-xs">
                Every wallet, balance, and counterparty is one block-explorer
                query away — for anyone. Always.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Derived({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-l-2 border-ink-900/15 pl-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400 mb-1">
        {label}
      </div>
      <div className="font-display text-2xl text-ink-900 leading-tight">{value}</div>
      <div className="text-xs text-ink-400 mt-0.5">{hint}</div>
    </div>
  );
}
