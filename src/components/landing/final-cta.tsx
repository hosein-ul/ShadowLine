'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import { BlurFade } from '@/components/magic/blur-fade';
import { ShimmerButton } from '@/components/magic/shimmer-button';

/**
 * Final CTA — short, declarative, one primary action.
 * Sits inside a contained "card" with a faint gold edge to draw the eye
 * without making the whole page feel like an ad.
 */
export function FinalCta() {
  return (
    <section className="section-dark relative bg-ink-950 py-24 md:py-32 border-b border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <BlurFade inView>
          <div className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-ink-900 to-ink-800 px-8 py-16 md:px-16 md:py-24 text-center">
            {/* Subtle gold halo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-1/2 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #ffd208 0%, transparent 70%)' }}
            />

            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                Your tokens.
                <br />
                <span className="bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 bg-clip-text text-transparent">
                  Your privacy.
                </span>
              </h2>
              <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-ink-100/70 leading-relaxed">
                Stop leaking your portfolio to every block-explorer indexer.
                Shield, transact, decrypt — all from one clean interface.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app" aria-label="Launch ZamaVault app">
                  <ShimmerButton
                    background="#ffd208"
                    shimmerColor="#fff8d4"
                    className="text-ink-950 font-semibold text-sm h-12 px-7"
                  >
                    <span className="inline-flex items-center gap-2">
                      Launch ZamaVault
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </ShimmerButton>
                </Link>
                <a
                  href="https://github.com/hosein-ul/zamavault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/[0.10] bg-white/[0.03] text-ink-50 text-sm font-semibold hover:bg-white/[0.06] transition-colors"
                >
                  <SiGithub className="h-4 w-4" />
                  Star on GitHub
                </a>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
