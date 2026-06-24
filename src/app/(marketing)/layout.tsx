import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ZamaVault — Confidential Token Interface',
  description:
    'The most complete interface for Zama\'s confidential token ecosystem. Shield ERC-20 tokens into FHE-encrypted wrappers on Ethereum.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const t = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}
