import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

const COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'App',
    links: [
      { label: 'Registry',   href: '/app' },
      { label: 'Wrap',       href: '/app/wrap' },
      { label: 'Portfolio',  href: '/app/portfolio' },
      { label: 'Analytics',  href: '/app/analytics' },
      { label: 'Faucet',     href: '/app/faucet' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation',  href: '/app/docs' },
      { label: 'Code snippets',  href: '/app/developers' },
      { label: 'REST API',       href: '/api/registry?chain=sepolia' },
      { label: 'GitHub',         href: 'https://github.com/hosein-ul/zamavault', external: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Tutorial — 5-min',    href: '/app/learn' },
      { label: 'Zama Protocol docs',  href: 'https://docs.zama.org/protocol', external: true },
      { label: 'ERC-7984 spec',       href: 'https://eips.ethereum.org/', external: true },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="section-dark bg-ink-950 pt-20 pb-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 grid place-items-center rounded-lg bg-gold-500 text-ink-950 font-bold">
                Z
              </div>
              <span className="font-display text-base font-semibold tracking-tight text-ink-50">
                Zama<span className="text-gold-500">Vault</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-ink-100/55 max-w-xs leading-relaxed">
              The canonical interface for the Zama Confidential Wrappers Registry.
              Shield, send, and decrypt with on-chain Fully Homomorphic Encryption.
            </p>
            <a
              href="https://github.com/hosein-ul/zamavault"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-xs text-ink-300 hover:text-gold-500 transition-colors"
            >
              <SiGithub className="h-3.5 w-3.5" />
              hosein-ul/zamavault
            </a>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-xs uppercase tracking-[0.16em] text-ink-300 mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ink-100/60 hover:text-ink-50 transition-colors inline-flex items-center gap-1"
                      >
                        {l.label}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-ink-100/60 hover:text-ink-50 transition-colors"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-ink-400">
          <span>© 2026 ZamaVault. MIT licensed.</span>
          <span>Not affiliated with Zama SAS — independent community project.</span>
        </div>
      </div>
    </footer>
  );
}
