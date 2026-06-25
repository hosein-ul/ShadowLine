'use client';

import { useEffect, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface UseGsapPinOptions {
  /** Scrub the timeline to scroll position. true = 1-frame smoothing. */
  scrub?: boolean | number;
  /** Where the pin starts in ScrollTrigger format, e.g. "top top" */
  start?: string;
  /** Where the pin ends, e.g. "+=100%" or "bottom top" */
  end?: string;
  /** Anchor the pin to a different element than the trigger */
  pinSpacing?: boolean;
}

/**
 * Tiny typed wrapper around gsap.context + ScrollTrigger.
 *
 * - Cleans up automatically on unmount (revert + kill triggers).
 * - Respects prefers-reduced-motion: skips the timeline entirely.
 * - Returns nothing; the caller passes a `buildTimeline` callback that
 *   receives the bound gsap instance and a ScrollTrigger config object.
 */
export function useGsapPin(
  sectionRef: RefObject<HTMLElement | null>,
  buildTimeline: (timeline: gsap.core.Timeline) => void,
  options: UseGsapPinOptions = {},
) {
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top top',
          end: options.end ?? '+=100%',
          scrub: options.scrub ?? true,
          pin: true,
          pinSpacing: options.pinSpacing ?? true,
          anticipatePin: 1,
        },
      });
      buildTimeline(tl);
    }, sectionRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
