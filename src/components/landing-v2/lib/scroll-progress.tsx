'use client';

import { useEffect, useState } from 'react';

/**
 * Right-edge scroll rail.
 *
 * A 2px-wide gold line pinned to the right viewport edge with a circular
 * indicator that scrubs vertically with scroll progress. Plus a short label
 * showing the current section's title (driven by intersection of [data-section]
 * elements).
 */
const SECTIONS: { id: string; label: string }[] = [
  { id: 'aperture',    label: 'Aperture' },
  { id: 'manifesto',   label: 'Manifesto' },
  { id: 'problem',     label: 'Problem' },
  { id: 'solution',    label: 'Solution' },
  { id: 'tokens',      label: 'Tokens' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'numbers',     label: 'Numbers' },
  { id: 'flow',        label: 'How it works' },
  { id: 'devs',        label: 'Developers' },
  { id: 'final',       label: 'Begin' },
];

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState('aperture');

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const ratio = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      setProgress(Math.min(1, Math.max(0, ratio)));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the section with the largest visible area
        let best: { id: string; area: number } | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const area = entry.intersectionRect.height;
            if (!best || area > best.area) {
              best = { id: entry.target.id, area };
            }
          }
        }
        if (best) setActive(best.id);
      },
      { threshold: [0.15, 0.5, 0.85] },
    );
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    els.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? '';

  return (
    <div
      aria-hidden
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3 pointer-events-none"
    >
      <div className="relative h-[40vh] w-[2px] bg-ink-900/[0.08] overflow-hidden rounded-full">
        <div
          className="absolute inset-x-0 top-0 bg-gold-500 origin-top"
          style={{ height: '100%', transform: `scaleY(${progress})` }}
        />
        <div
          className="absolute -right-[6px] h-3.5 w-3.5 rounded-full bg-gold-500 border-2 border-cream-100 shadow-[0_0_0_2px_rgba(255,210,8,0.25)]"
          style={{ top: `calc(${progress * 100}% - 7px)`, transition: 'top 0.18s var(--ease-out-quart, ease-out)' }}
        />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-700 bg-cream-100/80 backdrop-blur px-2 py-1 rounded-md border border-ink-900/[0.06]">
        {activeLabel}
      </div>
    </div>
  );
}
