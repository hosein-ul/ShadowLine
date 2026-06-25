'use client';

import { cn } from '@/lib/utils';

/**
 * AuroraBg — light-mode gold aurora on cream background.
 * Two very soft gold radial glows that slowly drift, giving the hero
 * an atmospheric warmth without overpowering the dark text.
 */
export function AuroraBg({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {/* Soft gold halo — top-left */}
      <div
        className="absolute -inset-[15%] opacity-[0.22] blur-[90px]"
        style={{
          background: `
            radial-gradient(55% 55% at 20% 10%, rgba(255, 210, 8, 0.55) 0%, transparent 65%),
            radial-gradient(40% 40% at 75% 55%, rgba(255, 220, 80, 0.25) 0%, transparent 65%),
            radial-gradient(35% 35% at 50% 90%, rgba(168, 122, 0, 0.20) 0%, transparent 65%)
          `,
          animation: 'aurora 22s ease-in-out infinite alternate',
        }}
      />

      {/* Very subtle dot grid — dark lines at low opacity on cream */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0F0E0C 1px, transparent 1px), linear-gradient(to bottom, #0F0E0C 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at 30% 20%, black 30%, transparent 75%)',
        }}
      />
    </div>
  );
}
