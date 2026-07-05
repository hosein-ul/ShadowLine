/**
 * Single source of truth for the docs navigation.
 *
 * Every doc "page" is one entry here. The sidebar renders them grouped; the
 * prev/next pager walks the FLAT order below. Adding a page = adding one entry
 * (plus its content component in `content/` and a case in the `[slug]` route).
 *
 * Routing: the first item (`overview`) is the index route `/app/docs`. Every
 * other item is a real subpage at `/app/docs/<slug>`.
 */

export type DocGroup =
  | 'Getting Started'
  | 'Core Concepts'
  | 'Guides'
  | 'Developers'
  | 'Reference';

export interface DocEntry {
  /** URL slug. `overview` maps to the index route `/app/docs`. */
  slug: string;
  /** Sidebar + page title. */
  label: string;
  /** Sidebar group heading. */
  group: DocGroup;
  /** Small eyebrow shown above the page title. */
  eyebrow: string;
  /** One-line page summary rendered under the title. */
  description: string;
}

/**
 * FLAT, ordered list — drives both the grouped sidebar and the prev/next pager.
 * Order here IS the reading order.
 */
export const DOC_ENTRIES: DocEntry[] = [
  // ── Getting Started ─────────────────────────────────────────────
  {
    slug: 'overview',
    label: 'Overview',
    group: 'Getting Started',
    eyebrow: 'Introduction',
    description:
      'What ShadowLine is, who it is for, and how the confidential-token pieces fit together.',
  },
  {
    slug: 'quickstart',
    label: 'Quick Start',
    group: 'Getting Started',
    eyebrow: 'Getting Started',
    description:
      'Connect a wallet, browse the Registry, shield your first token, and transfer confidentially.',
  },
  {
    slug: 'architecture',
    label: 'Architecture',
    group: 'Getting Started',
    eyebrow: 'Getting Started',
    description:
      'How the browser, wallet, Zama Relayer/Gateway, and the fhEVM contracts talk to each other.',
  },

  // ── Core Concepts ───────────────────────────────────────────────
  {
    slug: 'fhe',
    label: 'FHE & ERC-7984',
    group: 'Core Concepts',
    eyebrow: 'Concept',
    description:
      'Fully Homomorphic Encryption, the fhEVM, and the confidential-token standard ShadowLine is built on.',
  },
  {
    slug: 'decimal-scaling',
    label: 'Decimal Scaling',
    group: 'Core Concepts',
    eyebrow: 'Concept',
    description:
      'Why every confidential wrapper is 6 decimals, and the exact rule for shield vs. unshield amounts.',
  },
  {
    slug: 'permits',
    label: 'EIP-712 Permits',
    group: 'Core Concepts',
    eyebrow: 'Concept',
    description:
      'How a read-only signature lets only you decrypt your own balance — and how to never fire it by accident.',
  },

  // ── Guides ──────────────────────────────────────────────────────
  {
    slug: 'shield',
    label: 'Shield & Unshield',
    group: 'Guides',
    eyebrow: 'Guide',
    description:
      'The full wrap/unwrap lifecycle: approval, shielding, the two-phase unshield, and interrupted-op resume.',
  },
  {
    slug: 'transfer',
    label: 'Confidential Transfer',
    group: 'Guides',
    eyebrow: 'Guide',
    description:
      'Send confidential tokens where the amount is encrypted on-chain — hidden even from the recipient.',
  },
  {
    slug: 'registry',
    label: 'Registry & Discovery',
    group: 'Guides',
    eyebrow: 'Guide',
    description:
      'How pairs are discovered on-chain, official vs. custom tokens, and adding your own wrapper.',
  },
  {
    slug: 'portfolio',
    label: 'Portfolio & Decryption',
    group: 'Guides',
    eyebrow: 'Guide',
    description:
      'View your holdings and batch-decrypt every confidential balance with a single signature.',
  },

  // ── Developers ──────────────────────────────────────────────────
  {
    slug: 'rest-api',
    label: 'REST API',
    group: 'Developers',
    eyebrow: 'Developers',
    description:
      'A public, wallet-free GET endpoint that returns every registered wrapper pair as JSON.',
  },
  {
    slug: 'use-cases',
    label: 'Use Cases',
    group: 'Developers',
    eyebrow: 'Developers',
    description:
      'Real-world patterns enabled by ERC-7984 confidential tokens: payroll, auctions, DAO treasury, and more.',
  },

  // ── Reference ───────────────────────────────────────────────────
  {
    slug: 'addresses',
    label: 'Contract Addresses',
    group: 'Reference',
    eyebrow: 'Reference',
    description:
      'Registry and wrapper-pair addresses for Sepolia and Ethereum Mainnet, with explorer links.',
  },
  {
    slug: 'errors',
    label: 'Error Reference',
    group: 'Reference',
    eyebrow: 'Reference',
    description:
      'Every Zama SDK error code, whether it is retryable, and how ShadowLine maps it to a message.',
  },
  {
    slug: 'security',
    label: 'Security Model',
    group: 'Reference',
    eyebrow: 'Reference',
    description:
      'Trust boundaries, what stays private, what is public, and the guarantees ShadowLine does — and does not — make.',
  },
  {
    slug: 'faq',
    label: 'FAQ',
    group: 'Reference',
    eyebrow: 'Reference',
    description: 'Short answers to the questions people ask most about confidential tokens.',
  },
];

/** Ordered list of group headings, matching first appearance in DOC_ENTRIES. */
export const DOC_GROUPS: DocGroup[] = [
  'Getting Started',
  'Core Concepts',
  'Guides',
  'Developers',
  'Reference',
];

/** Route href for a slug. `overview` is the index route. */
export function hrefForSlug(slug: string): string {
  return slug === 'overview' ? '/app/docs' : `/app/docs/${slug}`;
}

/** Look up an entry by slug. */
export function getEntry(slug: string): DocEntry | undefined {
  return DOC_ENTRIES.find((e) => e.slug === slug);
}

/** Prev/next neighbours in reading order, for the pager. */
export function getNeighbours(slug: string): { prev?: DocEntry; next?: DocEntry } {
  const i = DOC_ENTRIES.findIndex((e) => e.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? DOC_ENTRIES[i - 1] : undefined,
    next: i < DOC_ENTRIES.length - 1 ? DOC_ENTRIES[i + 1] : undefined,
  };
}

/** Every slug except the index — used to generate the [slug] subpages. */
export const SUBPAGE_SLUGS: string[] = DOC_ENTRIES.filter((e) => e.slug !== 'overview').map(
  (e) => e.slug,
);
