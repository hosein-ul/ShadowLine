'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGsapPin } from './lib/use-gsap-pin';

/**
 * Solution — pinned for ~150% viewport.
 *
 * The same ledger from the Problem section visually scrambles letter-by-letter
 * into hex ciphertext as the user scrolls. At the end of the pin, all values
 * are encrypted blobs; a gold "Decrypt" pill appears at the top-right and a
 * sentence resolves below explaining what just happened.
 */
const ROWS: { hash: string; from: string; to: string; value: string; token: string }[] = [
  { hash: '0xa3d2…',  from: '0x9b…fff',  to: '0x7c…639',  value: '1,240.00',  token: 'USDC' },
  { hash: '0xd11e…',  from: '0x9b…fff',  to: '0xfa…412',  value: '300.00',    token: 'USDC' },
  { hash: '0x55a0…',  from: '0xfa…412',  to: '0x71…a12',  value: '290.00',    token: 'USDC' },
  { hash: '0x9f3c…',  from: '0x9b…fff',  to: '0x7c…639',  value: '11.500',    token: 'WETH' },
  { hash: '0x4b81…',  from: '0x71…a12',  to: '0x9b…fff',  value: '850.00',    token: 'USDC' },
];

const HEX = '0123456789abcdef';
function ciphertext(len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * HEX.length)];
  return s;
}

export function SolutionEncrypt() {
  const ref = useRef<HTMLElement | null>(null);

  // Pre-compute the scrambled values for each row so we can interpolate.
  const scrambledValues = useRef<string[]>(ROWS.map(() => ''));
  useEffect(() => {
    scrambledValues.current = ROWS.map(() => ciphertext(14));
  }, []);

  useGsapPin(
    ref,
    (tl) => {
      const rows = ref.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [];

      rows.forEach((row, idx) => {
        const valueEl = row.querySelector<HTMLElement>('[data-cell-value]');
        const fromEl  = row.querySelector<HTMLElement>('[data-cell-from]');
        const toEl    = row.querySelector<HTMLElement>('[data-cell-to]');

        const start = idx * 0.04;

        if (valueEl) {
          const target = scrambledValues.current[idx] || ciphertext(14);
          tl.to(valueEl, {
            duration: 0.6,
            ease: 'none',
            onUpdate: function () {
              const p = this.progress();
              // animate character by character — left to right
              const chars = Math.round(p * target.length);
              valueEl.textContent =
                target.substring(0, chars) +
                (valueEl.dataset.original ?? '').substring(chars);
            },
            onComplete: () => {
              valueEl.textContent = target;
              valueEl.classList.add('text-gold-700');
              valueEl.classList.remove('text-ink-900');
            },
          }, start);
        }
        if (fromEl) {
          tl.to(fromEl, {
            opacity: 0.4,
            duration: 0.3,
            ease: 'none',
          }, start);
        }
        if (toEl) {
          tl.to(toEl, {
            opacity: 0.4,
            duration: 0.3,
            ease: 'none',
          }, start);
        }
      });

      // Reveal the "decrypt" pill at the end
      const pill = ref.current?.querySelector('[data-decrypt-pill]');
      const resolved = ref.current?.querySelector('[data-resolved-text]');
      if (pill) tl.to(pill, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.7);
      if (resolved) tl.to(resolved, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.8);
    },
    { start: 'top top', end: '+=150%', scrub: 0.5 },
  );

  // Initialise dataset.original on mount so the scrub can interpolate.
  useEffect(() => {
    const valueEls = ref.current?.querySelectorAll<HTMLElement>('[data-cell-value]') ?? [];
    valueEls.forEach((el) => {
      el.dataset.original = el.textContent ?? '';
    });
  }, []);

  return (
    <section id="solution" data-section ref={ref} className="relative min-h-[100svh] flex items-center bg-cream-200/40">
      <div className="v2-container">

        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">

          <div className="md:col-span-7">
            <p className="v2-eyebrow mb-4">After ZamaVault</p>
            <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900 max-w-xl">
              The same block,{' '}
              <span className="italic text-gold-700">illegible</span>.
            </h2>

            <div className="mt-10 border-y border-ink-900/[0.08] divide-y divide-ink-900/[0.06]">
              {ROWS.map((r) => (
                <div
                  key={r.hash}
                  data-row
                  className="grid grid-cols-12 gap-3 py-3 font-mono text-[12px] text-ink-700"
                >
                  <span className="col-span-2 text-ink-400">{r.hash}</span>
                  <span data-cell-from className="col-span-3 truncate">{r.from}</span>
                  <span className="col-span-1 text-ink-400">→</span>
                  <span data-cell-to   className="col-span-3 truncate">{r.to}</span>
                  <span
                    data-cell-value
                    className="col-span-2 text-right font-semibold text-ink-900 truncate"
                  >
                    {r.value}
                  </span>
                  <span className="col-span-1 text-right text-ink-400">enc</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="md:sticky md:top-28 space-y-8">
              <div
                data-decrypt-pill
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-1.5"
                style={{ opacity: 0, transform: 'translateY(8px)' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
                <span className="text-[12px] font-semibold text-gold-700">euint64 · on-chain</span>
              </div>

              <p
                data-resolved-text
                className="v2-display text-[clamp(1.3rem,2.4vw,1.9rem)] leading-[1.3] text-ink-900 max-w-md"
                style={{ opacity: 0, transform: 'translateY(12px)' }}
              >
                Same block, same gas, same finality — only you can read your
                balance. Signed once with an EIP-712 permit.
              </p>

              <div data-resolved-text style={{ opacity: 0, transform: 'translateY(12px)' }} className="space-y-4">
                <Bullet label="Stored as ciphertext" value="euint64 handles inside the contract state" />
                <Bullet label="Computed on ciphertext" value="transfers, allowances, comparisons all in FHE" />
                <Bullet label="Decrypted off-chain by you" value="permit-scoped session, no central decryptor" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 h-1 w-1 rounded-full bg-gold-500 flex-shrink-0" />
      <div>
        <div className="text-sm font-semibold text-ink-900">{label}</div>
        <div className="text-sm text-ink-400 leading-relaxed">{value}</div>
      </div>
    </div>
  );
}
