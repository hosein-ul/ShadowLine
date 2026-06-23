'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowDown } from 'lucide-react';

interface HeroCTAProps {
  reducedMotion: boolean;
}

export default function HeroCTA({ reducedMotion }: HeroCTAProps) {
  const handleScrollToRegistry = () => {
    const registry = document.getElementById('registry-section');
    if (registry) {
      registry.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      className="hero-cta-row"
      initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href="/wrap" className="hero-btn-primary">
        <span className="hero-btn-shimmer" />
        <Shield size={18} />
        Shield Your Tokens
      </Link>

      <button onClick={handleScrollToRegistry} className="hero-btn-secondary">
        <ArrowDown size={16} />
        Explore Registry
      </button>
    </motion.div>
  );
}
