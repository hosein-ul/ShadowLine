'use client';

import { motion } from 'motion/react';

/**
 * Token Constellation — editorial token grid (not R3F).
 *
 * After Phase A's lesson with 3D libs and runtime cost, this is a 2D
 * orbital layout: tokens float on a soft circle with subtle independent
 * drift animations. Cheaper, still distinctive.
 *
 * Each token uses its real CMC logo (same source as v1).
 */
const TOKENS = [
  { sym: 'cUSDC',  name: 'USD Coin',      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png' },
  { sym: 'cUSDT',  name: 'Tether USD',    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png' },
  { sym: 'cWETH',  name: 'Wrapped Ether', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png' },
  { sym: 'cZAMA',  name: 'Zama',          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/39332.png' },
  { sym: 'cBRON',  name: 'Bron',          logo: null },
  { sym: 'ctGBP',  name: 'Tokenised GBP', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/38935.png' },
  { sym: 'cXAUt',  name: 'Tether Gold',   logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5176.png' },
];

export function TokenConstellation() {
  // Layout: 4 across top, 3 across bottom, alternating offsets
  return (
    <section id="tokens" data-section className="v2-section">
      <div className="v2-container">

        <div className="max-w-3xl mb-16">
          <p className="v2-eyebrow mb-4">Every wrapper, live from the registry</p>
          <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900">
            One interface. Every pair.
          </h2>
          <p className="mt-5 text-ink-400 text-base leading-relaxed max-w-md">
            ZamaVault reads the on-chain WrappersRegistry directly. Every
            confidential ERC-7984 token shows up the moment it’s registered.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
          {TOKENS.map((t, i) => (
            <motion.div
              key={t.sym}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col items-center gap-3 rounded-2xl border border-ink-900/[0.07] bg-cream-50 p-5 hover:border-gold-500/40 transition-colors"
            >
              <div className="relative h-14 w-14 rounded-full bg-cream-200 grid place-items-center overflow-hidden">
                {t.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.logo}
                    alt={t.name}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-base font-bold text-gold-700">{t.sym[1]}</span>
                )}
              </div>
              <div className="text-center">
                <div className="font-mono text-[13px] font-semibold text-ink-900">{t.sym}</div>
                <div className="text-[11px] text-ink-400 mt-0.5">{t.name}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 text-sm text-ink-400 max-w-lg">
          7 confidential pairs on Sepolia, 7 on Ethereum mainnet — and counting.
          Pulled live from <span className="font-mono text-ink-900">WrappersRegistry</span>.
        </p>
      </div>
    </section>
  );
}
