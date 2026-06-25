/**
 * Landing page (route: /).
 *
 * Completely separated from the app. Imports its own Tailwind v4 stylesheet
 * (`landing.css`); does NOT touch globals.css or ClientLayout. The /app/*
 * subtree has its own layout that brings in the app design system.
 *
 * Composition is one section per file under `src/components/landing/*` so
 * each beat can be tuned independently.
 */
import './landing.css';

import { BFCacheRecovery } from '@/components/landing/bfcache-recovery';
import { LandingNav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { TrustRail } from '@/components/landing/trust-rail';
import { Stats } from '@/components/landing/stats';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FheExplainer } from '@/components/landing/fhe-explainer';
import { FinalCta } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="landing-root landing-grain">
      <BFCacheRecovery />
      <LandingNav />
      <main>
        <Hero />
        <TrustRail />
        <Stats />
        <Features />
        <HowItWorks />
        <FheExplainer />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
