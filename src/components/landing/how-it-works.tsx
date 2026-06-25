'use client';

import { BlurFade } from '@/components/magic/blur-fade';
import { TextAnimate } from '@/components/magic/text-animate';

const STEPS = [
  {
    n: '01',
    title: 'Discover',
    body: 'Browse every registered ERC-20 ↔ ERC-7984 pair pulled live from the on-chain WrappersRegistry.',
  },
  {
    n: '02',
    title: 'Shield',
    body: 'Approve once, wrap your tokens. The SDK auto-handles allowance, scaling, and the shield transaction.',
  },
  {
    n: '03',
    title: 'Decrypt',
    body: 'Sign a single EIP-712 permit — your balance decrypts client-side. Nothing is stored on-chain in cleartext.',
  },
  {
    n: '04',
    title: 'Unshield',
    body: 'Burn the encrypted balance, wait for the gateway proof, receive the underlying ERC-20 back in your wallet.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative border-b border-ink-950/[0.07] bg-cream-200 py-24 md:py-32"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <BlurFade inView>
          <div className="max-w-3xl mb-16 md:mb-20">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600 mb-3">
              ─ Four steps. That&apos;s it.
            </p>
            <TextAnimate animation="slideUp" by="word" once as="h2" className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink-950">
              From public balance to private, and back, in under a minute.
            </TextAnimate>
          </div>
        </BlurFade>

        <ol className="relative space-y-12 md:space-y-16 pl-8 md:pl-0">
          <span
            aria-hidden
            className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-gold-500/40 via-ink-950/[0.10] to-transparent md:hidden"
          />

          {STEPS.map((s, i) => (
            <BlurFade key={s.n} delay={i * 0.06} inView>
              <li className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start group">
                <div className="md:col-span-3 flex items-baseline gap-3">
                  <span className="absolute -left-1 md:relative md:left-auto h-7 w-7 rounded-full bg-gold-500 text-ink-950 grid place-items-center text-[10px] font-bold flex-shrink-0">
                    ●
                  </span>
                  <span className="font-mono text-3xl md:text-5xl text-gold-500/80 font-bold tabular-nums tracking-tighter">
                    {s.n}
                  </span>
                </div>
                <div className="md:col-span-9">
                  <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-ink-400 leading-relaxed max-w-2xl font-sans">
                    {s.body}
                  </p>
                </div>
              </li>
            </BlurFade>
          ))}
        </ol>
      </div>
    </section>
  );
}
