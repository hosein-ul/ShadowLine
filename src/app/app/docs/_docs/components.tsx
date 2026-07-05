'use client';

/**
 * Shared building blocks for every docs subpage: page shell, prose helpers,
 * tables, code blocks, the prev/next pager, motion reveals, and a small set of
 * hand-built SVG diagrams. All styling comes from the existing `.docs-*` design
 * tokens in globals.css — no new palette.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';
import CopyButton from '@/components/ui/CopyButton';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { getEntry, getNeighbours, hrefForSlug } from './nav';

/* ─── Motion reveal ──────────────────────────────────────────────────────── */

/** Fades + lifts its children in on mount. Respects the template's page-level
 *  entrance by staggering slightly after it. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page shell (header + body + pager) ─────────────────────────────────── */

export function DocPage({ slug, children }: { slug: string; children: React.ReactNode }) {
  const entry = getEntry(slug);
  return (
    <article>
      {entry && (
        <motion.header
          className="docs-page-header"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="docs-eyebrow">{entry.eyebrow}</span>
          <h1 className="docs-page-title">{entry.label}</h1>
          <p className="docs-page-desc">{entry.description}</p>
        </motion.header>
      )}
      {children}
      <DocsPager slug={slug} />
    </article>
  );
}

/* ─── Prev / Next pager ──────────────────────────────────────────────────── */

export function DocsPager({ slug }: { slug: string }) {
  const { prev, next } = getNeighbours(slug);
  return (
    <nav className="docs-pager" aria-label="Documentation pagination">
      {prev ? (
        <Link href={hrefForSlug(prev.slug)} className="docs-pager-link docs-pager-prev">
          <span className="docs-pager-dir">
            <ArrowLeft size={13} /> Previous
          </span>
          <span className="docs-pager-label">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={hrefForSlug(next.slug)} className="docs-pager-link docs-pager-next">
          <span className="docs-pager-dir">
            Next <ArrowRight size={13} />
          </span>
          <span className="docs-pager-label">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/* ─── Prose helpers ──────────────────────────────────────────────────────── */

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="docs-lead">{children}</p>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="docs-p">{children}</p>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="docs-h2">{children}</h2>;
}

export function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="docs-h4">{children}</h4>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="docs-list">{children}</ul>;
}

/* ─── Code block ─────────────────────────────────────────────────────────── */

export function CodeBlock({
  code,
  lang = 'ts',
  filename,
}: {
  code: string;
  lang?: string;
  filename?: string;
}) {
  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-lang">{filename ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="docs-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Callouts & info boxes ──────────────────────────────────────────────── */

export function Callout({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
}) {
  const cls =
    variant === 'warning'
      ? 'docs-callout docs-callout-warning'
      : variant === 'error'
        ? 'docs-callout docs-callout-error'
        : variant === 'success'
          ? 'docs-callout docs-callout-success'
          : 'docs-info-box';
  return <div className={cls}>{children}</div>;
}

/* ─── Feature grid ───────────────────────────────────────────────────────── */

export function FeatureGrid({
  items,
}: {
  items: { icon: string; title: string; desc: string }[];
}) {
  return (
    <div className="docs-feature-grid">
      {items.map((f) => (
        <div key={f.title} className="docs-feature-card">
          <div className="docs-feature-icon">{f.icon}</div>
          <div className="docs-feature-body">
            <strong>{f.title}</strong>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              {f.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Numbered steps ─────────────────────────────────────────────────────── */

export function StepList({ steps }: { steps: { t: string; d: React.ReactNode }[] }) {
  return (
    <div className="docs-steps">
      {steps.map((s, i) => (
        <div key={i} className="docs-step">
          <div className="docs-step-num">{i + 1}</div>
          <div>
            <strong>{s.t}</strong>
            <p className="text-sm text-muted" style={{ marginTop: 2 }}>
              {s.d}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tables ─────────────────────────────────────────────────────────────── */

export function PropTable({
  columns = ['Field', 'Type', 'Description'],
  children,
}: {
  columns?: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="docs-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function PropRow({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <tr className="docs-prop-row">
      <td>
        <code className="docs-prop-name">{name}</code>
        {required && <span className="docs-prop-required">required</span>}
      </td>
      <td>
        <code className="docs-prop-type">{type}</code>
      </td>
      <td className="docs-prop-desc">{description}</td>
    </tr>
  );
}

export function EndpointBadge({ method, path }: { method: string; path: string }) {
  return (
    <div className="docs-endpoint">
      <span className="docs-endpoint-method">{method}</span>
      <code className="docs-endpoint-path">{path}</code>
    </div>
  );
}

export function HookCard({
  name,
  pkg,
  description,
  signature,
  example,
}: {
  name: string;
  pkg: string;
  description: string;
  signature: string;
  example: string;
}) {
  return (
    <div className="docs-hook-card">
      <div className="docs-hook-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <code className="docs-hook-name">{name}</code>
            <Badge variant="default" size="sm">
              {pkg}
            </Badge>
          </div>
          <p className="docs-hook-desc">{description}</p>
        </div>
      </div>
      <CodeBlock code={signature} lang="ts" filename="signature" />
      <CodeBlock code={example} lang="tsx" filename="example" />
    </div>
  );
}

export function ErrorRow({
  code,
  title,
  description,
  retryable,
}: {
  code: string;
  title: string;
  description: string;
  retryable: boolean;
}) {
  return (
    <tr className="docs-prop-row">
      <td>
        <code className="docs-prop-name" style={{ color: 'var(--error)' }}>
          {code}
        </code>
      </td>
      <td style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{title}</td>
      <td className="docs-prop-desc">{description}</td>
      <td>
        <Badge variant={retryable ? 'success' : 'warning'} size="sm">
          {retryable ? 'Retryable' : 'Terminal'}
        </Badge>
      </td>
    </tr>
  );
}

export function AddressTable({
  network,
  registry,
  pairs,
}: {
  network: string;
  registry: string;
  pairs: { symbol: string; erc20: string; wrapper: string; decimals: number }[];
}) {
  const explorerBase =
    network === 'Sepolia'
      ? 'https://eth-sepolia.blockscout.com/address'
      : 'https://eth.blockscout.com/address';

  return (
    <div className="docs-address-table-wrap">
      <div className="docs-address-registry">
        <span className="text-muted text-sm">WrappersRegistry</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code className="docs-addr-mono">{registry}</code>
          <a href={`${explorerBase}/${registry}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
          </a>
        </div>
      </div>
      <table className="docs-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Decimals</th>
            <th>ERC-20 Address</th>
            <th>ERC-7984 Wrapper</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p) => (
            <tr key={p.symbol} className="docs-prop-row">
              <td style={{ fontWeight: 600 }}>
                {p.symbol}
                <span style={{ marginLeft: 4 }}>
                  <code className="docs-prop-type">c{p.symbol}</code>
                </span>
              </td>
              <td className="text-muted text-sm">{p.decimals} / 6</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code className="docs-addr-mono docs-addr-short">
                    {p.erc20.slice(0, 10)}…{p.erc20.slice(-6)}
                  </code>
                  <a href={`${explorerBase}/${p.erc20}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={11} style={{ color: 'var(--accent)' }} />
                  </a>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code className="docs-addr-mono docs-addr-short">
                    {p.wrapper.slice(0, 10)}…{p.wrapper.slice(-6)}
                  </code>
                  <a href={`${explorerBase}/${p.wrapper}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={11} style={{ color: 'var(--accent)' }} />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── SVG diagrams ───────────────────────────────────────────────────────── */
/* Themed via CSS variables so they track light/dark automatically. Each is a
   labelled box-and-arrow schematic — no external assets. */

function DiagramFrame({
  title,
  viewBox,
  children,
}: {
  title: string;
  viewBox: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="docs-diagram">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <svg viewBox={viewBox} role="img" aria-label={title} width="100%">
          {children}
        </svg>
      </motion.div>
      <figcaption>{title}</figcaption>
    </figure>
  );
}

/** Reusable rounded node. */
function Node({
  x,
  y,
  w,
  h,
  label,
  sub,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={accent ? 'var(--accent-subtle)' : 'var(--bg-elevated)'}
        stroke={accent ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 5 : y + h / 2 + 4}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="var(--text-primary)"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 13}
          textAnchor="middle"
          fontSize="10"
          fill="var(--text-muted)"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

const ARROW = 'var(--text-muted)';

export function ArchitectureDiagram() {
  return (
    <DiagramFrame title="ShadowLine end-to-end request flow" viewBox="0 0 760 360">
      <defs>
        <marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={ARROW} />
        </marker>
      </defs>

      <Node x={30} y={150} w={120} h={60} label="You" sub="browser + wallet" accent />
      <Node x={220} y={150} w={140} h={60} label="ShadowLine UI" sub="Next.js app" />

      {/* Two backend lanes */}
      <Node x={430} y={60} w={150} h={56} label="Wagmi + viem" sub="public RPC reads/writes" />
      <Node x={430} y={244} w={150} h={56} label="Zama React SDK" sub="encrypt · decrypt · permit" />

      <Node x={630} y={60} w={110} h={56} label="fhEVM" sub="wrapper contracts" />
      <Node x={630} y={244} w={110} h={56} label="Relayer / Gateway" sub="KMS coprocessor" />

      {/* Arrows */}
      <line x1={150} y1={180} x2={218} y2={180} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#arch-arrow)" markerStart="url(#arch-arrow)" />
      <line x1={360} y1={172} x2={428} y2={100} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#arch-arrow)" />
      <line x1={360} y1={188} x2={428} y2={268} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#arch-arrow)" />
      <line x1={580} y1={88} x2={628} y2={88} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#arch-arrow)" markerStart="url(#arch-arrow)" />
      <line x1={580} y1={272} x2={628} y2={272} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#arch-arrow)" markerStart="url(#arch-arrow)" />
      {/* Gateway settles to fhEVM */}
      <line x1={685} y1={244} x2={685} y2={118} stroke={ARROW} strokeWidth={1.2} strokeDasharray="4 4" markerEnd="url(#arch-arrow)" />
      <text x={700} y={185} fontSize="9" fill="var(--text-muted)">settles</text>
    </DiagramFrame>
  );
}

export function ShieldFlowDiagram() {
  return (
    <DiagramFrame title="Shield vs. Unshield lifecycle" viewBox="0 0 760 300">
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={ARROW} />
        </marker>
      </defs>

      <text x={30} y={40} fontSize="12" fontWeight="700" fill="var(--accent)">SHIELD (wrap)</text>
      <Node x={30} y={54} w={130} h={54} label="Approve" sub="ERC-20 allowance" />
      <Node x={210} y={54} w={130} h={54} label="wrap()" sub="lock + mint euint64" accent />
      <Node x={390} y={54} w={150} h={54} label="Confidential balance" sub="encrypted on-chain" />
      <line x1={160} y1={81} x2={208} y2={81} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#flow-arrow)" />
      <line x1={340} y1={81} x2={388} y2={81} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#flow-arrow)" />

      <text x={30} y={175} fontSize="12" fontWeight="700" fill="var(--text-secondary)">UNSHIELD (unwrap)</text>
      <Node x={30} y={190} w={150} h={54} label="unwrap() request" sub="burn ciphertext" />
      <Node x={230} y={190} w={170} h={54} label="Gateway finalizes" sub="decryption proof ~30–60s" />
      <Node x={450} y={190} w={150} h={54} label="ERC-20 released" sub="back to your address" accent />
      <line x1={180} y1={217} x2={228} y2={217} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#flow-arrow)" />
      <line x1={400} y1={217} x2={448} y2={217} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#flow-arrow)" />
    </DiagramFrame>
  );
}

export function PermitFlowDiagram() {
  return (
    <DiagramFrame title="Reading a confidential balance (EIP-712 permit)" viewBox="0 0 760 150">
      <defs>
        <marker id="permit-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={ARROW} />
        </marker>
      </defs>
      <Node x={20} y={48} w={120} h={54} label="Click Decrypt" sub="explicit action" accent />
      <Node x={180} y={48} w={130} h={54} label="Sign EIP-712" sub="off-chain, no gas" />
      <Node x={350} y={48} w={130} h={54} label="Session key" sub="scoped to you" />
      <Node x={520} y={48} w={130} h={54} label="Gateway decrypts" sub="only your ciphertext" />
      <Node x={660} y={48} w={80} h={54} label="Plaintext" sub="in browser" accent />
      {[140, 310, 480, 650].map((x, i) => (
        <line key={i} x1={x} y1={75} x2={x + 40} y2={75} stroke={ARROW} strokeWidth={1.5} markerEnd="url(#permit-arrow)" />
      ))}
    </DiagramFrame>
  );
}

export function FheConceptDiagram() {
  return (
    <DiagramFrame title="Public ERC-20 vs. confidential ERC-7984 storage" viewBox="0 0 760 220">
      <Node x={40} y={40} w={300} h={140} label="" />
      <text x={190} y={70} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-secondary)">Public ERC-20</text>
      <text x={190} y={110} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--text-primary)">balanceOf = 1000</text>
      <text x={190} y={140} textAnchor="middle" fontSize="11" fill="var(--text-muted)">uint256 · readable by anyone</text>

      <Node x={420} y={40} w={300} h={140} label="" accent />
      <text x={570} y={70} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--accent)">Confidential ERC-7984</text>
      <text x={570} y={110} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--text-primary)" fontFamily="var(--font-mono, monospace)">0x9f3a…e1c7</text>
      <text x={570} y={140} textAnchor="middle" fontSize="11" fill="var(--text-muted)">euint64 handle · only you can decrypt</text>
    </DiagramFrame>
  );
}
