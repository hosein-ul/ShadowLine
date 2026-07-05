'use client';

/**
 * Next.js re-mounts a `template` on every navigation — perfect for a fresh
 * entrance animation per docs page. We also reset scroll to the top so a long
 * page doesn't open half-way down after clicking Next.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DocsTemplate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
