'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

/**
 * Numbers — large editorial figures.
 *
 * Four counts tick from 0 → target when the section enters the viewport.
 * Display-sized typography — these are the page's loudest moment.
 */
const STATS = [
  { label: 'Confidential pairs',     value: 15, suffix: '+' },
  { label: 'Networks',               value: 2,  suffix: '' },
  { label: 'Decimals · for FHE',     value: 6,  suffix: '' },
  { label: 'Decrypts off-chain',     value: 100, suffix: '%' },
];

function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startAt = performance.now();
    const duration = 1100;
    let frame = 0;
    function step(now: number) {
      const p = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      setVal(Math.round(eased * target));
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return <span ref={ref}>{val}</span>;
}

export function Numbers() {
  return (
    <section id="numbers" data-section className="v2-section bg-cream-200/50">
      <div className="v2-container">

        <div className="max-w-2xl mb-16">
          <p className="v2-eyebrow mb-4">By the count</p>
          <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900">
            Real numbers, on-chain.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-ink-900/[0.08] border-y border-ink-900/[0.08]">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="px-6 py-10 md:py-14"
            >
              <div className="v2-display text-[clamp(3rem,6vw,5rem)] leading-none text-gold-700 tabular-nums">
                <Counter target={s.value} />
                <span>{s.suffix}</span>
              </div>
              <div className="mt-4 text-[13px] text-ink-700 font-medium tracking-tight">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
