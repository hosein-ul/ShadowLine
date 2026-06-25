'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

/**
 * Editorial nav — fine-weight type, lots of space.
 * Wordmark left, three anchor links centre, Launch right.
 */
export function NavV2() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-cream-100/75 border-b border-ink-900/[0.06]">
      <div className="v2-container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-1.5 group">
          <span className="v2-display text-xl text-ink-900 tracking-tight">Zama</span>
          <span className="v2-display text-xl text-gold-700 italic tracking-tight">Vault</span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-[13px] text-ink-700 font-sans">
          <a href="#problem"  className="hover:text-ink-900 transition-colors">Why</a>
          <a href="#solution" className="hover:text-ink-900 transition-colors">How</a>
          <a href="#flow"     className="hover:text-ink-900 transition-colors">Flow</a>
          <a href="#devs"     className="hover:text-ink-900 transition-colors">Build</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/hosein-ul/zamavault"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:text-ink-900 hover:bg-ink-900/[0.04] transition-colors"
            aria-label="GitHub"
          >
            <SiGithub className="h-4 w-4" />
          </a>
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink-900 text-cream-100 text-[13px] font-semibold hover:bg-ink-700 transition-colors"
          >
            Launch
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
