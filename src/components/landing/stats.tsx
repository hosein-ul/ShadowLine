'use client';

import { NumberTicker } from '@/components/magic/number-ticker';
import { BlurFade } from '@/components/magic/blur-fade';

const STATS = [
  { value: 15,  label: 'Confidential pairs registered', suffix: '' },
  { value: 2,   label: 'Networks supported',             suffix: '' },
  { value: 6,   label: 'Decimals · always · for FHE',   suffix: '' },
  { value: 100, label: 'On-chain, on-the-fly decrypt',   suffix: '%' },
];

export function Stats() {
  return (
    <section className="relative border-b border-ink-950/[0.07] bg-cream-200 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-ink-950/[0.07] bg-ink-950/[0.04]">
          {STATS.map((s, i) => (
            <BlurFade key={s.label} delay={i * 0.08} inView>
              <div className="bg-cream-100 px-6 py-10 h-full text-center md:text-left">
                <div className="font-display text-4xl md:text-5xl font-bold tracking-tight text-gold-600 tabular-nums">
                  <NumberTicker
                    value={s.value}
                    className="text-gold-600 tabular-nums whitespace-pre"
                  />
                  {s.suffix && <span>{s.suffix}</span>}
                </div>
                <p className="mt-3 text-sm text-ink-400 leading-snug max-w-[16ch] mx-auto md:mx-0">
                  {s.label}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
