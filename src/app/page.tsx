'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './globals.css';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from 'motion/react';
import { BlurFade } from '@/components/magic/blur-fade';
import { NumberTicker } from '@/components/magic/number-ticker';
import { MagicCard } from '@/components/magic/magic-card';
import { BorderBeam } from '@/components/magic/border-beam';
import { Marquee } from '@/components/magic/marquee';
import {
  Shield, Lock, Unlock, Eye, EyeOff, Key, BookOpen,
  CheckCircle2, AlertTriangle, Globe, ChevronDown,
  ExternalLink, Cpu, Database, Network, Layers, ArrowRight,
  Activity, Droplets, GraduationCap, Wallet, BarChart3,
  FileText, Wrench, Zap,
} from 'lucide-react';

// ─── Scroll progress bar ─────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      scaleX, position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
      background: 'linear-gradient(90deg, #FFD208, #000)',
      transformOrigin: '0%', zIndex: 1000, pointerEvents: 'none',
    }} />
  );
}

// ─── HERO — sticky parallax fade ─────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y       = useTransform(scrollYProgress, [0, 1], ['0%', '26%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale   = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.section ref={ref} style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '100px clamp(24px,6vw,80px) 40px',
      textAlign: 'center', overflow: 'hidden', background: '#fafafa',
    }}>
      {/* Sticky header */}
      <motion.header
        animate={{ background: scrolled ? 'rgba(250,250,250,0.94)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottomColor: scrolled ? '#e4e4e7' : 'transparent' }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 clamp(24px,4vw,60px)', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid transparent' }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <motion.div whileHover={{ rotate: 12, scale: 1.1 }} style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 14px rgba(255,210,8,.5)' }}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none"><path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="#000" /></svg>
          </motion.div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#000' }}>Zama<span style={{ color: '#FFD208' }}>Vault</span></span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.5vw,32px)' }}>
          {[['How It Works', '#how'], ['App Pages', '#app'], ['Technology', '#tech']].map(([l, h]) => (
            <motion.a key={l} href={h} whileHover={{ y: -1 }} style={{ fontSize: '.875rem', fontWeight: 600, color: '#52525b', textDecoration: 'none' }}>{l}</motion.a>
          ))}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: '#000', color: '#FFD208', fontWeight: 700, fontSize: '.875rem', borderRadius: '8px', textDecoration: 'none' }}>
              Launch App <ArrowRight size={14} />
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      {/* Grid bg */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', width: '760px', height: '440px', background: 'radial-gradient(ellipse,rgba(255,210,8,.16) 0%,transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

      {/* Parallax content block */}
      <motion.div style={{ y, opacity, scale, width: '100%', maxWidth: '1000px' }}>

        {/* Live badge */}
        <BlurFade delay={0} inView>
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(0,0,0,.1)', background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(12px)', fontSize: '.78rem', fontWeight: 700, color: '#27272a', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '20px' }}
          >
            <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, .5, 1] }} transition={{ repeat: Infinity, duration: 2.2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFD208', display: 'block' }} />
            Live on Ethereum Sepolia · ERC-7984 Standard
          </motion.div>
        </BlurFade>

        {/* Headline — about the project, not a tautology */}
        <BlurFade delay={0.12} inView>
          <h1 style={{ fontSize: 'clamp(2.5rem,5.5vw,4.4rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.045em', color: '#000', margin: '0 auto 16px', maxWidth: '920px' }}>
            Shield ERC-20 tokens.{' '}
            <br />
            <span style={{ background: 'linear-gradient(130deg, #FFD208 0%, #f59e0b 55%, #b45309 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Transfer amounts stay encrypted.
            </span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.32} inView>
          <p style={{ fontSize: 'clamp(0.95rem,1.8vw,1.1rem)', lineHeight: 1.7, color: '#52525b', maxWidth: '600px', margin: '0 auto 24px' }}>
            ZamaVault converts public ERC-20 tokens into{' '}
            <strong style={{ color: '#000' }}>ERC-7984 confidential cTokens</strong>{' '}
            via Zama&apos;s Fully Homomorphic Encryption. Balances are stored as on-chain ciphertexts — computable without decrypting.
          </p>
        </BlurFade>

        {/* CTAs */}
        <BlurFade delay={0.46} inView>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#FFD208', color: '#000', fontWeight: 800, fontSize: '1rem', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 4px 28px rgba(255,210,8,.5)' }}>
                <Shield size={18} /> Launch ZamaVault
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link href="/app/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: 'transparent', color: '#000', fontWeight: 700, fontSize: '1rem', borderRadius: '10px', textDecoration: 'none', border: '2px solid #000' }}>
                <BookOpen size={18} /> Read the Docs
              </Link>
            </motion.div>
          </div>
        </BlurFade>

        {/* 3 micro-stat pills */}
        <BlurFade delay={0.58} inView>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: Lock, label: 'TFHE on-chain ciphertext' },
              { icon: Key, label: 'EIP-712 decrypt permits' },
              { icon: Zap, label: 'Zama Coprocessor verified' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 16px', borderRadius: '100px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '.78rem', fontWeight: 600, color: '#52525b' }}>
                <p.icon size={13} style={{ color: '#FFD208' }} />
                {p.label}
              </div>
            ))}
          </div>
        </BlurFade>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div animate={{ y: [0, 8, 0], opacity: [.4, .9, .4] }} transition={{ duration: 2.2, repeat: Infinity }} style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#a1a1aa' }}>Scroll</span>
        <ChevronDown size={16} style={{ color: '#a1a1aa' }} />
      </motion.div>
    </motion.section>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
const TRUST = ['TFHE Encryption','ERC-7984 Standard','EIP-712 Permits','OpenZeppelin Audited','Zama Coprocessor','Non-Custodial','Sepolia Testnet','WASM ZK Prover','Zero-Gas Decrypt'];

// ─── PINNED STORYTELLING ─────────────────────────────────────────────────────
function PinnedStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const raw = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 3]);
  const [ch, setCh] = useState(0);
  useEffect(() => raw.on('change', v => setCh(Math.min(3, Math.floor(v)))), [raw]);

  const chapters = [
    { label: 'The Problem', icon: Eye, color: '#ef4444', title: 'Ethereum has zero financial privacy.', body: 'Every balance, transfer amount, and token holding is visible on block explorers. Your DeFi activity is permanently public by default — anyone can trace your portfolio.' },
    { label: 'The Protocol', icon: Cpu, color: '#3b82f6', title: 'Fully Homomorphic Encryption on-chain.', body: "Zama's FHEVM lets smart contracts compute on encrypted integers (euint64) without ever decrypting them. Balances remain ciphertexts — arithmetic happens over encrypted data." },
    { label: 'Privacy Boundary', icon: Lock, color: '#FFD208', title: 'Amounts private. Addresses visible.', body: 'FHE is a value-privacy model. Transfer amounts and balances are encrypted. Sender and recipient addresses remain public — observable on the blockchain.' },
    { label: 'ZamaVault', icon: Shield, color: '#10b981', title: 'Shield, transfer, decrypt — self-custodial.', body: 'Wrap ERC-20 into ERC-7984 cTokens. Transfer confidentially. Decrypt your balance with a read-only EIP-712 permit — no gas, no approval, plaintext never leaves your browser.' },
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '400vh', background: '#000' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex' }}>
        {/* Chapter nav */}
        <div style={{ width: 'clamp(200px,24vw,300px)', padding: '80px clamp(20px,3.5vw,44px)', borderRight: '1px solid rgba(255,255,255,.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
          {chapters.map((c, i) => (
            <motion.div key={i} animate={{ opacity: i === ch ? 1 : 0.28, x: i === ch ? 0 : -6 }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px' }}>
              <motion.div animate={{ background: i === ch ? c.color : 'rgba(255,255,255,.05)' }} style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon size={17} style={{ color: i === ch ? '#000' : '#52525b' }} />
              </motion.div>
              <div>
                <div style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: i === ch ? c.color : '#52525b' }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontWeight: 700, color: i === ch ? '#fff' : '#52525b', fontSize: '.84rem' }}>{c.label}</div>
              </div>
            </motion.div>
          ))}
          <div style={{ marginTop: '28px', padding: '0 14px' }}>
            <div style={{ height: '2px', background: 'rgba(255,255,255,.07)', borderRadius: '1px', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: chapters[ch].color, width: `${((ch + 1) / 4) * 100}%`, transition: 'width .5s ease, background .4s ease' }} />
            </div>
          </div>
        </div>

        {/* Morphing content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px clamp(32px,6vw,80px)', position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={ch} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 50% at 60% 40%, ${chapters[ch].color}14 0%, transparent 70%)` }} />
          </AnimatePresence>

          <div style={{ maxWidth: '560px', width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={ch}
                initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -22, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', marginBottom: '20px', background: `${chapters[ch].color}16`, border: `1px solid ${chapters[ch].color}28`, fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: chapters[ch].color }}>
                  {chapters[ch].label}
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, marginBottom: '20px' }}>
                  {chapters[ch].title}
                </h2>
                <p style={{ color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '32px' }}>
                  {chapters[ch].body}
                </p>

                {/* Inline visual per chapter */}
                {ch === 0 && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '.78rem', background: '#0d0d0d', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,.06)' }}>
                    {[['Amount','50,000 USDC'],['Sender','0x23D4…8234'],['Recipient','0x4aB9…F012'],['Balance','125,300 USDC']].map(([k, v], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                        <span style={{ color: '#52525b' }}>{k}</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{v} — visible</span>
                      </div>
                    ))}
                  </div>
                )}
                {ch === 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[['Add ciphertexts','euint64 + euint64'],['Multiply','no plaintext needed'],['Compare','encrypted comparison'],['Decrypt locally','WASM in browser']].map(([op, detail], i) => (
                      <motion.div key={op} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .08 }} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)' }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '2px' }}>{op}</div>
                        <div style={{ fontSize: '.7rem', color: '#52525b' }}>{detail}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {ch === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[{l:'Transfer Amount',priv:true},{l:'Token Balances',priv:true},{l:'Sender Address',priv:false},{l:'Recipient Address',priv:false}].map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .08 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: '8px', background: r.priv ? 'rgba(255,210,8,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${r.priv ? 'rgba(255,210,8,.18)' : 'rgba(255,255,255,.06)'}` }}>
                        <span style={{ fontSize: '.82rem', color: '#a1a1aa' }}>{r.l}</span>
                        {r.priv
                          ? <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#FFD208', display: 'flex', alignItems: 'center', gap: '4px' }}><EyeOff size={12} /> ENCRYPTED</span>
                          : <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> VISIBLE</span>
                        }
                      </motion.div>
                    ))}
                  </div>
                )}
                {ch === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[{s:'Shield ERC-20',d:'transferAndCall or approve+wrap → cToken minted',i:Shield},{s:'Transfer cToken',d:'Amount encrypted in WASM → euint64 ciphertext on-chain',i:Lock},{s:'Decrypt Balance',d:'EIP-712 permit → KMS re-encrypt → WASM local decrypt',i:Key}].map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .1 }} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.18)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <r.i size={18} style={{ color: '#000' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '.88rem' }}>{r.s}</div>
                          <div style={{ fontSize: '.73rem', color: '#6ee7b7', marginTop: '2px' }}>{r.d}</div>
                        </div>
                        <CheckCircle2 size={17} style={{ color: '#10b981', flexShrink: 0 }} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HORIZONTAL SCROLL — App Pages ──────────────────────────────────────────
const APP_PAGES = [
  { href: '/app',            icon: Database,     label: 'Registry',     desc: 'Browse ERC-7984 wrappers on Sepolia and Mainnet. View live encrypted balances for connected wallets.',           color: '#3b82f6', tag: 'Explorer'   },
  { href: '/app/wrap',       icon: Shield,       label: 'Wrap / Unwrap',desc: 'Shield ERC-20 → encrypted cToken. SDK auto-selects 1-tx (ERC-1363) or 2-tx (approve+wrap) path.',              color: '#FFD208', tag: 'Core'       },
  { href: '/app/portfolio',  icon: Wallet,       label: 'Portfolio',    desc: 'Track all your shielded and unshielded balances. Decrypt FHE ciphertexts with EIP-712 permits.',                 color: '#10b981', tag: 'My Assets'  },
  { href: '/app/analytics',  icon: BarChart3,    label: 'Analytics',    desc: 'Total Value Shielded, 24h shield/unshield volume, and per-token activity across the registry.',                  color: '#8b5cf6', tag: 'Insights'   },
  { href: '/app/faucet',     icon: Droplets,     label: 'Faucet',       desc: 'Mint free Sepolia testnet mock tokens (USDC, WBTC). Start the full FHE flow without real funds.',               color: '#06b6d4', tag: 'Testnet'    },
  { href: '/app/learn',      icon: GraduationCap,label: 'Learn',        desc: 'Step-by-step tutorial: connect wallet → get tokens → shield → decrypt balance. Interactive with rewards.',       color: '#f59e0b', tag: 'Tutorial'   },
  { href: '/app/developers', icon: Wrench,       label: 'Dev Tools',    desc: 'Raw contract ABI explorer, SDK hook reference, and integration helpers for building on ERC-7984.',              color: '#ef4444', tag: 'Builder'    },
  { href: '/app/docs',       icon: FileText,     label: 'Docs',         desc: 'ERC-7984 architecture, wrapper mechanics, permit model, and full SDK hook API reference.',                      color: '#64748b', tag: 'Reference'  },
];

function HorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-62%']);
  const xS = useSpring(x, { stiffness: 80, damping: 20 });

  return (
    <div ref={ref} id="app" style={{ position: 'relative', height: '300vh', background: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ padding: 'clamp(40px,5vw,64px) clamp(24px,6vw,80px) 20px' }}>
          <BlurFade inView>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', background: 'rgba(255,210,8,.1)', border: '1px solid rgba(255,210,8,.3)', fontSize: '.75rem', fontWeight: 700, color: '#92700a', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>The Dashboard</span>
            <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '4px' }}>Eight pages for confidential DeFi.</h2>
            <p style={{ color: '#71717a', fontSize: '.9rem' }}>Drag or scroll to explore all pages.</p>
          </BlurFade>
        </div>
        <div style={{ overflow: 'hidden', paddingLeft: 'clamp(24px,6vw,80px)' }}>
          <motion.div style={{ x: xS, display: 'flex', gap: '18px', width: 'max-content', paddingBottom: '24px', paddingRight: '80px' }}>
            {APP_PAGES.map((page, i) => (
              <motion.div key={page.href} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .04 }} whileHover={{ y: -6 }} style={{ width: '278px', flexShrink: 0 }}>
                <Link href={page.href} style={{ textDecoration: 'none', display: 'block' }}>
                  <MagicCard mode="orb" glowFrom={`${page.color}40`} glowTo={`${page.color}05`} glowSize={200} glowBlur={80} glowOpacity={0.7}>
                    <div style={{ padding: '26px 22px', border: '1px solid #e4e4e7', borderRadius: '16px', background: '#fff', cursor: 'pointer', height: '220px', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: `${page.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <page.icon size={21} style={{ color: page.color }} />
                        </div>
                        <span style={{ fontSize: '.66rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: `${page.color}12`, color: page.color, letterSpacing: '.04em', textTransform: 'uppercase', border: `1px solid ${page.color}22` }}>{page.tag}</span>
                      </div>
                      <div style={{ fontWeight: 800, color: '#000', marginBottom: '8px', fontSize: '1rem' }}>{page.label}</div>
                      <p style={{ fontSize: '.79rem', color: '#52525b', lineHeight: 1.6, margin: 0 }}>{page.desc}</p>
                      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.78rem', fontWeight: 700, color: page.color }}>Open <ArrowRight size={12} /></div>
                    </div>
                  </MagicCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── ANIMATED TIMELINE ───────────────────────────────────────────────────────
const STEPS = [
  { n:'01', icon:Droplets, color:'#06b6d4', title:'Get Test Tokens',       body:'Visit the Faucet and mint free Sepolia testnet tokens (USDC, WBTC). No real funds required to test the complete FHE flow.', link:'/app/faucet' },
  { n:'02', icon:Shield,   color:'#FFD208', title:'Shield Your ERC-20',    body:'The SDK auto-detects ERC-1363 (one transferAndCall tx) or standard (approve + wrap). Your balance is now a euint64 ciphertext on-chain.', link:'/app/wrap' },
  { n:'03', icon:EyeOff,   color:'#8b5cf6', title:'Transfer Confidentially',body:'Amounts are encrypted by WASM before the tx is broadcast. On-chain: sender and recipient are visible — only the amount is a ciphertext.', link:'/app' },
  { n:'04', icon:Key,      color:'#10b981', title:'Decrypt Your Balance',  body:'Sign an EIP-712 read-only permit. The Zama Gateway re-encrypts to your transport key. WASM decrypts locally — plaintext never leaves the browser.', link:'/app/portfolio' },
];

function StepTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.3'] });
  const h = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const hS = useSpring(h, { stiffness: 55, damping: 20 });

  return (
    <section ref={ref} id="how" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fafafa' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '72px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>From public ERC-20 to private cToken.</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.65 }}>Four steps. Self-custodial. No third party sees your balance.</p>
        </BlurFade>

        <div style={{ position: 'relative' }}>
          {/* Animated vertical progress line */}
          <div style={{ position: 'absolute', left: '27px', top: '28px', bottom: '28px', width: '2px', background: '#e4e4e7', borderRadius: '1px' }}>
            <motion.div style={{ height: hS, background: 'linear-gradient(180deg,#FFD208,#10b981)', borderRadius: '1px', width: '100%' }} />
          </div>

          {STEPS.map((step, i) => {
            const stepRef = useRef<HTMLDivElement>(null);
            const inV = useInView(stepRef, { once: false, margin: '-30% 0px -30% 0px' });
            return (
              <motion.div ref={stepRef} key={i} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-20% 0px -20% 0px' }} transition={{ duration: 0.6, ease: [.22, 1, .36, 1], delay: .04 }} style={{ display: 'flex', gap: '32px', paddingBottom: '56px', position: 'relative' }}>
                <motion.div animate={{ background: inV ? step.color : '#e4e4e7', boxShadow: inV ? `0 0 0 6px ${step.color}20` : 'none' }} transition={{ duration: 0.4 }} style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, position: 'relative' }}>
                  <step.icon size={24} style={{ color: inV ? '#000' : '#a1a1aa', transition: 'color .3s' }} />
                </motion.div>
                <div style={{ paddingTop: '10px', flex: 1 }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '8px' }}>Step {step.n}</div>
                  <motion.h3 animate={{ color: inV ? '#000' : '#71717a' }} style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '12px' }}>{step.title}</motion.h3>
                  <p style={{ color: '#52525b', fontSize: '.9rem', lineHeight: 1.7, maxWidth: '520px', marginBottom: '16px' }}>{step.body}</p>
                  <Link href={step.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '.8rem', fontWeight: 700, color: step.color, textDecoration: 'none' }}>Try it <ArrowRight size={12} /></Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section style={{ padding: 'clamp(60px,8vw,100px) clamp(24px,6vw,80px)', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <BlurFade inView delay={0}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2px', background: '#e4e4e7', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e4e4e7', boxShadow: '0 4px 40px rgba(0,0,0,.04)' }}>
            {[
              { prefix:'',value:100,suffix:'%',label:'Homomorphic Encryption',sub:'TFHE — arithmetic on encrypted integers without decrypting',icon:Lock },
              { prefix:'ERC-',value:7984,suffix:'',label:'Confidential Token Standard',sub:'euint64 ciphertext balances, OpenZeppelin-based wrapper',icon:Layers },
              { prefix:'',value:8,suffix:' Pages',label:'Full Dashboard',sub:'Registry · Wrap · Portfolio · Analytics · Faucet · Learn · Dev · Docs',icon:Activity },
            ].map((s, i) => (
              <BlurFade key={i} inView delay={i * .1}>
                <div style={{ background: '#fff', padding: '40px 36px' }}>
                  <s.icon size={24} style={{ color: '#FFD208', marginBottom: '14px' }} />
                  <div style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#000', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    {s.prefix}
                    {s.value === 7984 ? (
                      <span>{s.value}</span>
                    ) : (
                      <NumberTicker value={s.value} className="!text-black !tracking-tight" />
                    )}
                    {s.suffix}
                  </div>
                  <div style={{ fontWeight: 700, color: '#000', marginTop: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '.78rem', color: '#71717a', marginTop: '6px', lineHeight: 1.55 }}>{s.sub}</div>
                </div>
              </BlurFade>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

// ─── ARCHITECTURE ────────────────────────────────────────────────────────────
function Architecture() {
  return (
    <section id="tech" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#FFD208', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Architecture</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '14px' }}>Zama Coprocessor</h2>
          <p style={{ color: '#71717a', fontSize: '1rem', maxWidth: '460px', margin: '0 auto', lineHeight: 1.65 }}>FHE computations run off-chain in a decentralized Coprocessor. Results are cryptographically verified before landing on-chain.</p>
        </BlurFade>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr 40px 1fr', gap: '0', alignItems: 'center' }}>
          {[
            { label:'Your Browser',   sub:'Client-side',  icon:Globe,    items:['FHE-encrypt amount','Generate ZK proof','Sign EIP-712 permit'],   color:'#3b82f6' },
            null,
            { label:'Ethereum FHEVM', sub:'On-chain',     icon:Database, items:['Store euint64 handles','Emit FHE events','Manage ACL'],            color:'#8b5cf6' },
            null,
            { label:'Zama Coprocessor',sub:'Off-chain FHE',icon:Cpu,    items:['Execute FHE arithmetic','Validate ZK proofs','Publish results'],    color:'#FFD208' },
          ].map((item, i) => {
            if (!item) return <div key={i} style={{ display: 'flex', justifyContent: 'center' }}><motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}><ArrowRight size={18} style={{ color: '#3f3f46' }} /></motion.div></div>;
            return (
              <BlurFade key={i} inView delay={i * .09}>
                <MagicCard mode="orb" glowFrom={`${item.color}25`} glowTo="transparent" glowSize={200} glowBlur={60} glowOpacity={0.5}>
                  <div style={{ padding: '22px', border: `1px solid ${item.color}20`, borderRadius: '14px', background: `${item.color}06` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><item.icon size={18} style={{ color: item.color }} /></div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '.88rem', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '.7rem', color: '#52525b', marginBottom: '12px' }}>{item.sub}</div>
                    {item.items.map((line, j) => (
                      <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0', borderTop: j > 0 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '.74rem', color: '#71717a' }}>{line}</span>
                      </div>
                    ))}
                  </div>
                </MagicCard>
              </BlurFade>
            );
          })}
        </div>

        <BlurFade inView delay={0.4} style={{ marginTop: '28px' }}>
          <div style={{ padding: '18px 22px', borderRadius: '12px', border: '1px solid rgba(255,210,8,.18)', background: 'rgba(255,210,8,.04)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ color: '#FFD208', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ color: '#71717a', fontSize: '.82rem', lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: '#fff' }}>Trust model:</strong> The KMS re-encrypts ciphertexts from the network FHE key to your transport key without learning plaintext values — a cryptographic guarantee of TFHE, not a policy promise.
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

// ─── PERMIT FLOW ─────────────────────────────────────────────────────────────
function PermitFlow() {
  return (
    <section style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>Reading your encrypted balance</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>No gas. No tokens moved. Four cryptographic steps to reveal your balance only in your browser.</p>
        </BlurFade>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0', background: '#e4e4e7', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e4e4e7' }}>
          {[
            { n:'01', icon:Key,     title:'Grant Permit',    desc:'Sign EIP-712 typed-data. Binds to contract address, signer, chain ID, and a time window.',               note:'Read-only — no tokens moved' },
            { n:'02', icon:Network, title:'SDK → Gateway',   desc:'SDK sends permit + transport public key to the Zama relayer. KMS verifies the EIP-712 signature.',       note:'Permit TTL: 30 days, cached locally' },
            { n:'03', icon:Cpu,     title:'KMS Re-encrypts', desc:'KMS transforms the on-chain ciphertext from the network FHE key to your session transport key.',         note:'Cryptographic guarantee — not policy' },
            { n:'04', icon:EyeOff,  title:'Local Decrypt',   desc:'WASM decrypts the re-encrypted ciphertext in your browser. Plaintext never leaves your device.',         note:'Subsequent reads are silent' },
          ].map((s, i) => (
            <BlurFade key={i} inView delay={i * .08}>
              <div style={{ background: '#fff', padding: '30px 26px', borderLeft: i > 0 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={19} style={{ color: '#000' }} /></div>
                  <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f0f0f0', letterSpacing: '-0.04em' }}>{s.n}</span>
                </div>
                <div style={{ fontWeight: 800, color: '#000', marginBottom: '8px', fontSize: '.95rem' }}>{s.title}</div>
                <p style={{ color: '#52525b', fontSize: '.8rem', lineHeight: 1.65, marginBottom: '14px' }}>{s.desc}</p>
                <div style={{ padding: '7px 10px', borderRadius: '7px', background: '#fafafa', border: '1px solid #e4e4e7', fontSize: '.72rem', color: '#71717a', fontWeight: 600 }}>{s.note}</div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
// ─── FRAGMENTATION PROBLEM ────────────────────────────────────────────────────
function FragmentationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-10% 0px' });
  return (
    <section ref={ref} style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#fafafa' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '.72rem', fontWeight: 700, color: '#71717a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
            <AlertTriangle size={10} style={{ color: '#f59e0b' }} /> Why This Matters
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '16px' }}>Fragmentation is killing<br />developer composability.</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.65 }}>Every team spinning up their own ERC-7984 wrapper creates isolated liquidity pools and incompatible tooling. ZamaVault is the canonical interface — not one of many.</p>
        </BlurFade>
        {/* Comparison table */}
        <BlurFade inView delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e4e4e7', boxShadow: '0 4px 40px rgba(0,0,0,.04)' }}>
            {/* Left: the problem */}
            <div style={{ background: '#fff7ed', padding: 'clamp(28px,4vw,48px)', borderRight: '1px solid #e4e4e7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={14} style={{ color: '#92400e' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#92400e' }}>Custom Wrappers</span>
              </div>
              {[
                'Fragmented liquidity — each project has its own pool',
                'Incompatible tooling — no shared SDK integration path',
                'Trust ambiguity — users cannot verify legitimacy',
                'Protocol isolation — transfers don\'t cross wrapper boundaries',
                'Developer friction — re-implement ABI parsing per project',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#f87171', fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>✗</span>
                  <span style={{ fontSize: '.82rem', color: '#78350f', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
            {/* Right: the solution */}
            <div style={{ background: '#f0fdf4', padding: 'clamp(28px,4vw,48px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={14} style={{ color: '#166534' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: '#166534' }}>ZamaVault · Official Registry</span>
              </div>
              {[
                'Canonical registry — one source of truth for all wallets',
                'SDK-native — useShield / useUnshield / useConfidentialBalance',
                'On-chain verified — ERC-165 interface ID 0x4958f2a4 enforced',
                'Composable — any app can read the same registry and interoperate',
                'Extensible — add custom pairs via local config without forking',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#4ade80', fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '.82rem', color: '#166534', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

// ─── FOR DEVELOPERS ──────────────────────────────────────────────────────────
function DeveloperSection() {
  return (
    <section id="tech" style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,6vw,80px)', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,210,8,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.25)', background: 'rgba(255,210,8,.08)', fontSize: '.72rem', fontWeight: 700, color: '#FFD208', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
            <Wrench size={10} /> For Developers
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }}>Built for the ecosystem,<br />not just users.</h2>
          <p style={{ color: '#71717a', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>Integrate the official registry and FHE flows into your dApp with three imports. Extend with custom pairs — no forking required.</p>
        </BlurFade>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
          {/* SDK Hooks */}
          <BlurFade inView delay={0.05}>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '28px 24px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} style={{ color: '#000' }} /></div>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>SDK Hooks</span>
              </div>
              <pre style={{ background: 'rgba(0,0,0,.4)', borderRadius: '10px', padding: '14px 16px', fontSize: '.72rem', color: '#a1a1aa', lineHeight: 1.7, overflowX: 'auto', margin: 0 }}><code>{`import {
  useShield,
  useUnshield,
  useConfidentialBalance,
  useListPairs,
} from '@zama-fhe/react-sdk';

// Shield ERC-20 → ERC-7984
const { shield } = useShield({
  wrapperAddress: '0x...',
});

// Decrypt any ERC-7984 balance
const { data } = useConfidentialBalance(
  { tokenAddress: '0x...' },
  { enabled: userClicked },
);`}</code></pre>
            </div>
          </BlurFade>

          {/* Contract Addresses */}
          <BlurFade inView delay={0.1}>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '28px 24px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} style={{ color: '#000' }} /></div>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>Official Registry</span>
              </div>
              {[{ chain: 'Sepolia', addr: '0x2f0750...128e', color: '#6366f1' }, { chain: 'Mainnet', addr: '0xeb5015...bBA0', color: '#10b981' }].map(r => (
                <div key={r.chain} style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: r.color, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>{r.chain}</div>
                  <code style={{ fontSize: '.73rem', color: '#a1a1aa', fontFamily: 'monospace' }}>{r.addr}</code>
                </div>
              ))}
              <div style={{ marginTop: '18px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,210,8,.06)', border: '1px solid rgba(255,210,8,.15)' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#FFD208', marginBottom: '6px' }}>ERC-165 Interface ID</div>
                <code style={{ fontSize: '.73rem', color: '#a1a1aa', fontFamily: 'monospace' }}>0x4958f2a4</code>
              </div>
            </div>
          </BlurFade>

          {/* Extensibility */}
          <BlurFade inView delay={0.15}>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '28px 24px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={16} style={{ color: '#000' }} /></div>
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>Custom Pairs</span>
              </div>
              <p style={{ fontSize: '.8rem', color: '#71717a', lineHeight: 1.65, marginBottom: '16px' }}>Add dev-only or pre-registration pairs without touching the on-chain registry or forking the app.</p>
              <pre style={{ background: 'rgba(0,0,0,.4)', borderRadius: '10px', padding: '14px 16px', fontSize: '.72rem', color: '#a1a1aa', lineHeight: 1.7, overflowX: 'auto', margin: 0 }}><code>{`// src/config/custom-pairs.ts
export const CUSTOM_PAIRS: CustomPair[] = [
  {
    erc20Address: '0xYourERC20',
    erc7984Address: '0xYourWrapper',
    symbol: 'MYT',
    name: 'My Token',
    decimals: 18,
    wrapperDecimals: 6,
    source: 'custom',
    note: 'Dev pair',
  },
];`}</code></pre>
            </div>
          </BlurFade>
        </div>

        {/* Links */}
        <BlurFade inView delay={0.2} style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px', flexWrap: 'wrap' }}>
          {[
            { label: 'View on GitHub', href: 'https://github.com/hosein-ul/zamavault', icon: Globe },
            { label: 'Zama SDK Docs', href: 'https://docs.zama.org/protocol/sdk', icon: BookOpen },
            { label: 'Developer Tools', href: '/app/developers', icon: Wrench },
          ].map(link => (
            <motion.a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              whileHover={{ y: -2, borderColor: 'rgba(255,210,8,.5)' }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.1)', color: '#a1a1aa', fontSize: '.82rem', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,.03)', transition: 'color .2s' }}
            >
              <link.icon size={14} />
              {link.label} <ExternalLink size={11} />
            </motion.a>
          ))}
        </BlurFade>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: 'clamp(80px,12vw,160px) clamp(24px,6vw,80px)', background: '#000', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,210,8,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
      {[1,2,3,4].map(r => (
        <motion.div key={r} animate={{ scale: [1,1.07,1], opacity: [.18,.05,.18] }} transition={{ duration: 3+r, repeat: Infinity, delay: r*.8 }} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: `${r*240}px`, height: `${r*240}px`, borderRadius: '50%', border: '1px solid rgba(255,210,8,.18)', pointerEvents: 'none' }} />
      ))}
      <BlurFade inView delay={0} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.25)', background: 'rgba(255,210,8,.08)', fontSize: '.78rem', fontWeight: 700, color: '#FFD208', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '32px' }}>
          <motion.div animate={{ scale: [1,1.5,1] }} transition={{ repeat: Infinity, duration: 2.2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFD208' }} />
          Live on Ethereum Sepolia
        </div>
        <h2 style={{ fontSize: 'clamp(2.2rem,6vw,4.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '24px', maxWidth: '640px', margin: '0 auto 24px' }}>
          Shield your first tokens today.
        </h2>
        <p style={{ color: '#71717a', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '400px', margin: '0 auto 48px' }}>
          Use the Faucet for free Sepolia testnet tokens. No mainnet funds needed.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '18px 36px', background: '#FFD208', color: '#000', fontWeight: 800, fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none', boxShadow: '0 8px 40px rgba(255,210,8,.35)' }}>
              <Shield size={20} /> Launch ZamaVault <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <a href="https://docs.zama.org/protocol" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '18px 36px', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none', border: '2px solid rgba(255,255,255,.15)' }}>
              <BookOpen size={20} /> Zama Docs
            </a>
          </motion.div>
        </div>
      </BlurFade>
    </section>
  );
}

// ─── PLAYGROUND DEMO ─────────────────────────────────────────────────────────
function PlaygroundDemo() {
  const [amount, setAmount] = useState(1000);
  const [publicBalance, setPublicBalance] = useState(5000);
  const [isShielding, setIsShielding] = useState(false);
  const [isShielded, setIsShielded] = useState(false);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(false);

  const handleShield = () => {
    setIsShielding(true);
    setTimeout(() => {
      setIsShielding(false);
      setIsShielded(true);
      setPublicBalance(5000 - amount);
    }, 1200);
  };

  const handleDecrypt = () => {
    setShowPermitModal(true);
  };

  const handleSignPermit = () => {
    setShowPermitModal(false);
    setIsDecrypting(true);
    setTimeout(() => {
      setIsDecrypting(false);
      setIsDecrypted(true);
    }, 1000);
  };

  const handleReset = () => {
    setAmount(1000);
    setPublicBalance(5000);
    setIsShielding(false);
    setIsShielded(false);
    setShowPermitModal(false);
    setIsDecrypting(false);
    setIsDecrypted(false);
  };

  return (
    <section id="demo" style={{ padding: 'clamp(60px,8vw,100px) clamp(24px,6vw,80px)', background: '#fafafa', borderBottom: '1px solid #e4e4e7', borderTop: '1px solid #e4e4e7' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <BlurFade inView delay={0}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#b45309', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Interactive Sandbox</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '12px' }}>Experience Homomorphic Shielding</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.6 }}>Drag the slider below to select an amount of USDT to shield, and witness how the public balance is converted into a secure, encrypted balance.</p>
        </BlurFade>

        <BlurFade inView delay={0.15}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'stretch', textAlign: 'left' }}>
            {/* Control Panel Card */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e4e4e7', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={18} style={{ color: '#FFD208' }} /> Shielding Controller</h3>
                <label style={{ fontSize: '.82rem', fontWeight: 700, color: '#71717a', display: 'block', marginBottom: '8px' }}>AMOUNT TO SHIELD: <span style={{ color: '#000', fontSize: '1.05rem', fontWeight: 800 }}>{amount} USDT</span></label>
                
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="100"
                  value={amount}
                  onChange={(e) => !isShielding && !isShielded && setAmount(Number(e.target.value))}
                  disabled={isShielding || isShielded}
                  style={{ width: '100%', accentColor: '#FFD208', cursor: (isShielding || isShielded) ? 'not-allowed' : 'pointer', height: '6px', borderRadius: '3px', background: '#e4e4e7', outline: 'none', marginBottom: '24px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', fontWeight: 600, color: '#a1a1aa', marginTop: '-16px', marginBottom: '32px' }}>
                  <span>100 USDT</span>
                  <span>5,000 USDT</span>
                </div>
              </div>

              <div>
                {!isShielded ? (
                  <button
                    onClick={handleShield}
                    disabled={isShielding}
                    style={{ width: '100%', padding: '16px', background: isShielding ? '#f4f4f5' : '#000', color: isShielding ? '#a1a1aa' : '#FFD208', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '.95rem', cursor: isShielding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                  >
                    {isShielding ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid #a1a1aa', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        Executing TFHE Shield Transaction...
                      </>
                    ) : (
                      <>
                        <Shield size={16} /> Shield {amount} USDT
                      </>
                    )}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#059669', fontSize: '.85rem', fontWeight: 700 }}>
                      <CheckCircle2 size={16} /> Successfully Shielded {amount} USDT!
                    </div>
                    <button
                      onClick={handleReset}
                      style={{ width: '100%', padding: '12px', background: 'transparent', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '8px', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      Reset Playground
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Balance Display Card */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e4e4e7', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} style={{ color: '#FFD208' }} /> Wallet Balances</h3>
              
              {/* Public Balance Row */}
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                <div>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.04em' }}>Public Balance (ERC-20)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#000', marginTop: '4px' }}>{publicBalance.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700, color: '#71717a' }}>USDT</span></div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59,130,246,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <Globe size={18} />
                </div>
              </div>

              {/* Shielded Balance Row */}
              <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isShielded ? 'rgba(255,210,8,0.02)' : '#fff', position: 'relative', overflow: 'hidden' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.04em' }}>Shielded Balance (cUSDT)</div>
                    <span style={{ fontSize: '.68rem', fontWeight: 700, background: '#FFD208', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>ERC-7984</span>
                  </div>
                  
                  {!isShielded ? (
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a1a1aa', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={16} /> Encrypted
                    </div>
                  ) : isDecrypted ? (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                      {amount.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>cUSDT</span>
                    </motion.div>
                  ) : (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#71717a', background: '#f4f4f5', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e4e4e7', display: 'inline-block' }}>
                        Handle: 0x9f3e...8ab
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {isShielded && !isDecrypted && (
                    <button
                      onClick={handleDecrypt}
                      disabled={isDecrypting}
                      style={{ padding: '8px 14px', background: '#000', color: '#FFD208', border: 'none', borderRadius: '6px', fontSize: '.8rem', fontWeight: 700, cursor: isDecrypting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      {isDecrypting ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '12px', height: '12px', border: '2px solid #FFD208', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Unlock size={12} /> Decrypt
                        </>
                      )}
                    </button>
                  )}

                  {isDecrypted && (
                    <div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.8rem', fontWeight: 700 }}>
                      <Unlock size={14} /> Decrypted
                    </div>
                  )}

                  {!isShielded && (
                    <div style={{ color: '#a1a1aa', border: '1px dashed #e4e4e7', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* Mock Permit Modal */}
        <AnimatePresence>
          {showPermitModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e4e4e7', width: '100%', maxWidth: '380px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,.15)', textAlign: 'left' }}
              >
                {/* MetaMask Style Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f4f4f5', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff2e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8000', fontSize: '1rem', fontWeight: 800 }}>🦊</div>
                    <span style={{ fontWeight: 800, fontSize: '.9rem', color: '#333' }}>Signature Request</span>
                  </div>
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: '#3b82f6', background: 'rgba(59,130,246,0.06)', padding: '2px 8px', borderRadius: '100px' }}>Sepolia</span>
                </div>

                <div style={{ fontSize: '.8rem', color: '#52525b', lineHeight: 1.5, marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#000' }}>You are signing a decryption permit:</p>
                  <div style={{ background: '#fafafa', borderRadius: '8px', border: '1px solid #e4e4e7', padding: '12px', fontFamily: 'monospace', fontSize: '.72rem', color: '#4b5563', overflowX: 'auto' }}>
                    <strong>Domain:</strong> ZamaVault (v1)<br />
                    <strong>Contract:</strong> 0x9ee53764...825ab<br />
                    <strong>Purpose:</strong> Decrypt cUSDT balance<br />
                    <strong>Owner:</strong> 0xYourConnectedAddress<br />
                    <strong>Expiry:</strong> +24 Hours (Permit Cache)
                  </div>
                  <p style={{ margin: '10px 0 0', color: '#71717a', fontSize: '.7rem' }}>This signature is free and does not require gas. It authorizes ZamaVault to decrypt your balance in this browser.</p>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowPermitModal(false)}
                    style={{ flex: 1, padding: '12px', border: '1px solid #d4d4d8', background: 'transparent', borderRadius: '8px', color: '#27272a', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignPermit}
                    style={{ flex: 1, padding: '12px', border: 'none', background: '#FFD208', color: '#000', borderRadius: '8px', fontWeight: 800, fontSize: '.85rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(255,210,8,.25)' }}
                  >
                    Sign Permit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── ENTERPRISE USE CASES ──────────────────────────────────────────────────
function EnterpriseUseCases() {
  return (
    <section id="usecases" style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,80px)', background: '#fff', borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#b45309', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Enterprise Applications</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>B2B & Institutional Use Cases</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>Discover how Fully Homomorphic Encryption solves data exposure challenges in corporate finance and DeFi.</p>
        </BlurFade>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            {
              title: 'Confidential Payroll',
              desc: 'Disburse salaries and consulting fees in stablecoins like cUSDC without revealing individual employee compensation structures or monthly payroll totals on-chain.',
              icon: Wallet,
              badge: 'Stablecoin Shield'
            },
            {
              title: 'Institutional Dark Pools',
              desc: 'Execute block trades and OTC orders privately. Prevent front-running, sandwich attacks, and order-book visibility by keeping trades encrypted during settlement.',
              icon: Network,
              badge: 'OTC Trading'
            },
            {
              title: 'Private Treasury Reserves',
              desc: 'Manage company assets, yield strategies, and inter-company financing options without exposing proprietary strategic financial positioning to competitors.',
              icon: Cpu,
              badge: 'Corporate Treasury'
            }
          ].map((item, i) => (
            <BlurFade key={i} inView delay={i * 0.1}>
              <div 
                style={{ 
                  background: '#fafafa', 
                  border: '1px solid #e4e4e7', 
                  borderRadius: '16px', 
                  padding: '32px', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,.01)',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,210,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                      <item.icon size={22} style={{ color: '#b45309' }} />
                    </div>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#71717a', background: '#fff', border: '1px solid #e4e4e7', padding: '3px 8px', borderRadius: '100px' }}>{item.badge}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000', marginBottom: '12px' }}>{item.title}</h3>
                  <p style={{ fontSize: '.88rem', color: '#52525b', lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECURITY & COMPLIANCE ─────────────────────────────────────────────────
function SecurityCompliance() {
  return (
    <section id="security" style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,80px)', background: '#fafafa', borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'center' }}>
          {/* Text content */}
          <BlurFade inView delay={0}>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#b45309', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Security & Compliance</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: 1.15 }}>Cryptographic Safety & Non-Custodial Design</h2>
            <p style={{ color: '#52525b', fontSize: '.95rem', lineHeight: 1.7, marginBottom: '24px' }}>ZamaVault operates on a purely non-custodial basis. Tokens are locked inside the open-source ERC-7984 wrapper contracts. Private keys never leave your browser, and decrypted values are only accessible via EIP-712 cryptographic permit requests.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Lattice-Based TFHE', desc: 'Secure against quantum computing algorithms.' },
                { title: 'Fully Non-Custodial', desc: 'No central server, admin key, or custodian holds your funds.' },
                { title: 'Zama FHEVM Verifiable', desc: 'Computations run on off-chain coprocessors with cryptographically verified state updates.' }
              ].map((point, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#059669', marginTop: '2px' }}><CheckCircle2 size={16} /></div>
                  <div>
                    <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: '#000', margin: '0 0 2px' }}>{point.title}</h4>
                    <p style={{ fontSize: '.8rem', color: '#71717a', margin: 0 }}>{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </BlurFade>

          {/* Graphics/Shield Representation */}
          <BlurFade inView delay={0.2}>
            <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 4px 30px rgba(0,0,0,.02)', position: 'relative' }}>
              <motion.div 
                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 0px rgba(255,210,8,0)', '0 0 0 20px rgba(255,210,8,0.06)', '0 0 0 0px rgba(255,210,8,0)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', marginBottom: '24px' }}
              >
                <Shield size={36} />
              </motion.div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000', marginBottom: '8px' }}>Security Audit Status</h3>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '16px' }}>Ready for Launch</span>
              <p style={{ fontSize: '.82rem', color: '#71717a', lineHeight: 1.5, maxWidth: '280px', margin: 0 }}>The wrapper logic and Coprocessor interface conform to OpenZeppelin ERC-20 secure standards.</p>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ACCORDIONS ──────────────────────────────────────────────────────────
function FaqAccordions() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is ERC-7984 and how does it differ from ERC-20?',
      a: 'ERC-7984 is a confidential token wrapper standard built on top of Zama FHEVM. Unlike standard public ERC-20 tokens, which expose balances and transaction amounts to everyone on Etherscan, ERC-7984 encrypts token balances into on-chain ciphertexts (euint64 handles). Only the account owner can view their balance by signing a secure cryptographic permit.'
    },
    {
      q: 'How does decryption work? Is my private key exposed?',
      a: 'No, your private key is never exposed. Decryption uses EIP-712 permits. When you click "Decrypt", your wallet signs a structured message. This signed permit authorizes ZamaVault\'s frontend to retrieve the decryption credentials from Zama\'s Key Management System (KMS), which decrypts the ciphertext handle and displays it locally. This is non-custodial and secure.'
    },
    {
      q: 'Is Fully Homomorphic Encryption (TFHE) secure against quantum computers?',
      a: 'Yes. TFHE (Torus Fully Homomorphic Encryption) is based on the Ring Learning With Errors (LWE) lattice cryptography problem. Lattice-based cryptography is mathematically recognized as post-quantum secure, meaning it is mathematically resistant to cryptanalytic attacks from quantum computers.'
    },
    {
      q: 'Are there gas fee differences when using cTokens?',
      a: 'Yes, because FHE arithmetic and zero-knowledge proof verifications are computationally heavy. However, ZamaVault routes computationally intense operations off-chain to a Zama Coprocessor. The coprocessor processes the FHE logic and returns a verified state update, keeping gas fees comparable to standard public token transactions.'
    }
  ];

  return (
    <section id="faq" style={{ padding: 'clamp(80px,10vw,120px) clamp(24px,6vw,80px)', background: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <BlurFade inView delay={0} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '100px', border: '1px solid rgba(255,210,8,.3)', background: 'rgba(255,210,8,.08)', fontSize: '.75rem', fontWeight: 700, color: '#b45309', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '16px' }}>FAQ</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '14px' }}>Frequently Asked Questions</h2>
          <p style={{ color: '#52525b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>Find answers to common technical and architectural questions about ZamaVault.</p>
        </BlurFade>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <BlurFade key={i} inView delay={i * 0.05}>
                <div 
                  style={{ 
                    border: '1px solid #e4e4e7', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    background: isOpen ? '#fafafa' : '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    style={{ 
                      width: '100%', 
                      padding: '20px 24px', 
                      background: 'transparent', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#000',
                      gap: '20px'
                    }}
                  >
                    <span>{faq.q}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: '#71717a', flexShrink: 0 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div style={{ padding: '0 24px 20px', fontSize: '.9rem', color: '#52525b', lineHeight: 1.65, borderTop: '1px solid #f4f4f5', paddingTop: '16px' }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div data-theme="light" style={{ background: '#fafafa', color: '#000', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", minHeight: '100vh' }}>
      <style>{`.pill{flex-shrink:0;padding:8px 22px;border:1px solid #e4e4e7;border-radius:100px;font-size:.78rem;font-weight:700;color:#52525b;background:#fff;white-space:nowrap;letter-spacing:.04em;}`}</style>
      <ScrollProgress />
      <Hero />
      <section style={{ borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7', background: '#fff', overflow: 'hidden', padding: '4px 0' }}>
        <Marquee pauseOnHover className="[--duration:28s] [--gap:12px]" repeat={3}>
          {TRUST.map(item => <div key={item} className="pill">{item}</div>)}
        </Marquee>
      </section>
      <Stats />
      
      {/* 1. Interactive Shielding Playground */}
      <PlaygroundDemo />

      <PinnedStory />
      <HorizontalScroll />
      <StepTimeline />

      {/* 2. Enterprise Use Cases */}
      <EnterpriseUseCases />

      <PermitFlow />
      <FragmentationSection />
      <DeveloperSection />

      {/* 3. Security & Compliance */}
      <SecurityCompliance />

      {/* 4. FAQs */}
      <FaqAccordions />

      <CTA />
      <footer style={{ padding: '36px clamp(24px,6vw,80px)', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFD208', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none"><path d="M7 14L12 9V12H16V9L21 14L16 19V16H12V19L7 14Z" fill="#000" /></svg>
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: '.95rem' }}>Zama<span style={{ color: '#FFD208' }}>Vault</span></span>
          <span style={{ color: '#3f3f46', fontSize: '.78rem', marginLeft: '8px' }}>Built on Zama FHEVM · ERC-7984</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[{l:'Zama Protocol',h:'https://docs.zama.org/protocol'},{l:'Security Model',h:'https://docs.zama.org/protocol/sdk/concepts/security-model'},{l:'GitHub',h:'https://github.com/hosein-ul/zamavault'},{l:'App →',h:'/app'}].map(link => (
            <motion.a key={link.l} href={link.h} target={link.h.startsWith('http')?'_blank':undefined} rel={link.h.startsWith('http')?'noopener noreferrer':undefined} whileHover={{ color: '#a1a1aa' }} style={{ fontSize: '.8rem', fontWeight: 600, color: '#52525b', textDecoration: 'none' }}>{link.l}</motion.a>
          ))}
        </div>
      </footer>
    </div>
  );
}
