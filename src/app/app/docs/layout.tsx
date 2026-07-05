'use client';

/**
 * Persistent docs shell: a sticky grouped sidebar + the scrollable content
 * column. `children` is the current subpage (wrapped by template.tsx, which
 * handles the per-navigation entrance animation).
 */

import React from 'react';
import Sidebar from './_docs/Sidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-page">
      <Sidebar />
      <main className="docs-content">{children}</main>
    </div>
  );
}
