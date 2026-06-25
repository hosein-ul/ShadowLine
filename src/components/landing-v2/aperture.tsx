'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

/**
 * Aperture — the first viewport.
 *
 * A single gold dot fades in, blooms into a soft halo, then the headline
 * resolves around it. Two lines, serif display: "Visible to the world."
 * crossfades to "Encrypted for you." Quiet, deliberate, no CTAs.
 *
 * A tiny "Scroll" hint sits at the bottom.
 */
export function Aperture() {
  return (
    <section id="aperture" data-section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="v2-container relative text-center flex flex-col items-center">

        {/* Gold dot → halo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12"
        >
          <div className="h-3 w-3 rounded-full bg-gold-500" style={{ animation: 'v2-pulse-dot 3s ease-in-out infinite' }} />
          <div
            aria-hidden
            className="absolute inset-0 -m-12 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,210,8,0.35) 0%, transparent 60%)',
              filter: 'blur(16px)',
            }}
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="v2-eyebrow mb-6"
        >
          Fully Homomorphic Encryption · ERC-7984
        </motion.p>

        {/* Headline — two lines, the second swaps in */}
        <h1 className="v2-display text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.02] text-ink-900 max-w-5xl">
          <motion.span
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            Your balance was always public.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
            transition={{ duration: 0.9, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="block italic text-gold-700"
          >
            Now it isn’t.
          </motion.span>
        </h1>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="mt-10 max-w-md text-ink-400 text-base leading-relaxed"
        >
          The canonical interface for the Zama Confidential Wrappers Registry.
        </motion.p>

        {/* Lone link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.7 }}
          className="mt-10"
        >
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 text-ink-900 text-[13px] font-semibold border-b border-ink-900/30 hover:border-gold-500 transition-colors pb-1"
          >
            Enter the vault
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-400"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <span className="block h-8 w-px bg-ink-400/40" />
        </motion.div>
      </div>
    </section>
  );
}
