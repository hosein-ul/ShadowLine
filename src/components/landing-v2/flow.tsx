'use client';

import { useEffect, useRef } from 'react';

/**
 * Flow — vertical timeline.
 *
 * A gold rail down the left edge fills as the section enters and is scrolled
 * through. Four steps with descriptive copy on the right.
 *
 * Uses native IntersectionObserver to compute the scrubbed fill — keeps GSAP
 * usage focused on the actual pin/morph sections.
 */
const STEPS = [
  { n: '01', title: 'Discover', body: 'Browse every registered ERC-20 ↔ ERC-7984 pair pulled live from the on-chain WrappersRegistry. Sepolia and Mainnet, real time.' },
  { n: '02', title: 'Shield',   body: 'Approve once (or skip if allowance is already sufficient), then wrap your tokens into encrypted ERC-7984 form.' },
  { n: '03', title: 'Decrypt',  body: 'Sign a single EIP-712 permit and your balance decrypts client-side. Off-chain, gas-free, scoped to your wallet only.' },
  { n: '04', title: 'Unshield', body: 'Burn the encrypted balance, wait for the Zama Gateway proof, receive the underlying ERC-20 back in your wallet.' },
];

export function Flow() {
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current;
      const fill = fillRef.current;
      const rail = railRef.current;
      if (!section || !fill || !rail) return;

      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      // Begin filling when section top hits 70% of viewport, complete when bottom hits 40%.
      const start = viewH * 0.7;
      const end = -rect.height + viewH * 0.4;
      const raw = (start - rect.top) / (start - end);
      const p = Math.max(0, Math.min(1, raw));
      fill.style.transform = `scaleY(${p})`;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section id="flow" data-section ref={sectionRef} className="v2-section">
      <div className="v2-container">

        <div className="max-w-2xl mb-20">
          <p className="v2-eyebrow mb-4">From public to private — and back</p>
          <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900">
            Four steps. Under a minute.
          </h2>
        </div>

        <div className="relative grid md:grid-cols-12 gap-10 md:gap-16">

          {/* Left rail */}
          <div className="hidden md:block md:col-span-1 relative">
            <div ref={railRef} className="absolute left-3 top-0 bottom-0 w-px bg-ink-900/[0.08]">
              <div
                ref={fillRef}
                className="absolute inset-0 bg-gold-500 origin-top"
                style={{ transform: 'scaleY(0)', transition: 'transform 60ms linear' }}
              />
            </div>
          </div>

          {/* Steps */}
          <ol className="md:col-span-11 space-y-16 md:space-y-20">
            {STEPS.map((s) => (
              <li key={s.n} className="grid md:grid-cols-12 gap-6 md:gap-10 items-start">
                <div className="md:col-span-3 flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-gold-700">
                    Step {s.n}
                  </span>
                </div>
                <div className="md:col-span-9 max-w-2xl">
                  <h3 className="v2-display text-3xl md:text-4xl text-ink-900 leading-tight">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-ink-700 leading-relaxed text-[15px]">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
