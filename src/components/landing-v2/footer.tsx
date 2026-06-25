import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

/**
 * Footer v2 — editorial: wide gutter, fine type, lots of negative space.
 * Aubergine background continues from the final beat for visual continuity.
 */
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
    title: 'Build',
    links: [
      { label: 'Documentation',  href: '/app/docs' },
      { label: 'Snippets',       href: '/app/developers' },
      { label: 'REST API',       href: '/api/registry?chain=sepolia' },
      { label: 'GitHub',         href: 'https://github.com/hosein-ul/zamavault', external: true },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Tutorial',           href: '/app/learn' },
      { label: 'Zama Protocol docs', href: 'https://docs.zama.org/protocol', external: true },
      { label: 'ERC-7984 spec',      href: 'https://eips.ethereum.org/', external: true },
    ],
  },
];

export function FooterV2() {
  return (
    <footer
      className="section-dark pt-24 pb-12"
      style={{ backgroundColor: 'var(--color-aubergine-dark, #25141C)' }}
    >
      <div className="v2-container">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-16">

          <div className="col-span-2">
            <Link href="/" className="inline-flex items-baseline gap-1">
              <span className="v2-display text-2xl text-cream-50 tracking-tight">Zama</span>
              <span className="v2-display text-2xl text-gold-500 italic tracking-tight">Vault</span>
            </Link>
            <p className="mt-5 text-sm text-cream-200/55 max-w-xs leading-relaxed">
              The canonical interface for the Zama Confidential Wrappers Registry.
              Built with care, open source, MIT licensed.
            </p>
            <a
              href="https://github.com/hosein-ul/zamavault"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-xs text-cream-200/70 hover:text-gold-500 transition-colors"
            >
              <SiGithub className="h-3.5 w-3.5" />
              hosein-ul/zamavault
            </a>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-200/60 mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cream-100/75 hover:text-cream-50 transition-colors inline-flex items-center gap-1"
                      >
                        {l.label}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-cream-100/75 hover:text-cream-50 transition-colors"
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

        <div className="mt-20 pt-8 border-t border-cream-50/[0.06] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-cream-200/45">
          <span>© 2026 ZamaVault. MIT licensed.</span>
          <span>Independent community project. Not affiliated with Zama SAS.</span>
        </div>
      </div>
    </footer>
  );
}
