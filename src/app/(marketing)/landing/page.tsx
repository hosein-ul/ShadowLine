import React from 'react';
import Link from 'next/link';

/* ─── Token data ──────────────────────────────────────────────────────────── */
const TOKENS = ['USDC', 'USDT', 'WETH', 'ZAMA', 'BRON', 'tGBP', 'XAUt'];

/* ─── Inline styles as CSS ────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: #0a0a0a;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  a { text-decoration: none; color: inherit; }

  /* ── Tokens ── */
  :root {
    --gold: #FFD208;
    --gold-dim: rgba(255,210,8,.12);
    --gold-glow: rgba(255,210,8,.25);
    --ink: #0a0a0a;
    --surface: #111111;
    --surface-2: #171717;
    --border: rgba(255,255,255,.08);
    --border-strong: rgba(255,255,255,.14);
    --text-main: #ffffff;
    --text-dim: rgba(255,255,255,.5);
    --text-muted: rgba(255,255,255,.28);
    --mono: 'JetBrains Mono', monospace;
  }

  /* ────────────────────────────────────────────────
     NAV
  ──────────────────────────────────────────────── */
  .lp-nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 64px; height: 68px;
    background: rgba(10,10,10,.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .lp-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 15px; font-weight: 800; color: #fff;
  }
  .lp-logo-mark {
    width: 30px; height: 30px; border-radius: 7px;
    background: var(--gold);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lp-logo-mark svg { display: block; }
  .lp-logo-text span { color: var(--gold); }
  .lp-nav-links {
    display: flex; align-items: center; gap: 32px;
  }
  .lp-nav-links a {
    font-size: 13px; color: var(--text-dim); font-weight: 500;
    transition: color .15s;
  }
  .lp-nav-links a:hover { color: #fff; }
  .lp-nav-right { display: flex; align-items: center; gap: 12px; }
  .lp-nav-ghost {
    padding: 8px 18px; font-size: 13px; font-weight: 600;
    color: var(--text-dim); background: transparent;
    border: 1px solid var(--border); border-radius: 7px;
    cursor: pointer; transition: border-color .15s, color .15s;
  }
  .lp-nav-ghost:hover { border-color: var(--border-strong); color: #fff; }
  .lp-nav-cta {
    padding: 9px 22px; font-size: 13px; font-weight: 700;
    background: var(--gold); color: #000;
    border: none; border-radius: 7px; cursor: pointer;
    transition: opacity .15s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .lp-nav-cta:hover { opacity: .88; }

  /* ────────────────────────────────────────────────
     HERO
  ──────────────────────────────────────────────── */
  .lp-hero {
    position: relative;
    padding: 120px 64px 100px;
    max-width: 1280px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 80px; align-items: center;
  }
  .lp-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 12px; border-radius: 100px;
    border: 1px solid rgba(255,210,8,.25);
    background: rgba(255,210,8,.06);
    font-size: 11px; font-weight: 700; letter-spacing: .07em;
    color: var(--gold); text-transform: uppercase;
    margin-bottom: 28px;
  }
  .lp-hero-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); animation: lpBlink 2s ease infinite;
  }
  @keyframes lpBlink { 0%,100%{opacity:1} 50%{opacity:.25} }

  .lp-headline {
    font-size: clamp(44px, 5vw, 72px);
    font-weight: 800; line-height: 1.05;
    letter-spacing: -.025em; color: #fff;
    margin-bottom: 24px;
  }
  .lp-headline-gold { color: var(--gold); }

  .lp-sub {
    font-size: 17px; line-height: 1.7;
    color: var(--text-dim);
    max-width: 460px; margin-bottom: 40px;
  }
  .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; font-size: 15px; font-weight: 700;
    background: var(--gold); color: #000;
    border: none; border-radius: 9px; cursor: pointer;
    transition: opacity .15s, transform .15s;
  }
  .lp-btn-primary:hover { opacity: .88; transform: translateY(-1px); }
  .lp-btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px; font-size: 14px; font-weight: 600;
    background: transparent; color: var(--text-dim);
    border: 1px solid var(--border-strong); border-radius: 9px; cursor: pointer;
    transition: color .15s, border-color .15s;
  }
  .lp-btn-secondary:hover { color: #fff; border-color: rgba(255,255,255,.3); }

  /* Hero visual */
  .lp-hero-visual {
    position: relative;
  }
  .lp-vault-card {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    padding: 28px;
    display: flex; flex-direction: column; gap: 16px;
  }
  .lp-vault-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 16px; border-bottom: 1px solid var(--border);
  }
  .lp-vault-card-title { font-size: 12px; font-weight: 700; letter-spacing: .05em; color: var(--text-muted); text-transform: uppercase; }
  .lp-vault-card-badge {
    padding: 3px 10px; border-radius: 100px;
    background: rgba(255,210,8,.12); border: 1px solid rgba(255,210,8,.2);
    font-size: 10px; font-weight: 700; color: var(--gold); letter-spacing: .05em;
  }
  .lp-token-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid var(--border);
  }
  .lp-token-row:last-of-type { border-bottom: none; }
  .lp-token-left { display: flex; align-items: center; gap: 12px; }
  .lp-token-icon {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #000;
    flex-shrink: 0;
  }
  .lp-token-name { font-size: 14px; font-weight: 700; }
  .lp-token-wrapped { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }
  .lp-token-enc {
    font-family: var(--mono); font-size: 12px;
    color: var(--text-muted); letter-spacing: 2px;
  }
  .lp-token-enc-gold { color: var(--gold); letter-spacing: 1px; }
  .lp-card-footer {
    padding-top: 12px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--text-muted); font-family: var(--mono);
  }
  .lp-card-footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

  /* ────────────────────────────────────────────────
     STATS BAR
  ──────────────────────────────────────────────── */
  .lp-stats {
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .lp-stats-inner {
    max-width: 1280px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(4,1fr);
  }
  .lp-stat {
    padding: 40px 64px;
    border-right: 1px solid var(--border);
  }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-val {
    font-size: 40px; font-weight: 800; letter-spacing: -.02em;
    color: #fff; line-height: 1;
    display: flex; align-items: baseline; gap: 4px;
  }
  .lp-stat-val sup { font-size: 18px; color: var(--gold); }
  .lp-stat-lbl { font-size: 13px; color: var(--text-muted); margin-top: 6px; font-weight: 500; }

  /* ────────────────────────────────────────────────
     FEATURES
  ──────────────────────────────────────────────── */
  .lp-features {
    max-width: 1280px; margin: 0 auto;
    padding: 100px 64px;
  }
  .lp-section-pre {
    font-size: 11px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 16px;
  }
  .lp-section-title {
    font-size: clamp(28px, 3vw, 42px); font-weight: 800;
    letter-spacing: -.02em; color: #fff;
    margin-bottom: 64px; max-width: 500px;
  }
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 1px; background: var(--border);
    border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden;
  }
  .lp-feature {
    padding: 48px 40px;
    background: var(--ink);
    transition: background .2s;
    position: relative;
  }
  .lp-feature:hover { background: var(--surface); }
  .lp-feature-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: var(--gold-dim);
    border: 1px solid rgba(255,210,8,.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 24px; font-size: 18px;
  }
  .lp-feature-title { font-size: 17px; font-weight: 700; margin-bottom: 10px; }
  .lp-feature-body { font-size: 14px; color: var(--text-dim); line-height: 1.7; }
  .lp-feature-tag {
    position: absolute; top: 20px; right: 20px;
    font-family: var(--mono); font-size: 10px; color: var(--text-muted);
    letter-spacing: .06em;
  }

  /* ────────────────────────────────────────────────
     HOW IT WORKS
  ──────────────────────────────────────────────── */
  .lp-how {
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 100px 64px;
  }
  .lp-how-inner { max-width: 1280px; margin: 0 auto; }
  .lp-steps {
    display: grid; grid-template-columns: repeat(3,1fr);
    gap: 48px; margin-top: 64px; position: relative;
  }
  .lp-steps::before {
    content: '';
    position: absolute; top: 22px; left: calc(33.33% + 16px);
    right: calc(33.33% + 16px); height: 1px;
    background: linear-gradient(90deg, var(--border), var(--gold-glow), var(--border));
  }
  .lp-step { display: flex; flex-direction: column; gap: 12px; }
  .lp-step-num {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--gold-dim); border: 1px solid rgba(255,210,8,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: var(--gold);
    flex-shrink: 0;
  }
  .lp-step-title { font-size: 18px; font-weight: 700; padding-top: 12px; }
  .lp-step-body { font-size: 14px; color: var(--text-dim); line-height: 1.7; }
  .lp-step-code {
    font-family: var(--mono); font-size: 11px;
    color: var(--text-muted); margin-top: 4px;
    letter-spacing: .02em;
  }
  .lp-step-code span { color: var(--gold); }

  /* ────────────────────────────────────────────────
     TOKEN GRID
  ──────────────────────────────────────────────── */
  .lp-tokens { max-width: 1280px; margin: 0 auto; padding: 100px 64px; }
  .lp-tokens-grid {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-top: 40px;
  }
  .lp-token-chip {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 100px;
    background: var(--surface); border: 1px solid var(--border);
    font-size: 13px; font-weight: 700;
    transition: border-color .2s, background .2s;
  }
  .lp-token-chip:hover { border-color: rgba(255,210,8,.3); background: var(--gold-dim); }
  .lp-token-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
  .lp-token-chip-wrapped { font-family: var(--mono); font-size: 11px; color: var(--text-muted); }

  /* ────────────────────────────────────────────────
     CTA SECTION
  ──────────────────────────────────────────────── */
  .lp-cta {
    padding: 120px 64px; text-align: center;
    border-top: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .lp-cta::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 600px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .lp-cta-title {
    font-size: clamp(36px, 4vw, 60px); font-weight: 800;
    letter-spacing: -.03em; margin-bottom: 16px;
    line-height: 1.05;
  }
  .lp-cta-sub { font-size: 16px; color: var(--text-dim); margin-bottom: 48px; }
  .lp-cta-note {
    margin-top: 20px; font-size: 12px; color: var(--text-muted);
    font-family: var(--mono);
  }

  /* ────────────────────────────────────────────────
     FOOTER
  ──────────────────────────────────────────────── */
  .lp-footer {
    border-top: 1px solid var(--border);
    padding: 40px 64px;
  }
  .lp-footer-inner {
    max-width: 1280px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px;
  }
  .lp-footer-logo { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; }
  .lp-footer-logo-mark { width: 22px; height: 22px; border-radius: 5px; background: var(--gold); display: flex; align-items: center; justify-content: center; }
  .lp-footer-copy { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .lp-footer-links { display: flex; gap: 28px; }
  .lp-footer-links a { font-size: 13px; color: var(--text-dim); transition: color .15s; }
  .lp-footer-links a:hover { color: #fff; }

  /* ────────────────────────────────────────────────
     RESPONSIVE
  ──────────────────────────────────────────────── */
  @media (max-width: 1024px) {
    .lp-hero { grid-template-columns: 1fr; gap: 60px; }
    .lp-hero-visual { max-width: 480px; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-stats-inner { grid-template-columns: repeat(2,1fr); }
    .lp-stat { border-bottom: 1px solid var(--border); }
    .lp-stat:nth-child(2) { border-right: none; }
    .lp-stat:nth-child(3) { border-bottom: none; }
    .lp-stat:nth-child(4) { border-right: none; border-bottom: none; }
    .lp-steps { grid-template-columns: 1fr; }
    .lp-steps::before { display: none; }
  }

  @media (max-width: 768px) {
    .lp-nav { padding: 0 20px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 80px 20px 60px; }
    .lp-stat { padding: 28px 20px; }
    .lp-features { padding: 60px 20px; }
    .lp-feature { padding: 32px 24px; }
    .lp-how { padding: 60px 20px; }
    .lp-tokens { padding: 60px 20px; }
    .lp-cta { padding: 80px 20px; }
    .lp-footer { padding: 32px 20px; }
    .lp-footer-inner { flex-direction: column; align-items: flex-start; }
  }
`;

/* ─── Token colors ────────────────────────────────────────────────────────── */
const TOKEN_COLORS: Record<string, string> = {
  USDC: '#2775CA',
  USDT: '#26A17B',
  WETH: '#627EEA',
  ZAMA: '#FFD208',
  BRON: '#8B5CF6',
  tGBP: '#CF9B20',
  XAUt: '#D4AF37',
};

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <div className="lp-logo-mark">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7L4.5 3.5V5.5H9.5V3.5L13 7L9.5 10.5V8.5H4.5V10.5L1 7Z" fill="#000" />
            </svg>
          </div>
          <span className="lp-logo-text">Zama<span>Vault</span></span>
        </div>

        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#tokens">Tokens</a>
          <a href="https://docs.zama.org/protocol" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>

        <div className="lp-nav-right">
          <a href="/docs" className="lp-nav-ghost">Developer API</a>
          <a href="/" className="lp-nav-cta">
            Launch App
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div>
          <div className="lp-hero-eyebrow">
            <div className="lp-hero-eyebrow-dot" />
            Live on Ethereum · ERC-7984
          </div>
          <h1 className="lp-headline">
            Confidential tokens,<br />
            <span className="lp-headline-gold">done right.</span>
          </h1>
          <p className="lp-sub">
            The most complete interface for Zama&apos;s confidential token ecosystem.
            Shield ERC-20 tokens into FHE-encrypted wrappers — your balance stays
            private, on-chain, always.
          </p>
          <div className="lp-hero-btns">
            <a href="/" className="lp-btn-primary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10.5 6H14L11 9.5L12 14L8 11.5L4 14L5 9.5L2 6H5.5L8 1Z" fill="currentColor"/>
              </svg>
              Open App
            </a>
            <a href="/learn" className="lp-btn-secondary">
              How FHE works
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Visual: mini portfolio card */}
        <div className="lp-hero-visual">
          <div className="lp-vault-card">
            <div className="lp-vault-card-header">
              <span className="lp-vault-card-title">Confidential Portfolio</span>
              <span className="lp-vault-card-badge">ENCRYPTED</span>
            </div>

            {['USDC', 'WETH', 'ZAMA'].map((sym) => (
              <div className="lp-token-row" key={sym}>
                <div className="lp-token-left">
                  <div
                    className="lp-token-icon"
                    style={{ background: TOKEN_COLORS[sym] || '#888' }}
                  >
                    {sym.charAt(0)}
                  </div>
                  <div>
                    <div className="lp-token-name">c{sym}</div>
                    <div className="lp-token-wrapped">ERC-7984 · FHE</div>
                  </div>
                </div>
                <div className="lp-token-enc">
                  {sym === 'USDC' ? (
                    <span className="lp-token-enc-gold">1,250.00</span>
                  ) : (
                    '••••••'
                  )}
                </div>
              </div>
            ))}

            <div className="lp-card-footer">
              <div className="lp-card-footer-dot" />
              Decrypt with EIP-712 permit
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stat">
            <div className="lp-stat-val">8<sup>+</sup></div>
            <div className="lp-stat-lbl">Registered token pairs</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-val">2</div>
            <div className="lp-stat-lbl">Supported networks</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-val">FHE</div>
            <div className="lp-stat-lbl">On-chain encryption</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-val">ERC‑7984</div>
            <div className="lp-stat-lbl">Confidential standard</div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-pre">Core capabilities</div>
        <h2 className="lp-section-title">
          Everything you need to go confidential.
        </h2>

        <div className="lp-features-grid">
          <div className="lp-feature">
            <div className="lp-feature-tag">registry.live()</div>
            <div className="lp-feature-icon">🔍</div>
            <div className="lp-feature-title">Live Registry</div>
            <div className="lp-feature-body">
              Every ERC-7984 wrapper pair, read directly from the on-chain
              WrappersRegistry. Mainnet and Sepolia. No snapshots, no stale data.
            </div>
          </div>

          <div className="lp-feature">
            <div className="lp-feature-tag">shield(amount)</div>
            <div className="lp-feature-icon">🔒</div>
            <div className="lp-feature-title">One-click Shield</div>
            <div className="lp-feature-body">
              Approve and deposit any registered ERC-20. The wrapper mints an
              encrypted cToken — your balance becomes FHE ciphertext on-chain.
            </div>
          </div>

          <div className="lp-feature">
            <div className="lp-feature-tag">decrypt(permit)</div>
            <div className="lp-feature-icon">⚡</div>
            <div className="lp-feature-title">EIP-712 Decrypt</div>
            <div className="lp-feature-body">
              One off-chain signature grants a session key. Zama Gateway decrypts
              your balance locally — never on-chain, never stored.
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how">
        <div className="lp-how-inner">
          <div className="lp-section-pre">Step by step</div>
          <h2 className="lp-section-title">
            From zero to confidential in minutes.
          </h2>

          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <div className="lp-step-title">Get test tokens</div>
              <div className="lp-step-body">
                Use the built-in Faucet to mint free mock tokens on Sepolia —
                USDC, WETH, ZAMA, and more. Up to 1,000,000 per call.
              </div>
              <div className="lp-step-code">faucet.mint(<span>cUSDCMock</span>)</div>
            </div>

            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <div className="lp-step-title">Shield your balance</div>
              <div className="lp-step-body">
                Select a wrapper pair, enter an amount, and shield. Your ERC-20
                is deposited and a confidential cToken is minted via FHE.
              </div>
              <div className="lp-step-code">shield(<span>1000n</span>) → cUSDC</div>
            </div>

            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <div className="lp-step-title">Decrypt &amp; manage</div>
              <div className="lp-step-body">
                Sign an EIP-712 permit to view your encrypted balance. Transfer
                or unshield anytime — your assets, your control.
              </div>
              <div className="lp-step-code">decrypt(<span>permit</span>) → 1,000</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOKEN GRID ── */}
      <section className="lp-tokens" id="tokens">
        <div className="lp-section-pre">Registered pairs</div>
        <h2 className="lp-section-title">
          All tokens. Both networks.
        </h2>

        <div className="lp-tokens-grid">
          {TOKENS.map((sym) => (
            <a href="/" key={sym} className="lp-token-chip">
              <div
                className="lp-token-chip-dot"
                style={{ background: TOKEN_COLORS[sym] || '#888' }}
              />
              <span>{sym}</span>
              <span className="lp-token-chip-wrapped">→ c{sym}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <h2 className="lp-cta-title">
          Privacy starts with<br />
          <span style={{ color: 'var(--gold)' }}>one transaction.</span>
        </h2>
        <p className="lp-cta-sub">
          No sign-up. No KYC. No compromise.
        </p>
        <a href="/" className="lp-btn-primary" style={{ fontSize: '16px', padding: '16px 40px' }}>
          Open ZamaVault
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <div className="lp-cta-note">Live on Ethereum Mainnet + Sepolia Testnet</div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-logo">
              <div className="lp-footer-logo-mark">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 5L3.5 2.5V4H6.5V2.5L9 5L6.5 7.5V6H3.5V7.5L1 5Z" fill="#000"/>
                </svg>
              </div>
              ZamaVault
            </div>
            <div className="lp-footer-copy">
              Built for Zama Developer Program Season 3 · 2026
            </div>
          </div>
          <div className="lp-footer-links">
            <a href="/">App</a>
            <a href="/docs">API</a>
            <a href="/analytics">Analytics</a>
            <a href="https://docs.zama.org/protocol" target="_blank" rel="noopener noreferrer">Zama Docs</a>
            <a href="https://github.com/zama-ai" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}
