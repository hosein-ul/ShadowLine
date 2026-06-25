'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { motion } from 'motion/react';

/**
 * Final beat — the only dark section in the whole landing.
 * Aubergine background (warm dark, not black). Big serif sentence,
 * gold CTA, secondary GitHub link.
 */
export function FinalBeat() {
  return (
    <section
      id="final"
      data-section
      className="section-dark relative bg-aubergine py-32 md:py-44 overflow-hidden"
      style={{ backgroundColor: 'var(--color-aubergine)' }}
    >
      {/* Faint gold halo top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 -right-1/4 h-[60vh] w-[60vh] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,210,8,0.18) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="v2-container relative text-center max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="v2-display text-[clamp(2.4rem,6vw,5rem)] leading-[1.05] text-cream-50"
        >
          Your tokens.
          <br />
          Your privacy.{' '}
          <span className="italic text-gold-500">On-chain.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 h-12 px-7 rounded-full bg-gold-500 text-ink-900 text-sm font-semibold tracking-tight hover:bg-gold-300 transition-colors"
          >
            Launch ZamaVault
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href="https://github.com/hosein-ul/zamavault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-cream-50/15 bg-white/[0.03] text-cream-50 text-sm font-semibold hover:bg-white/[0.06] transition-colors"
          >
            <SiGithub className="h-4 w-4" />
            View source
          </a>
        </motion.div>
      </div>
    </section>
  );
}
