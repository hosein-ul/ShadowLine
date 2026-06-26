'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './globals.css';
import {
  Shield,
  Lock,
  Unlock,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Globe,
  ChevronDown,
  ExternalLink,
  Cpu,
  Database,
  Network,
  Layers,
  Code2,
  Activity,
} from 'lucide-react';

function useInViewHook(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, inView: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return value;
}

function RevealSection({ children, delay = 0, style = {}, className = '' }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties; className?: string }) {
  const { ref, inView } = useInViewHook();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const CODE_SNIPPETS = {
  shield: `import { useShield } from '@zama-fhe/react-sdk';

function ShieldAssets() {
  const { shield, isLoading } = useShield();

  const handleShield = async () => {
    // SDK auto-detects ERC-1363 path (1-tx)
    // or approve + wrap path (2-tx)
    await shield({
      tokenAddress: '0xWrapperAddress...',
      amount: 100_000_000n,   // 100 cUSDC (6 decimals)
    });
    // ✓ Public USDC transferred to wrapper
    // ✓ Encrypted cUSDC minted to your wallet
    // ✓ Balance stored as euint64 ciphertext on-chain
  };

  return (
    <button onClick={handleShield} disabled={isLoading}>
      {isLoading ? 'Shielding...' : 'Shield 100 USDC'}
    </button>
  );
}`,
  decrypt: `import { useConfidentialBalance } from '@zama-fhe/react-sdk';

function ViewBalance() {
  const { data, refetch, isLoading } = useConfidentialBalance({
    tokenAddress: '0xWrapperAddress...',
  });

  // Decrypt flow:
  // 1. User signs EIP-712 permit (read-only, no tokens spent)
  // 2. SDK sends permit to Zama Gateway
  // 3. KMS re-encrypts ciphertext → user's transport key
  // 4. WASM decrypts locally — plaintext never leaves browser

  return (
    <div>
      <p>Balance: {data ? data.toString() : '••••••'} cUSDC</p>
      <button onClick={() => refetch()}>
        {isLoading ? 'Signing EIP-712...' : 'Decrypt Balance'}
      </button>
    </div>
  );
}`,
  transfer: `import { useConfidentialTransfer } from '@zama-fhe/react-sdk';

function TransferPrivately() {
  const { transfer } = useConfidentialTransfer({
    tokenAddress: '0xWrapperAddress...',
  });

  const handleTransfer = async () => {
    // Amount is FHE-encrypted client-side BEFORE tx is sent
    // On-chain: sender & recipient addresses are public
    //           transfer AMOUNT is fully encrypted ✓
    await transfer({
      to: '0xRecipientAddress...',
      amount: 50_000_000n,  // 50 cUSDC — encrypted in WASM
    });
  };

  return <button onClick={handleTransfer}>Send 50 cUSDC</button>;
}`,
};

export default function LandingPageV2() {
  const [vizState, setVizState] = useState<'public' | 'shielded'>('public');
  const [activeCode, setActiveCode] = useState<'shield' | 'decrypt' | 'transfer'>('shield');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fn = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentStep(s => (s + 1) % 4), 2200);
    return () => clearInterval(t);
  }, []);

  const c1 = useCounter(100, statsInView, 1200);
  const c2 = useCounter(7984, statsInView, 1400);
  const c3 = useCounter(2, statsInView, 800);

  const txSteps = [
    { label: 'FHE encrypt amount', detail: 'WASM encrypts amount → euint64 ciphertext', icon: Cpu, color: '#FFD208' },
    { label: 'Submit to blockchain', detail: 'from 0xAlice… to 0xBob… (addresses public)', icon: Network, color: '#3b82f6' },
    { label: 'FHEVM executes', detail: 'Coprocessor performs encrypted arithmetic', icon: Zap, color: '#8b5cf6' },
    { label: 'Balances updated', detail: 'Both balances updated as FHE ciphertexts', icon: CheckCircle2, color: '#10b981' },
  ];

  return (
    <div data-theme="light" style={{ background: '#fafafa', color: '#000', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.15} to{transform:translateY(-28px) rotate(180deg);opacity:.4} }
        @keyframes pulse-ring { 0%{transform:scale(.9);opacity:.8} 70%{transform:scale(1.2);opacity:0} 100%{transform:scale(.9);opacity:0} }
        @keyframes fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .hero-badge { animation: fade-up .8s ease both; }
        .hero-h1    { animation: fade-up .9s ease .1s both; }
        .hero-sub   { animation: fade-up .9s ease .25s both; }
        .hero-btns  { animation: fade-up .9s ease .4s both; }
        .hero-card  { animation: fade-up .9s ease .55s both; }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 clamp(24px, 4vw, 60px)', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: headerScrolled ? 'rgba(250,250,250,0.93)' : 'transparent',
        backdropFilter: headerScrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${headerScrolled ? '#e4e4e7' : 'transparent'}`,
        transition: 'all .35s ease',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(255,210,8,.45)' }}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none"><path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="#000" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#000' }}>Zama<span style={{ color: '#FFD208' }}>Vault</span></span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 2.5vw, 32px)' }}>
          {[['How it Works', '#how'], ['Technology', '#tech'], ['Developers', '#dev']].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: '.875rem', fontWeight: 600, color: '#27272a', textDecoration: 'none' }}>{l}</a>
          ))}
          <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#000', color: '#FFD208', fontWeight: 700, fontSize: '.875rem', borderRadius: '8px', textDecoration: 'none' }}>
            Launch App <ArrowRight size={14} />
          </Link>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px clamp(24px,6vw,80px) 80px', textAlign: 'center', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: '720px', height: '420px', background: 'radial-gradient(ellipse, rgba(255,210,8,.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(0,0,0,.1)', background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(12px)', fontSize: '.78rem', fontWeight: 700, color: '#27272a', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '28px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFD208', animation: 'blink 2s ease-in-out infinite' }} />
          Powered by Zama FHEVM · ERC-7984 Standard
        </div>

        <h1 className="hero-h1" style={{ fontSize: 'clamp(2.8rem,7vw,5.5rem)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.04em', color: '#000', maxWidth: '900px', marginBottom: '24px' }}>
          Confidential ERC-20 tokens,{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ background: 'linear-gradient(135deg, #000 0%, #3d3d3d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>homomorphically encrypted</span>
            <span style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, height: '5px', borderRadius: '3px', background: '#FFD208', opacity: .9 }} />
          </span>{' '}on-chain.
        </h1>

        <p className="hero-sub" style={{ fontSize: 'clamp(1.05rem,2.2vw,1.3rem)', lineHeight: 1.65, color: '#52525b', maxWidth: '620px', marginBottom: '44px' }}>
          ZamaVault wraps your ERC-20 tokens into <strong style={{ color: '#000' }}>ERC-7984 confidential cTokens</strong> via Zama&apos;s FHE protocol. Shield, transfer privately, and decrypt your balance — all self-custodial, on Ethereum.
        </p>

        <div className="hero-btns" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}>
          <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#FFD208', color: '#000', fontWeight: 800, fontSize: '1rem', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 4px 24px rgba(255,210,8,.45)' }}>
            <Shield size={18} /> Launch Vault
          </Link>
          <a href="https://docs.zama.org/protocol" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: 'transparent', color: '#000', fontWeight: 700, fontSize: '1rem', borderRadius: '10px', textDecoration: 'none', border: '2px solid #000' }}>
            <BookOpen size={18} /> Read the Docs
          </a>
        </div>

        {/* Floating card */}
        <div className="hero-card" style={{ display: 'inline-block' }}>
          <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e4e4e7', background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.12)', padding: '24px 32px', minWidth: '340px', textAlign: 'left', animation: 'floatUp 4s ease-in-out infinite alternate' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '14px' }}>cUSDC · Encrypted Balance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} /></div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.8rem', color: '#FFD208', fontWeight: 700 }}>0x48e1a6c0b...a49d</div>
                <div style={{ fontSize: '.7rem', color: '#a1a1aa' }}>euint64 FHE Ciphertext — on Sepolia</div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,210,8,.08)', border: '1px solid rgba(255,210,8,.2)', fontSize: '.74rem', color: '#92700a', fontWeight: 600 }}>
              Decrypt with EIP-712 permit — no gas required
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: .45 }}>
          <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#52525b' }}>Scroll</span>
          <ChevronDown size={16} style={{ color: '#52525b' }} />
        </div>
      </section>

      {/* ── TRUST RAIL ── */}
      <section style={{ borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7', background: '#fff', padding: '18px clamp(24px,6vw,80px)', display: 'flex', gap: '40px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['TFHE Encryption', 'ERC-7984 Standard', 'EIP-712 Permits', 'OpenZeppelin Audited', 'Zama Coprocessor', 'Non-Custodial'].map(item => (
          <div key={item} style={{ fontSize: '.82rem', fontWeight: 600, color: '#3f3f46', whiteSpace: 'nowrap', opacity: .7 }}>{item}</div>
        ))}
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: 'clamp(60px,8vw,100px) clamp(24px,6vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2px', background: '#e4e4e7', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e4e4e7', boxShadow: '0 4px 40px rgba(0,0,0,.06)' }}>
          {[
            { value: `${c1}%`, label: 'Homomorphic', sub: 'TFHE scheme — arithmetic on ciphertexts without decrypting', icon: Lock },
            { value: `ERC-${c2}`, label: 'Token Standard', sub: 'OpenZeppelin confidential token with euint64 on-chain balances', icon: Layers },
            { value: `${c3}-step`, label: 'Unshield Process', sub: 'On-chain unwrap + Gateway proof finalization', icon: Unlock },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', padding: '40px 36px' }}>
              <s.icon size={24} strokeWidth={2} style={{ color: '#FFD208', marginBottom: '10px' }} />
              <div style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#000' }}>{s.value}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#000', marginTop: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '.8rem', color: '#71717a', lineHeight: 1.5, marginTop: '6px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT IS ENCRYPTED ── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,210,8,.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealSection>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#FFD208', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '20px' }}>
              <Key size={11} /> Value-Privacy Model
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '700px', marginBottom: '18px' }}>
              What FHE protects — and what it doesn&apos;t.
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '560px', marginBottom: '60px' }}>
              Zama&apos;s FHE is a <strong style={{ color: '#fff' }}>value-privacy model</strong>. It encrypts amounts and balances — not participants. Addresses remain publicly visible on-chain.
            </p>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '24px' }}>
            <RevealSection delay={100}>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(255,210,8,.25)', background: 'rgba(255,210,8,.06)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,210,8,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} style={{ color: '#FFD208' }} /></div>
                  <span style={{ color: '#FFD208', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Encrypted On-Chain</span>
                </div>
                {[{ t: 'Token balances', d: 'Stored as euint64 FHE ciphertext' }, { t: 'Confidential transfer amounts', d: 'FHE-encrypted client-side before tx' }, { t: 'Intermediate computation', d: 'FHE arithmetic never reveals plaintext' }].map((r, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid rgba(255,210,8,.1)' : 'none' }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '.9rem', marginBottom: '4px' }}>{r.t}</div>
                    <div style={{ color: '#71717a', fontSize: '.78rem' }}>{r.d}</div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={200}>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={18} style={{ color: '#a1a1aa' }} /></div>
                  <span style={{ color: '#a1a1aa', fontWeight: 700, fontSize: '.82rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Publicly Visible</span>
                </div>
                {[{ t: 'Sender & recipient addresses', d: 'FHE hides values, not participants' }, { t: 'Shield & unshield amounts', d: 'Public ERC-20 movement — visible on explorer' }, { t: 'Transaction type & timing', d: 'Transfer, shield, or unshield is observable' }, { t: 'Token contract address', d: 'Which cToken is involved' }].map((r, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                    <div style={{ color: '#e4e4e7', fontWeight: 600, fontSize: '.9rem', marginBottom: '4px' }}>{r.t}</div>
                    <div style={{ color: '#52525b', fontSize: '.78rem' }}>{r.d}</div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={300}>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
                <div>
                  <AlertTriangle size={28} style={{ color: '#FFD208', marginBottom: '16px' }} />
                  <p style={{ color: '#a1a1aa', lineHeight: 1.7, fontSize: '.9rem' }}>
                    An observer sees that <strong style={{ color: '#fff' }}>0xAlice sent a confidential transfer to 0xBob</strong> on cUSDC. They <strong style={{ color: '#FFD208' }}>cannot see how much was sent.</strong>
                  </p>
                </div>
                <div style={{ marginTop: '28px', padding: '16px', borderRadius: '10px', background: 'rgba(255,210,8,.08)', border: '1px solid rgba(255,210,8,.2)' }}>
                  <p style={{ color: '#FFD208', fontSize: '.8rem', fontWeight: 600, lineHeight: 1.5 }}>For full graph privacy, combine with stealth addresses or mixers on top of FHE.</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE LEDGER ── */}
      <section id="how" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fafafa' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <RevealSection style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,210,8,.12)', border: '1px solid rgba(255,210,8,.3)', fontSize: '.75rem', fontWeight: 700, color: '#92700a', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Interactive Playground</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>Public ledger vs. FHE-shielded ledger</h2>
            <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '540px', margin: '0 auto', lineHeight: 1.65 }}>Toggle between states. Notice addresses are always public — only amounts become encrypted ciphertexts.</p>
          </RevealSection>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', background: '#e4e4e7', borderRadius: '12px', padding: '4px', gap: '4px' }}>
              {(['public', 'shielded'] as const).map(s => (
                <button key={s} onClick={() => setVizState(s)} style={{ padding: '10px 24px', borderRadius: '9px', border: 'none', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer', background: vizState === s ? (s === 'shielded' ? '#FFD208' : '#fff') : 'transparent', color: vizState === s ? '#000' : '#71717a', boxShadow: vizState === s ? '0 2px 8px rgba(0,0,0,.1)' : 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all .2s ease' }}>
                  {s === 'shielded' ? <Lock size={13} /> : <Eye size={13} />}
                  {s === 'public' ? 'Public ERC-20' : 'FHE Shielded cToken'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '20px', border: `2px solid ${vizState === 'shielded' ? '#FFD208' : '#e4e4e7'}`, background: '#fff', overflow: 'hidden', boxShadow: vizState === 'shielded' ? '0 0 40px rgba(255,210,8,.15)' : '0 4px 24px rgba(0,0,0,.06)', transition: 'all .4s ease' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e4e4e7', background: vizState === 'shielded' ? 'rgba(255,210,8,.06)' : '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background .4s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: vizState === 'shielded' ? '#FFD208' : '#10b981', boxShadow: vizState === 'shielded' ? '0 0 10px rgba(255,210,8,.7)' : 'none', transition: 'all .4s ease' }} />
                <span style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#71717a' }}>{vizState === 'public' ? 'Public Ledger State' : 'Encrypted Ledger State'}</span>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: vizState === 'shielded' ? 'rgba(255,210,8,.15)' : 'rgba(16,185,129,.1)', color: vizState === 'shielded' ? '#92700a' : '#059669', transition: 'all .4s ease' }}>
                {vizState === 'public' ? 'READABLE' : 'CRYPTOGRAPHICALLY PROTECTED'}
              </span>
            </div>
            {[
              { label: 'Sender Address', pub: '0x23D4…8234', enc: '0x23D4…8234', priv: false, note: 'Always public — FHE hides values, not participants' },
              { label: 'Recipient Address', pub: '0x4aB9…F012', enc: '0x4aB9…F012', priv: false, note: 'Always public — FHE hides values, not participants' },
              { label: 'Transfer Amount', pub: '50,000.00 USDC', enc: '0x7f2c1a4…d3 ← euint64', priv: true, note: 'FHE-encrypted client-side before the transaction is sent' },
              { label: 'Sender Balance', pub: '125,300.50 USDC', enc: '0x9e81fa2…91 ← euint64', priv: true, note: 'Updated as ciphertext — FHE arithmetic without decrypting' },
              { label: 'Recipient Balance', pub: '18,750.00 USDC', enc: '0x3d4a7b0…42 ← euint64', priv: true, note: 'Only owner can decrypt via EIP-712 permit' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '18px 24px', borderBottom: i < 4 ? '1px solid #f4f4f5' : 'none', background: vizState === 'shielded' && row.priv ? 'rgba(255,210,8,.02)' : 'transparent', transition: 'background .4s ease', fontFamily: 'JetBrains Mono, monospace', alignItems: 'start' }}>
                <span style={{ fontSize: '.8rem', color: '#71717a', paddingTop: '2px' }}>{row.label}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {vizState === 'shielded' && row.priv
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFD208', fontWeight: 700, fontSize: '.8rem' }}><EyeOff size={13} /> {row.enc}</span>
                      : <span style={{ color: '#000', fontWeight: 600, fontSize: '.8rem' }}>{row.pub}</span>
                    }
                    {vizState === 'shielded' && !row.priv && <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,.15)', fontFamily: 'sans-serif' }}>VISIBLE</span>}
                  </div>
                  {vizState === 'shielded' && <div style={{ fontSize: '.7rem', color: '#a1a1aa', marginTop: '4px', fontFamily: 'sans-serif' }}>{row.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRANSFER FLOW ── */}
      <section style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealSection style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>How a confidential transfer works</h2>
            <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.65 }}>Amount is encrypted in WASM before it ever touches the blockchain.</p>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '0' }}>
            {txSteps.map((step, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div style={{ padding: '32px 28px', borderLeft: i > 0 ? '1px solid #e4e4e7' : 'none', borderTop: `3px solid ${i === currentStep ? step.color : '#e4e4e7'}`, background: i === currentStep ? `${step.color}08` : '#fff', transition: 'all .4s ease' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: i === currentStep ? step.color : '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', transition: 'all .4s ease', ...(i === currentStep ? { boxShadow: `0 4px 20px ${step.color}40` } : {}) }}>
                    <step.icon size={22} style={{ color: i === currentStep ? '#000' : '#71717a' }} />
                  </div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '8px' }}>Step {i + 1}</div>
                  <div style={{ fontWeight: 800, color: '#000', fontSize: '1rem', marginBottom: '8px' }}>{step.label}</div>
                  <div style={{ fontSize: '.82rem', color: '#71717a', lineHeight: 1.55, fontFamily: 'JetBrains Mono, monospace' }}>{step.detail}</div>
                </div>
              </RevealSection>
            ))}
          </div>
          <RevealSection delay={200}>
            <div style={{ marginTop: '32px', padding: '24px 28px', borderRadius: '16px', background: '#fafafa', border: '1px solid #e4e4e7', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '.72rem', color: '#a1a1aa', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>What the blockchain sees</div>
                <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.8rem', color: '#000' }}>
                  from: 0x23D4…8234 → to: 0x4aB9…F012 · amount: <span style={{ color: '#FFD208', fontWeight: 700 }}>0x9e81f…← encrypted</span>
                </code>
              </div>
              <ArrowRight size={20} style={{ color: '#d1d1d6', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '.72rem', color: '#a1a1aa', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>What an observer learns</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(239,68,68,.08)', color: '#dc2626', fontSize: '.78rem', fontWeight: 600 }}>sender ✓ visible</span>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(239,68,68,.08)', color: '#dc2626', fontSize: '.78rem', fontWeight: 600 }}>recipient ✓ visible</span>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(255,210,8,.12)', color: '#92700a', fontSize: '.78rem', fontWeight: 600 }}>amount hidden</span>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── DEVELOPER SDK ── */}
      <section id="dev" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fafafa' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '64px', alignItems: 'start' }}>
          <RevealSection>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,210,8,.12)', border: '1px solid rgba(255,210,8,.3)', fontSize: '.75rem', fontWeight: 700, color: '#92700a', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>For Developers</span>
            <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.8rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.15 }}>Integrate confidential tokens in minutes.</h2>
            <p style={{ color: '#52525b', fontSize: '.95rem', lineHeight: 1.7, marginBottom: '32px' }}>
              <code style={{ fontFamily: 'JetBrains Mono', background: '#f0f0f0', padding: '1px 6px', borderRadius: '4px', fontSize: '.88em' }}>@zama-fhe/react-sdk</code> handles WASM encryption, permit caching, and Gateway communication.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
              {[
                { l: 'Auto ERC-1363 detection', d: 'SDK picks optimal shield path (1-tx or 2-tx)' },
                { l: 'EIP-712 permit caching', d: 'Sign once, read balance silently after' },
                { l: 'WASM ZK prover', d: 'Zero-knowledge proofs generated in browser' },
                { l: 'SHA-384 integrity check', d: 'CDN WASM bundle verified before execution' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} style={{ color: '#FFD208', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#000', fontSize: '.9rem' }}>{f.l}</div>
                    <div style={{ color: '#71717a', fontSize: '.8rem' }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <a href="https://docs.zama.org/protocol/sdk" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#000', color: '#FFD208', fontWeight: 700, fontSize: '.875rem', borderRadius: '10px', textDecoration: 'none' }}>
              <ExternalLink size={15} /> SDK Documentation
            </a>
          </RevealSection>

          <RevealSection delay={150}>
            <div style={{ borderRadius: '16px', border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.08)' }}>
              <div style={{ display: 'flex', background: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
                {(['shield', 'decrypt', 'transfer'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveCode(tab)} style={{ padding: '12px 18px', border: 'none', background: activeCode === tab ? '#fff' : 'transparent', borderBottom: activeCode === tab ? '2px solid #FFD208' : '2px solid transparent', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', color: activeCode === tab ? '#000' : '#71717a', transition: 'all .2s ease' }}>
                    {tab === 'shield' ? 'useShield' : tab === 'decrypt' ? 'useConfidentialBalance' : 'useConfidentialTransfer'}
                  </button>
                ))}
              </div>
              <div style={{ background: '#0d0d0d', padding: '28px', overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.76rem', lineHeight: 1.75, color: '#d4d4d4', margin: 0 }}>{CODE_SNIPPETS[activeCode]}</pre>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── ARCH dark ── */}
      <section id="tech" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse,rgba(255,210,8,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <RevealSection style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#FFD208', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Architecture</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '14px' }}>Zama Coprocessor</h2>
            <p style={{ color: '#a1a1aa', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.65 }}>Heavy FHE computations run off-chain. Results are verified and published back to the EVM.</p>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr 48px 1fr', gap: '0', alignItems: 'center' }}>
            {[
              { label: 'Your Browser', sub: 'Client-side', icon: Globe, items: ['FHE encrypt amount', 'Generate ZK proof', 'Sign EIP-712 permit'], color: '#3b82f6' },
              null,
              { label: 'Ethereum FHEVM', sub: 'On-chain', icon: Database, items: ['Store euint64 handles', 'Emit FHE op events', 'Manage ACL'], color: '#8b5cf6' },
              null,
              { label: 'Zama Coprocessor', sub: 'Off-chain FHE', icon: Cpu, items: ['Execute FHE arithmetic', 'Validate ZK proofs', 'Publish results'], color: '#FFD208' },
            ].map((item, i) => {
              if (!item) return <div key={i} style={{ display: 'flex', justifyContent: 'center' }}><ArrowRight size={18} style={{ color: '#3f3f46' }} /></div>;
              return (
                <RevealSection key={i} delay={i * 80}>
                  <div style={{ padding: '24px', border: `1px solid ${item.color}20`, borderRadius: '14px', background: `${item.color}06` }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <item.icon size={19} style={{ color: item.color }} />
                    </div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '.9rem', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{ fontSize: '.72rem', color: '#52525b', marginBottom: '14px' }}>{item.sub}</div>
                    {item.items.map((line, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '5px 0', borderTop: j > 0 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '.76rem', color: '#71717a' }}>{line}</span>
                      </div>
                    ))}
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(80px,12vw,160px) clamp(24px,6vw,80px)', background: '#000', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,210,8,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        {[1, 2, 3].map(r => <div key={r} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: `${r * 280}px`, height: `${r * 280}px`, borderRadius: '50%', border: '1px solid rgba(255,210,8,.08)', pointerEvents: 'none', animation: `pulse-ring ${3 + r * .8}s ease-out ${r * .6}s infinite` }} />)}
        <RevealSection style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2.2rem,6vw,4.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px', maxWidth: '720px', margin: '0 auto 24px' }}>Shield your first tokens today.</h2>
          <p style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '440px', margin: '0 auto 48px' }}>Connect your wallet and explore the registry on Sepolia. Use the Faucet for free test tokens.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '18px 36px', background: '#FFD208', color: '#000', fontWeight: 800, fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 40px rgba(255,210,8,.35)' }}>
              <Shield size={20} /> Launch ZamaVault <ArrowRight size={18} />
            </Link>
            <a href="https://docs.zama.org/protocol" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '18px 36px', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none', border: '2px solid rgba(255,255,255,.15)' }}>
              <BookOpen size={20} /> Zama Docs
            </a>
          </div>
        </RevealSection>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '36px clamp(24px,6vw,80px)', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none"><path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="#000" /></svg>
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>Zama<span style={{ color: '#FFD208' }}>Vault</span></span>
          <span style={{ color: '#3f3f46', fontSize: '.78rem', marginLeft: '8px' }}>Built on Zama FHEVM · ERC-7984</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[{ l: 'Zama Protocol', h: 'https://docs.zama.org/protocol' }, { l: 'Security Model', h: 'https://docs.zama.org/protocol/sdk/concepts/security-model' }, { l: 'GitHub', h: 'https://github.com/hosein-ul/zamavault' }, { l: 'App →', h: '/app' }].map(link => (
            <a key={link.l} href={link.h} target={link.h.startsWith('http') ? '_blank' : undefined} rel={link.h.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ fontSize: '.8rem', fontWeight: 600, color: '#52525b', textDecoration: 'none' }}>{link.l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
