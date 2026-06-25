'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGsapPin } from './lib/use-gsap-pin';

/**
 * Manifesto — pinned for one viewport height.
 *
 * The paragraph reveals word-by-word as the user scrolls (no triggering by
 * IntersectionObserver — the timeline is scrubbed). When all words land,
 * a gold underline draws beneath the closing phrase.
 *
 * Lots of negative space, no buttons. Editorial.
 */
const SENTENCE =
  'Public blockchains broadcast every move you make. Zama’s fully homomorphic encryption keeps the same ledger — public, verifiable, on-chain — but renders your balance unreadable to everyone except you.';

const WORDS = SENTENCE.split(/(\s+)/);

export function Manifesto() {
  const ref = useRef<HTMLElement | null>(null);

  useGsapPin(
    ref,
    (tl) => {
      // Word reveal — opacity 0.15 → 1, staggered across the scroll
      const words = ref.current?.querySelectorAll<HTMLElement>('[data-word]') ?? [];
      gsap.set(words, { opacity: 0.18, color: '#5A5850' });
      tl.to(words, {
        opacity: 1,
        color: '#1A1814',
        stagger: { each: 0.04, ease: 'none' },
        ease: 'none',
        duration: 1,
      }, 0);

      // Underline draw at the end
      const rule = ref.current?.querySelector('[data-underline]');
      if (rule) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '>-0.1');
      }
    },
    { start: 'top top', end: '+=130%', scrub: 0.4 },
  );

  return (
    <section id="manifesto" data-section ref={ref} className="relative min-h-[100svh] flex items-center">
      <div className="v2-container max-w-4xl">
        <p className="v2-display text-[clamp(1.5rem,3.4vw,2.6rem)] leading-[1.3] text-ink-700">
          {WORDS.map((w, i) =>
            /\s+/.test(w) ? (
              <span key={i}>{w}</span>
            ) : (
              <span key={i} data-word className="inline-block">
                {w}
              </span>
            ),
          )}
        </p>
        <span
          data-underline
          className="mt-10 block h-[2px] w-40 bg-gold-500 origin-left"
        />
      </div>
    </section>
  );
}
