'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

/**
 * Landing nav — sticky glass bar on cream background.
 * Logo left, anchor links center, GitHub + Launch CTA right.
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[rgba(248,245,240,0.82)] border-b border-ink-950/[0.07]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 grid place-items-center rounded-lg bg-gold-500 text-ink-950 font-bold transition-transform group-hover:scale-105">
            Z
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-ink-900">
            Zama<span className="text-gold-600">Vault</span>
          </span>
        </Link>

        {/* Center anchor links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-500">
          <a href="#features" className="hover:text-ink-900 transition-colors">Features</a>
          <a href="#how" className="hover:text-ink-900 transition-colors">How it works</a>
          <a href="#privacy" className="hover:text-ink-900 transition-colors">Privacy</a>
          <Link href="/app/docs" className="hover:text-ink-900 transition-colors">Docs</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/hosein-ul/zamavault"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-400 hover:text-ink-900 hover:bg-ink-950/[0.04] transition-colors"
            aria-label="GitHub repository"
          >
            <SiGithub className="h-4 w-4" />
          </a>
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-gold-500 text-ink-950 text-sm font-semibold hover:bg-gold-400 transition-colors"
          >
            Launch app
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
