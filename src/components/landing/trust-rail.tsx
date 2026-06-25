'use client';

import { Marquee } from '@/components/magic/marquee';
import { cn } from '@/lib/utils';

const TOKENS = [
  { sym: 'cUSDC',  name: 'USD Coin',      logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png' },
  { sym: 'cUSDT',  name: 'Tether USD',    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png' },
  { sym: 'cWETH',  name: 'Wrapped Ether', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2396.png' },
  { sym: 'cZAMA',  name: 'Zama',          logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/39332.png' },
  { sym: 'cBRON',  name: 'Bron',          logo: null },
  { sym: 'ctGBP',  name: 'Tokenised GBP', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/38935.png' },
  { sym: 'cXAUt',  name: 'Tether Gold',   logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5176.png' },
];

function Pill({ sym, name, logo }: typeof TOKENS[0]) {
  return (
    <div className="mx-3 flex items-center gap-2.5 rounded-full border border-ink-950/[0.08] bg-white px-4 py-2 whitespace-nowrap shadow-sm">
      {logo ? (
        <img
          src={logo}
          alt={name}
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className="h-7 w-7 rounded-full flex-shrink-0 object-cover"
        />
      ) : (
        <div className="h-7 w-7 rounded-full grid place-items-center text-[9px] font-bold flex-shrink-0 bg-[#CD7F32] text-white">
          B
        </div>
      )}
      <span className="font-mono text-sm font-semibold text-ink-900 tracking-tight">{sym}</span>
      <span className="text-xs text-ink-400">{name}</span>
    </div>
  );
}

export function TrustRail() {
  return (
    <section
      className={cn(
        'relative border-b border-ink-950/[0.07] py-10 bg-white',
        '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
      )}
    >
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-ink-400 mb-6">
          Confidential token pairs supported
        </p>
        <Marquee pauseOnHover className="[--duration:42s]">
          {TOKENS.map((t) => (
            <Pill key={t.sym} {...t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
