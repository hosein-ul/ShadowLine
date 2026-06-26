import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';

/* Fraunces — optical-size variable serif. Distinctive editorial feel,
   completely unlike Zama's clean tech sans. Used for hero + section h2. */
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

/* Plus Jakarta Sans — humanist rounded sans. Modern, not overused in crypto.
   Used for body text, nav, UI labels. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZamaVault — Confidential Tokens, Made Simple',
  description:
    "Discover, shield, and manage confidential ERC-7984 tokens on Zama's fully-homomorphic encryption protocol. The canonical interface for the Confidential Wrappers Registry.",
  keywords: [
    'Zama', 'FHE', 'fully homomorphic encryption', 'ERC-7984',
    'confidential tokens', 'wrapper registry', 'privacy', 'Ethereum', 'DeFi',
  ],
  openGraph: {
    title: 'ZamaVault — Confidential Tokens, Made Simple',
    description:
      "The definitive interface for managing confidential ERC-7984 tokens powered by Zama's Fully Homomorphic Encryption.",
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  const design = localStorage.getItem('design-theme') || 'charcoal';
                  document.documentElement.setAttribute('data-design-theme', design);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.setAttribute('data-design-theme', 'charcoal');
                }
              })()
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
