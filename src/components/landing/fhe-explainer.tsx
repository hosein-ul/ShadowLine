'use client';

import { BlurFade } from '@/components/magic/blur-fade';
import { DotPattern } from '@/components/magic/dot-pattern';
import { TextAnimate } from '@/components/magic/text-animate';
import { Lock, Eye, KeyRound, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

const POINTS = [
  {
    icon: Lock,
    title: 'Encrypted on-chain',
    body: 'Balances stored as euint64 ciphertext. Public block explorers cannot read them.',
  },
  {
    icon: KeyRound,
    title: 'You hold the key',
    body: 'Decryption requires a wallet-signed EIP-712 permit. No custody, no central decryptor.',
  },
  {
    icon: Cpu,
    title: 'Computed homomorphically',
    body: 'Transfers, allowances, comparisons — all execute on ciphertext via fhEVM.',
  },
  {
    icon: Eye,
    title: 'Auditable when needed',
    body: 'Selectively reveal balances per session, per contract, or grant scoped read access.',
  },
];

export function FheExplainer() {
  return (
    <section
      id="privacy"
      className="section-dark relative border-b border-white/[0.06] bg-ink-950 py-24 md:py-32 overflow-hidden"
    >
      <DotPattern
        glow
        className={cn(
          '[mask-image:radial-gradient(800px_circle_at_50%_50%,white,transparent)]',
          'opacity-25',
        )}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid md:grid-cols-2 gap-16 md:gap-24 items-start">
        <BlurFade inView>
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold-500 mb-3">
            ─ Privacy, not pseudonymity
          </p>
          <TextAnimate animation="blurInUp" by="word" once as="h2" className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.05] text-ink-50">
            Real on-chain confidentiality.
          </TextAnimate>
          <p className="mt-6 text-ink-100/70 leading-relaxed max-w-md font-sans">
            Public chains expose every balance and transfer to anyone watching. Zama&apos;s
            Fully Homomorphic Encryption (FHE) protocol changes that — balances live
            on-chain, but only you can read them.
          </p>
          <p className="mt-4 text-ink-100/70 leading-relaxed max-w-md font-sans">
            ZamaVault wraps every official ERC-7984 token into a clean UX:
            shield, transfer, decrypt, unshield. No node operator, no validator,
            no block-explorer crawler sees your balance.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POINTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <BlurFade key={p.title} delay={0.08 + i * 0.06} inView>
                <div className="h-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-gold-500/20 transition-colors duration-200">
                  <div className="inline-grid h-9 w-9 place-items-center rounded-md border border-gold-500/20 bg-gold-500/[0.08] text-gold-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-ink-50">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-ink-100/60 leading-relaxed font-sans">
                    {p.body}
                  </p>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
