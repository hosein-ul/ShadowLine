'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Single Lenis instance for the entire landing.
 * Drives GSAP's ScrollTrigger so pin/scrub timelines stay in sync with the
 * smooth-scroll engine (otherwise the two fight each other).
 *
 * Respects prefers-reduced-motion — Lenis becomes a no-op and native scroll
 * is used, while GSAP still works for non-scroll-driven animations.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // Bridge Lenis → ScrollTrigger so pinned sections stay aligned.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);

    // Tell ScrollTrigger to refresh on resize.
    ScrollTrigger.refresh();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
