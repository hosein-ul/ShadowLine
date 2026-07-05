'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Shadow<span style={{ color: 'var(--accent)' }}>Line</span>
            </span>
            <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
            <span>Confidential Wrapper Registry</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://docs.zama.org/protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              Docs
            </a>
            <a
              href="https://github.com/zama-ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              GitHub
            </a>
            <a
              href="https://www.zama.org"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
            >
              Zama
            </a>
          </div>
        </div>
        <div style={{ marginTop: 'var(--sp-4)', opacity: 0.4, fontSize: 'var(--text-xs)' }}>
          Confidential token registry powered by Zama fhEVM · ERC-7984
        </div>
      </div>
    </footer>
  );
}
