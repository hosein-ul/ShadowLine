'use client';

import React from 'react';
import { motion } from 'framer-motion';
import BlurIn from '@/components/ui/BlurIn';

/* ─── Letter animation: each character slides in from random offset ─────── */

const HEADLINE_L1 = 'EVERY BIT.';
const HEADLINE_L2 = 'ENCRYPTED.';

function AnimatedLine({
  text,
  delay = 0,
  reducedMotion,
}: {
  text: string;
  delay?: number;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return <span>{text}</span>;
  }

  return (
    <>
      {text.split('').map((char, i) => {
        const isLast = i === text.length - 1 && text.endsWith('.');
        return (
          <motion.span
            key={`${char}-${i}`}
            initial={{
              opacity: 0,
              y: (Math.random() - 0.5) * 60,
              x: (Math.random() - 0.5) * 40,
              rotate: (Math.random() - 0.5) * 30,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              x: 0,
              rotate: 0,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              ...(isLast
                ? {
                    color: 'var(--zama-gold)',
                    textShadow: '0 0 20px var(--zama-gold-glow)',
                  }
                : {}),
            }}
          >
            {char === ' ' ? ' ' : char}
          </motion.span>
        );
      })}
    </>
  );
}

/* ─── Main headline component ───────────────────────────────────────────── */

interface HeroHeadlineProps {
  reducedMotion: boolean;
}

export default function HeroHeadline({ reducedMotion }: HeroHeadlineProps) {
  return (
    <div className="hero-headline-wrap">
      {/* Main headline */}
      <h1 className="hero-headline">
        <span className="hero-headline-line">
          <AnimatedLine text={HEADLINE_L1} delay={0.3} reducedMotion={reducedMotion} />
        </span>
        <br />
        <span className="hero-headline-line hero-headline-shimmer">
          <AnimatedLine text={HEADLINE_L2} delay={0.7} reducedMotion={reducedMotion} />
        </span>
      </h1>

      {/* Subheadline */}
      <div className="hero-sub" style={{ marginTop: 'var(--sp-5)' }}>
        <BlurIn
          text="Shield any ERC-20 into a confidential FHE-encrypted wrapper. On Ethereum. Permissionless."
          duration={800}
          delay={1400}
        />
      </div>

      {/* Floating hex badges — CSS positioned, not 3D */}
      <div className="hero-badges" aria-hidden="true">
        {['0x7a3f', 'euint64', 'ERC-7984', 'FHE', 'PERMIT'].map((txt, i) => (
          <span
            key={txt}
            className="hero-badge"
            style={{
              animationDelay: `${i * 0.7}s`,
              left: `${15 + i * 16}%`,
              top: `${20 + ((i * 37) % 60)}%`,
            }}
          >
            {txt}
          </span>
        ))}
      </div>
    </div>
  );
}
