'use client';

import Link from 'next/link';
import {
  Search,
  Shield,
  Wallet,
  Droplets,
  Code2,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';
import { BlurFade } from '@/components/magic/blur-fade';
import { BorderBeam } from '@/components/magic/border-beam';
import { MagicCard } from '@/components/magic/magic-card';
import { TypingAnimation } from '@/components/magic/typing-animation';
import { cn } from '@/lib/utils';

interface CardDef {
  title: string;
  desc: string;
  icon: React.ElementType;
  href: string;
  span: string;
  accent?: boolean;
}

const CARDS: CardDef[] = [
  {
    title: 'Live registry, every pair',
    desc: 'Every confidential wrapper as the on-chain WrappersRegistry sees it — Sepolia and Mainnet, in real time.',
    icon: Search,
    href: '/app',
    span: 'md:col-span-1',
    accent: true,
  },
  {
    title: 'Shield in two clicks',
    desc: 'Approve and wrap any ERC-20 into its ERC-7984 form. Decimal scaling handled automatically.',
    icon: Shield,
    href: '/app/wrap',
    span: 'md:col-span-1',
  },
  {
    title: 'Confidential portfolio',
    desc: 'Decrypt all your balances in one EIP-712 permit. Re-shield, unshield, withdraw.',
    icon: Wallet,
    href: '/app/portfolio',
    span: 'md:col-span-1',
  },
  {
    title: 'Testnet faucet',
    desc: 'Mint mock USDC, WETH, ZAMA & more on Sepolia — wired to the official Zama mocks.',
    icon: Droplets,
    href: '/app/faucet',
    span: 'md:col-span-1',
  },
  {
    title: 'REST + code snippets',
    desc: 'Public /api/registry endpoint and copy-paste React / viem / ethers snippets.',
    icon: Code2,
    href: '/app/developers',
    span: 'md:col-span-1',
  },
  {
    title: 'Protocol analytics',
    desc: 'TVL by token, 24-hour shield/unshield volume, ranking — pulled straight from on-chain events.',
    icon: BarChart3,
    href: '/app/analytics',
    span: 'md:col-span-1',
  },
];

function FeatureCard({ card, idx }: { card: CardDef; idx: number }) {
  const Icon = card.icon;
  return (
    <BlurFade delay={0.05 + idx * 0.04} inView className={card.span}>
      <Link href={card.href} className="h-full block group">
        <MagicCard
          mode="orb"
          glowFrom="#ffd208"
          glowTo="#c9a400"
          glowOpacity={0.45}
          glowSize={260}
          glowBlur={50}
          className={cn(
            'h-full rounded-2xl',
            card.accent ? 'border-gold-500/30' : 'border-ink-950/[0.07]',
          )}
        >
          <div className="relative flex h-full flex-col justify-between p-6">
            {card.accent && (
              <BorderBeam size={140} duration={9} colorFrom="#ffd208" colorTo="#a87a00" />
            )}

            <div className="relative">
              <div
                className={cn(
                  'inline-grid h-10 w-10 place-items-center rounded-lg border',
                  card.accent
                    ? 'border-gold-500/30 bg-gold-500/10 text-gold-600'
                    : 'border-ink-950/[0.08] bg-ink-950/[0.03] text-ink-500',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-ink-400 leading-relaxed">
                {card.desc}
              </p>
            </div>

            <div
              className={cn(
                'relative mt-5 inline-flex items-center gap-1 text-sm font-semibold',
                card.accent ? 'text-gold-600' : 'text-ink-500',
              )}
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </MagicCard>
      </Link>
    </BlurFade>
  );
}

export function Features() {
  return (
    <section id="features" className="relative border-b border-ink-950/[0.07] bg-cream-100 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <BlurFade inView>
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600 mb-3">
              ─ Built for the registry
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink-950">
              Everything you need to{' '}
              <TypingAnimation
                words={['shield', 'decrypt', 'audit', 'build']}
                loop
                className="font-display text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 bg-clip-text text-transparent"
                showCursor
                cursorStyle="line"
              />
            </h2>
            <p className="mt-5 text-ink-400 max-w-xl leading-relaxed font-sans">
              Six tools, one consistent design. Whether you&apos;re shielding a balance,
              auditing a wrapper, or shipping a confidential dApp — start here.
            </p>
          </div>
        </BlurFade>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 auto-rows-[14rem]">
          {CARDS.map((c, i) => (
            <FeatureCard key={c.title} card={c} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
