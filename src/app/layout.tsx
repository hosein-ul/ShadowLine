import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "ZamaVault — Confidential Wrapper Registry",
  description:
    "Discover, wrap, and manage confidential ERC-7984 tokens on the Zama Protocol. The canonical interface for converting ERC-20 tokens to their encrypted counterparts using Fully Homomorphic Encryption.",
  keywords: [
    "Zama",
    "FHE",
    "ERC-7984",
    "confidential tokens",
    "wrapper registry",
    "privacy",
    "Ethereum",
    "DeFi",
  ],
  openGraph: {
    title: "ZamaVault — Confidential Wrapper Registry",
    description:
      "The definitive interface for managing confidential ERC-7984 tokens powered by Fully Homomorphic Encryption.",
    type: "website",
  },
};

export default function RootLayout({
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
                  const theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  const design = localStorage.getItem('design-theme') || 'charcoal';
                  document.documentElement.setAttribute('data-design-theme', design);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.setAttribute('data-design-theme', 'charcoal');
                }
              })()
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
