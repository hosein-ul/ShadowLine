'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import HeroHeadline from './HeroHeadline';
import HeroCTA from './HeroCTA';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Lazy-load the 3D scene — registry table loads instantly
const CrystalLattice = dynamic(() => import('./CrystalLattice'), {
  ssr: false,
  loading: () => null,
});

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll-linked fade/shatter
  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const heroHeight = heroRef.current.offsetHeight;
      // Progress: 0 (fully visible) → 1 (scrolled past)
      const progress = Math.max(0, Math.min(1, -rect.top / (heroHeight * 0.6)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [reducedMotion]);

  const contentOpacity = Math.max(0, 1 - scrollProgress * 2);
  const contentY = scrollProgress * -60;

  return (
    <section ref={heroRef} className="hero-section">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <CrystalLattice
          scrollProgress={scrollProgress}
          reducedMotion={reducedMotion}
        />
      </Suspense>

      {/* Gradient overlay for depth */}
      <div className="hero-gradient-overlay" />

      {/* Content */}
      <div
        className="hero-content container"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        <HeroHeadline reducedMotion={reducedMotion} />
        <HeroCTA reducedMotion={reducedMotion} />

        {/* Stats row */}
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">8</span>
            <span className="hero-stat-label">Token Pairs</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">FHE</span>
            <span className="hero-stat-label">Encryption</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">ERC-7984</span>
            <span className="hero-stat-label">Standard</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hero-scroll-hint"
        style={{ opacity: Math.max(0, 1 - scrollProgress * 5) }}
      >
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
}
