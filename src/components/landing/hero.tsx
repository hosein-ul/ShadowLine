'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { BlurFade } from '@/components/magic/blur-fade';
import { TextAnimate } from '@/components/magic/text-animate';
import { AuroraBg } from './aurora-bg';

/**
 * Hero — cream background, gold aurora, smooth word-by-word reveal.
 *
 * Each headline line uses a single <TextAnimate> at default Magic UI timing
 * (animation="blurInUp" by="word" once). No custom duration overrides — the
 * library's defaults are tuned and the spacing-out is done purely with `delay`.
 * Whole headline finishes in ~1.2s; CTAs/subhead follow with BlurFade.
 *
 * The entire hero is wrapped in a motion.div that fades from 0.95 → 1 so even
 * on a slow device with delayed JS the content is readable instantly.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink-950/[0.07] bg-cream-100">
      <AuroraBg />

      <motion.div
        initial={{ opacity: 0.001 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-28 lg:pt-36 lg:pb-44"
      >
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Eyebrow */}
          <BlurFade delay={0.05} inView>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/[0.08] px-4 py-1.5 text-xs font-semibold text-gold-700 tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
              Fully Homomorphic Encryption · ERC-7984 · Live on Mainnet
            </div>
          </BlurFade>

          {/* Headline — three lines, each a single TextAnimate at default timing */}
          <h1 className="mt-8 font-display leading-[1.08] tracking-tight text-5xl sm:text-6xl lg:text-[4.5rem] font-bold">
            <TextAnimate
              animation="blurInUp"
              by="word"
              once
              as="span"
              delay={0.1}
              className="block text-ink-950"
            >
              Your balance, invisible
            </TextAnimate>
            <TextAnimate
              animation="blurInUp"
              by="word"
              once
              as="span"
              delay={0.35}
              className="block text-ink-950"
            >
              to the world.
            </TextAnimate>
            <TextAnimate
              animation="blurInUp"
              by="word"
              once
              as="span"
              delay={0.6}
              className="block bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 bg-clip-text text-transparent"
            >
              Visible only to you.
            </TextAnimate>
          </h1>

          {/* Subhead */}
          <BlurFade delay={0.95} inView>
            <p className="mt-7 max-w-2xl text-base sm:text-lg text-ink-400 leading-relaxed font-sans">
              ZamaVault is the canonical interface for the Zama Confidential Wrappers Registry.
              Browse every ERC-20 ↔ ERC-7984 token pair across Ethereum and Sepolia, shield your
              balance, and decrypt with a single EIP-712 signature — only you can read it.
            </p>
          </BlurFade>

          {/* CTAs */}
          <BlurFade delay={1.1} inView>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/app"
                className="group relative inline-flex items-center gap-2 h-12 px-7 rounded-md bg-gold-500 text-ink-950 text-sm font-semibold tracking-tight hover:bg-gold-400 transition-all duration-200 hover:shadow-[0_0_40px_-5px_rgba(255,210,8,0.45)]"
              >
                Launch ZamaVault
                <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                href="/app/learn"
                className="group inline-flex items-center gap-2 h-12 px-6 rounded-md border border-ink-950/[0.12] bg-white/60 text-ink-700 text-sm font-semibold hover:bg-white hover:border-ink-950/[0.20] transition-colors duration-200"
              >
                <BookOpen className="h-4 w-4" />
                Learn in 5 minutes
              </Link>
            </div>
          </BlurFade>

          {/* Trust strip */}
          <BlurFade delay={1.25} inView>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-400 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live on Sepolia &amp; Ethereum mainnet
              </div>
              <span className="hidden sm:inline text-ink-300">·</span>
              <span>Open source · MIT licensed</span>
              <span className="hidden sm:inline text-ink-300">·</span>
              <span>No custody · No tracking</span>
            </div>
          </BlurFade>
        </div>
      </motion.div>
    </section>
  );
}
