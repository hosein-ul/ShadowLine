'use client';

/**
 * Docs sidebar — grouped, route-aware navigation. Lives in the docs layout so it
 * persists across page transitions (only the content re-animates). Collapses into
 * a slide-over drawer on mobile.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ExternalLink, Menu, X } from 'lucide-react';
import { DOC_ENTRIES, DOC_GROUPS, hrefForSlug } from './nav';

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="docs-mobile-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle docs navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
        <span>Documentation</span>
      </button>

      <aside className={`docs-sidebar ${open ? 'open' : ''}`}>
        <div className="docs-sidebar-title">
          <BookOpen size={16} />
          ShadowLine Docs
        </div>

        <nav className="docs-sidebar-nav">
          {DOC_GROUPS.map((group) => (
            <div key={group} className="docs-nav-group">
              <div className="docs-nav-group-label">{group}</div>
              {DOC_ENTRIES.filter((e) => e.group === group).map((item) => {
                const href = hrefForSlug(item.slug);
                const active = pathname === href;
                return (
                  <Link
                    key={item.slug}
                    href={href}
                    className={`docs-nav-item ${active ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="docs-sidebar-footer">
          <a
            href="https://docs.zama.org/protocol/sdk/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-ext-link"
          >
            <ExternalLink size={12} /> Zama Official Docs
          </a>
          <a
            href="https://github.com/hosein-ul/ShadowLine"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-ext-link"
          >
            <ExternalLink size={12} /> GitHub Repo
          </a>
        </div>
      </aside>

      {open && <div className="docs-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
