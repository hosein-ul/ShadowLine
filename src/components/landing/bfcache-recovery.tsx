'use client';

import { useEffect } from 'react';

/**
 * BFCache recovery.
 *
 * Symptom: returning to the landing via the browser back-button (after
 * visiting an external link with target="_blank" + then navigating, or a
 * normal back from an internal link) leaves the page nearly blank.
 *
 * Cause: every section is wrapped in <BlurFade> which mounts with
 * initial="hidden" (opacity:0 + blur). Visibility is triggered by an
 * IntersectionObserver inside `useInView({ once: true })`. When the browser
 * restores the page from the back-forward cache the DOM is hot but JS does
 * NOT re-execute, so the observer never re-fires and every wrapped node
 * stays at opacity:0.
 *
 * Fix: listen for `pageshow` with `event.persisted === true` (the canonical
 * BFCache signal) and force a clean reload. Trade-off is one extra request
 * on back-navigation, which is acceptable for a static page.
 */
export function BFCacheRecovery() {
  useEffect(() => {
    const handler = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', handler);
    return () => window.removeEventListener('pageshow', handler);
  }, []);
  return null;
}
