'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Shield, Eye, Unlock, Droplets, BarChart3, Code2, ArrowUpRight } from 'lucide-react';

/**
 * Capabilities — six tiles, three columns, two rows.
 *
 * No bento sprawl, no orb glows, no row-spans. Each card is a small
 * editorial unit: number, icon, label, body, link. Hover lifts only
 * the gold underline; the card itself stays still.
 */
interface Cap {
  n: string;
  icon: React.ElementType;
  title: string;
  body: string;
  href: string;
}
const CAPS: Cap[] = [
  { n: '01', icon: Shield,    title: 'Shield',     body: 'Wrap any registered ERC-20 into its ERC-7984 form in one or two transactions.', href: '/app/wrap' },
  { n: '02', icon: Eye,       title: 'Decrypt',    body: 'View any balance with one EIP-712 signature. Off-chain, gas-free, scoped to your wallet.', href: '/app/portfolio' },
  { n: '03', icon: Unlock,    title: 'Unshield',   body: 'Burn the wrapper, wait for the Zama Gateway proof, receive the underlying back.', href: '/app/wrap' },
  { n: '04', icon: BarChart3, title: 'Analytics',  body: 'TVS by token, 24-hour shield/unshield activity — straight from on-chain events.', href: '/app/analytics' },
  { n: '05', icon: Droplets,  title: 'Faucet',     body: 'Mint mock USDC, USDT, WETH, ZAMA and more on Sepolia — wired to the official mocks.', href: '/app/faucet' },
  { n: '06', icon: Code2,     title: 'REST + snippets', body: 'Public /api/registry endpoint plus copy-paste React, viem, and ethers snippets.', href: '/app/developers' },
];

export function Capabilities() {
  return (
    <section id="capabilities" data-section className="v2-section">
      <div className="v2-container">

        <div className="max-w-3xl mb-16">
          <p className="v2-eyebrow mb-4">Six tools, one design</p>
          <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900">
            Everything around{' '}
            <span className="italic text-gold-700">ERC-7984</span>, one tab away.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-ink-900/[0.08] divide-y md:divide-y-0 md:divide-x divide-ink-900/[0.08]">
          {CAPS.map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={`relative p-8 md:p-10 group ${i >= 3 ? 'md:border-t md:border-ink-900/[0.08]' : ''}`}
            >
              <Link href={c.href} className="block">
                <div className="flex items-start justify-between mb-6">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-gold-700">{c.n}</span>
                  <c.icon className="h-4 w-4 text-ink-400" />
                </div>
                <h3 className="v2-display text-2xl text-ink-900 mb-3 tracking-tight">
                  {c.title}
                </h3>
                <p className="text-sm text-ink-400 leading-relaxed">
                  {c.body}
                </p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
                  <span className="border-b border-ink-900/30 group-hover:border-gold-500 pb-0.5 transition-colors">
                    Open
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
