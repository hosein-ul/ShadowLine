/**
 * Landing page v2 (route: /).
 *
 * Editorial scroll narrative — cream base, gold accent, aubergine for the
 * single dark beat. Imports landing-v2.css ONLY; v1 (landing.css and
 * src/components/landing/*) is retained on disk so previous design is
 * one-branch-switch away.
 *
 * Structure: nav → 10 sections → footer, with a Lenis smooth-scroll
 * provider, a scroll-progress rail, and a noise-driven background.
 */
import './landing-v2.css';

import { LenisProvider } from '@/components/landing-v2/lib/lenis-provider';
import { ScrollProgress } from '@/components/landing-v2/lib/scroll-progress';
import { NoiseBackground } from '@/components/landing-v2/lib/noise-background';
import { BFCacheRecovery } from '@/components/landing/bfcache-recovery';

import { NavV2 } from '@/components/landing-v2/nav';
import { Aperture } from '@/components/landing-v2/aperture';
import { Manifesto } from '@/components/landing-v2/manifesto';
import { ProblemLedger } from '@/components/landing-v2/problem-ledger';
import { SolutionEncrypt } from '@/components/landing-v2/solution-encrypt';
import { TokenConstellation } from '@/components/landing-v2/token-constellation';
import { Capabilities } from '@/components/landing-v2/capabilities';
import { Numbers } from '@/components/landing-v2/numbers';
import { Flow } from '@/components/landing-v2/flow';
import { ForDevs } from '@/components/landing-v2/for-devs';
import { FinalBeat } from '@/components/landing-v2/final-beat';
import { FooterV2 } from '@/components/landing-v2/footer';

export default function LandingPage() {
  return (
    <LenisProvider>
      <div className="v2-root">
        <BFCacheRecovery />
        <NoiseBackground />
        <ScrollProgress />
        <NavV2 />

        <main>
          <Aperture />
          <Manifesto />
          <ProblemLedger />
          <SolutionEncrypt />
          <TokenConstellation />
          <Capabilities />
          <Numbers />
          <Flow />
          <ForDevs />
          <FinalBeat />
        </main>

        <FooterV2 />
      </div>
    </LenisProvider>
  );
}
