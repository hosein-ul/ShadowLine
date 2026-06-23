'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import BlurIn from '@/components/ui/BlurIn';
import {
  BookOpen,
  Shield,
  Unlock,
  Eye,
  Droplets,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/* ─── Step definitions ──────────────────────────────────────────────────────── */

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'What is FHE?',
    subtitle: 'Fully Homomorphic Encryption',
    icon: <Cpu size={20} />,
    accentColor: 'var(--accent)',
  },
  {
    id: 2,
    title: 'Get Test Tokens',
    subtitle: 'Free mock tokens on Sepolia',
    icon: <Droplets size={20} />,
    accentColor: 'var(--info)',
  },
  {
    id: 3,
    title: 'Shield a Token',
    subtitle: 'Wrap ERC-20 → ERC-7984',
    icon: <Shield size={20} />,
    accentColor: 'var(--success)',
  },
  {
    id: 4,
    title: 'Decrypt Balance',
    subtitle: 'EIP-712 permit flow',
    icon: <Eye size={20} />,
    accentColor: '#a78bfa',
  },
  {
    id: 5,
    title: 'Unshield Back',
    subtitle: 'Unwrap ERC-7984 → ERC-20',
    icon: <Unlock size={20} />,
    accentColor: 'var(--warning)',
  },
];

/* ─── Individual step content ───────────────────────────────────────────────── */

function StepContent({ stepId }: { stepId: number }) {
  switch (stepId) {
    case 1:
      return <StepFHE />;
    case 2:
      return <StepFaucet />;
    case 3:
      return <StepShield />;
    case 4:
      return <StepDecrypt />;
    case 5:
      return <StepUnshield />;
    default:
      return null;
  }
}

function StepFHE() {
  return (
    <div className="learn-step-body">
      <p className="learn-lead">
        <strong>Fully Homomorphic Encryption (FHE)</strong> allows computations
        on encrypted data — without ever decrypting it. Zama&apos;s protocol
        brings this to Ethereum: your token balances and transfers are encrypted
        on-chain so that nobody, not even validators or block explorers, can see
        your holdings.
      </p>

      <div className="learn-diagram">
        <div className="learn-diagram-row">
          <DiagramBox
            label="Public ERC-20"
            description="Balances visible to everyone"
            color="var(--warning)"
            icon={<Eye size={16} />}
          />
          <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <DiagramBox
            label="Shield (Wrap)"
            description="Encrypt via FHE"
            color="var(--accent)"
            icon={<Shield size={16} />}
          />
          <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <DiagramBox
            label="Confidential ERC-7984"
            description="Balances encrypted on-chain"
            color="var(--success)"
            icon={<Lock size={16} />}
          />
        </div>
      </div>

      <div className="learn-highlights">
        <HighlightCard
          title="On-Chain Privacy"
          description="Balances are stored as ciphertexts in the smart contract state. No one can read them by inspecting the blockchain."
        />
        <HighlightCard
          title="Compute on Encrypted Data"
          description="FHE lets the protocol process transfers, approvals, and balance checks — all while the data stays encrypted."
        />
        <HighlightCard
          title="Owner-Only Decryption"
          description="Only you can decrypt your balance by signing an EIP-712 permit with your wallet. Your private key never leaves the browser."
        />
      </div>

      <div className="learn-key-terms">
        <h4 style={{ marginBottom: 'var(--sp-3)', fontWeight: 600 }}>Key Terms</h4>
        <div className="learn-terms-grid">
          <TermDef
            term="ERC-7984"
            definition="The confidential token standard. Extends ERC-20 with FHE-encrypted balances and transfer amounts."
          />
          <TermDef
            term="fhEVM"
            definition="Zama's modified EVM that supports fully homomorphic encryption operations natively in smart contracts."
          />
          <TermDef
            term="euint64"
            definition="An encrypted 64-bit unsigned integer — the native FHE type used for confidential token balances."
          />
          <TermDef
            term="Zama Gateway"
            definition="The off-chain service that performs FHE decryption when a user provides a valid EIP-712 permit signature."
          />
        </div>
      </div>
    </div>
  );
}

function StepFaucet() {
  return (
    <div className="learn-step-body">
      <p className="learn-lead">
        Before you can shield tokens, you need some test tokens. ZamaVault
        includes a <strong>Faucet</strong> page that lets you mint free mock
        tokens on the Sepolia testnet — no cost, no limits.
      </p>

      <div className="learn-instructions">
        <InstructionStep
          number={1}
          title="Connect your wallet"
          description="Click 'Connect Wallet' in the header and select your wallet provider (MetaMask, Rabby, etc). Make sure you're on the Sepolia network."
        />
        <InstructionStep
          number={2}
          title="Go to the Faucet"
          description="Navigate to the Faucet page. You'll see all available mock tokens: USDC, USDT, WETH, BRON, ZAMA, tGBP, and XAUt."
        />
        <InstructionStep
          number={3}
          title="Enter an amount & mint"
          description="Type how many tokens you want (up to 1,000,000 per transaction). Click 'Mint' and confirm the transaction in your wallet."
        />
        <InstructionStep
          number={4}
          title="Tokens arrive instantly"
          description="After the transaction confirms (~15 seconds on Sepolia), your mock tokens will appear in your wallet and on the Registry page."
        />
      </div>

      <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-6)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <Badge variant="info">Tip</Badge>
          <span className="text-sm">
            Mock tokens have a &quot;Mock&quot; badge in the UI. They behave identically to
            real tokens for testing shielding and decryption flows.
          </span>
        </div>
      </Card>

      <div style={{ marginTop: 'var(--sp-6)' }}>
        <Link href="/faucet">
          <Button variant="primary" size="lg" style={{ gap: 'var(--sp-2)' }}>
            <Droplets size={18} /> Go to Faucet
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StepShield() {
  return (
    <div className="learn-step-body">
      <p className="learn-lead">
        <strong>Shielding</strong> (also called &quot;wrapping&quot;) converts your public
        ERC-20 tokens into confidential ERC-7984 tokens. Your balance becomes
        encrypted on-chain — invisible to everyone except you.
      </p>

      <div className="learn-instructions">
        <InstructionStep
          number={1}
          title="Open the Wrap page"
          description="Navigate to 'Wrap / Unwrap' from the header navigation, or click 'Shield' on any token row in the Registry."
        />
        <InstructionStep
          number={2}
          title="Select a token & amount"
          description="Choose the token you want to shield from the dropdown. Enter the amount you want to convert to confidential."
        />
        <InstructionStep
          number={3}
          title="Approve & Shield"
          description={
            <>
              Two transactions: first an <strong>ERC-20 approval</strong> (allows
              the wrapper contract to spend your tokens), then the{' '}
              <strong>shield transaction</strong> itself.
              <Tooltip
                content={
                  <>
                    The approval step uses the standard ERC-20 <code>approve()</code>{' '}
                    function. You only need to approve once per token unless you
                    revoke the allowance.
                  </>
                }
              />
            </>
          }
        />
        <InstructionStep
          number={4}
          title="Done — your balance is now encrypted"
          description="After confirmation, your tokens are stored as encrypted ciphertext (euint64) in the wrapper contract. The public balance decreases and the confidential balance increases."
        />
      </div>

      <div className="learn-callout-box" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)' }}>
        <h4 style={{ color: 'var(--success)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
          <Shield size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
          Decimal Scaling
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          All wrapper tokens use <strong>6 decimals</strong> regardless of the
          underlying token&apos;s precision (which may be 18). This is because FHE
          operates on <code>euint64</code> — a 64-bit integer that would overflow
          at large 18-decimal values. The wrapper contract automatically scales
          amounts during shield and unshield.
        </p>
      </div>

      <div style={{ marginTop: 'var(--sp-6)' }}>
        <Link href="/wrap">
          <Button variant="primary" size="lg" style={{ gap: 'var(--sp-2)' }}>
            <Shield size={18} /> Go to Wrap / Unwrap
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StepDecrypt() {
  return (
    <div className="learn-step-body">
      <p className="learn-lead">
        Your confidential balance is encrypted on-chain. To view it, you need to
        <strong> sign an EIP-712 permit</strong> — a typed off-chain signature
        that authorizes the Zama Gateway to decrypt your balance and return the
        plaintext to your browser.
      </p>

      <div className="learn-instructions">
        <InstructionStep
          number={1}
          title="Click the 'Decrypt' button"
          description="On the Registry page, Portfolio, or Wrap page, click the 'Decrypt' button next to your confidential balance."
        />
        <InstructionStep
          number={2}
          title="Sign the EIP-712 permit in your wallet"
          description={
            <>
              Your wallet will show a typed data signature request. This creates a
              <strong> temporary session key</strong> that the Zama Gateway uses to
              decrypt. <em>Your private key never leaves your wallet.</em>
            </>
          }
        />
        <InstructionStep
          number={3}
          title="Balance appears"
          description="The decrypted value is returned to your browser and displayed in the UI. It is never stored on-chain in plaintext."
        />
      </div>

      <div className="learn-callout-box" style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}>
        <h4 style={{ color: '#a78bfa', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
          <Lock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
          Privacy Guarantee
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The EIP-712 permit is <strong>off-chain</strong> — it is not a
          transaction and costs no gas. The signature is scoped to your wallet
          address and a specific contract, so it cannot be reused by anyone else.
          The Zama Gateway decrypts the ciphertext using your session key and
          returns the result exclusively to your browser session.
        </p>
      </div>

      <Card variant="glass" padding="sm" style={{ marginTop: 'var(--sp-6)', borderColor: 'rgba(167, 139, 250, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <Badge variant="warning">Important</Badge>
          <span className="text-sm">
            ZamaVault <strong>never</strong> auto-fires permit signatures. You
            always click &quot;Decrypt&quot; first — your wallet only prompts when you
            explicitly request it.
          </span>
        </div>
      </Card>
    </div>
  );
}

function StepUnshield() {
  return (
    <div className="learn-step-body">
      <p className="learn-lead">
        <strong>Unshielding</strong> (also called &quot;unwrapping&quot;) converts your
        confidential ERC-7984 tokens back into public ERC-20 tokens. This is a
        two-step process: an on-chain request followed by finalization.
      </p>

      <div className="learn-instructions">
        <InstructionStep
          number={1}
          title="Open the Wrap page"
          description="Navigate to 'Wrap / Unwrap' and toggle to the 'Unshield' tab. Select the token you want to unwrap."
        />
        <InstructionStep
          number={2}
          title="Enter amount & submit"
          description="Enter the amount to unshield and click 'Unshield'. Confirm the on-chain transaction in your wallet."
        />
        <InstructionStep
          number={3}
          title="Wait for finalization"
          description={
            <>
              The unshield is a <strong>two-phase process</strong>: the unwrap
              request goes on-chain, then the Zama Gateway processes it and triggers
              finalization. This typically takes 30–60 seconds.
              <Tooltip
                content={
                  <>
                    The Zama Gateway needs to decrypt the encrypted amount to verify
                    you have sufficient balance, then sends a finalization transaction.
                    If you close the browser during this window, use the{' '}
                    <strong>&quot;Resume Unshield&quot;</strong> banner to complete it later.
                  </>
                }
              />
            </>
          }
        />
        <InstructionStep
          number={4}
          title="Tokens returned to your wallet"
          description="Once finalized, the public ERC-20 tokens are back in your wallet at the original precision (e.g. 18 decimals for WETH)."
        />
      </div>

      <div className="learn-callout-box" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <h4 style={{ color: 'var(--warning)', marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
          <Sparkles size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 6 }} />
          Interrupted Unshield?
        </h4>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          If you close your browser between the unwrap request and finalization,
          don&apos;t worry — ZamaVault detects pending unshields automatically and
          shows a yellow <strong>&quot;Resume Unshield&quot;</strong> banner. Click
          &quot;Resume&quot; to complete the process. Your tokens are never lost.
        </p>
      </div>

      <div style={{ marginTop: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <Link href="/wrap">
          <Button variant="primary" size="lg" style={{ gap: 'var(--sp-2)' }}>
            <Unlock size={18} /> Go to Wrap / Unwrap
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Button>
        </Link>
        <Link href="/portfolio">
          <Button variant="secondary" size="lg" style={{ gap: 'var(--sp-2)' }}>
            View Portfolio
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ───────────────────────────────────────────────── */

function DiagramBox({
  label,
  description,
  color,
  icon,
}: {
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="learn-diagram-box"
      style={{ borderColor: color, '--box-accent': color } as React.CSSProperties}
    >
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{label}</div>
      <div className="text-xs text-muted">{description}</div>
    </div>
  );
}

function HighlightCard({ title, description }: { title: string; description: string }) {
  return (
    <Card variant="glass" padding="sm" hover>
      <h4 style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-1)' }}>
        {title}
      </h4>
      <p className="text-xs text-muted" style={{ lineHeight: 'var(--lh-relaxed)' }}>
        {description}
      </p>
    </Card>
  );
}

function TermDef({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="learn-term">
      <code className="learn-term-code">{term}</code>
      <span className="text-sm text-secondary">{definition}</span>
    </div>
  );
}

function InstructionStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="learn-instruction">
      <div className="learn-instruction-number">{number}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 2 }}>
          {title}
        </div>
        <div className="text-sm text-secondary" style={{ lineHeight: 'var(--lh-relaxed)' }}>
          {description}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page component ───────────────────────────────────────────────────── */

export default function LearnPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStep = STEPS.find((s) => s.id === activeStep)!;

  const goTo = (id: number) => {
    // Mark current step as completed when navigating forward
    if (id > activeStep) {
      setCompletedSteps((prev) => new Set([...prev, activeStep]));
    }
    setActiveStep(id);
  };

  const goNext = () => {
    if (activeStep < STEPS.length) goTo(activeStep + 1);
  };

  const goPrev = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  const markComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, activeStep]));
    if (activeStep < STEPS.length) goTo(activeStep + 1);
  };

  const allComplete = completedSteps.size >= STEPS.length;

  return (
    <div className="learn-page">
      {/* ── Header ── */}
      <div className="learn-header">
        <Badge variant="accent" style={{ marginBottom: 'var(--sp-3)' }}>
          <BookOpen size={12} style={{ marginRight: 4 }} /> Interactive Guide
        </Badge>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
          <BlurIn text="Learn Confidential Tokens" duration={600} />
        </h1>
        <p
          className="text-secondary"
          style={{
            fontSize: 'var(--text-lg)',
            maxWidth: 600,
            margin: 'var(--sp-3) auto 0',
            lineHeight: 'var(--lh-relaxed)',
          }}
        >
          A step-by-step walkthrough of Zama&apos;s FHE-powered confidential
          token ecosystem. From test tokens to encrypted balances — in 5 minutes.
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="learn-progress-bar">
        {STEPS.map((step) => {
          const isActive = step.id === activeStep;
          const isComplete = completedSteps.has(step.id);

          return (
            <button
              key={step.id}
              className={`learn-progress-step ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => goTo(step.id)}
              aria-label={`Step ${step.id}: ${step.title}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="learn-progress-icon">
                {isComplete ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              <div className="learn-progress-label">
                <span className="learn-progress-number">Step {step.id}</span>
                <span className="learn-progress-title">{step.title}</span>
              </div>
              {step.id < STEPS.length && (
                <div className={`learn-progress-connector ${isComplete ? 'complete' : ''}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Completion banner ── */}
      {allComplete && (
        <Card
          variant="glass"
          padding="md"
          style={{
            borderColor: 'rgba(16, 185, 129, 0.5)',
            background: 'rgba(16, 185, 129, 0.06)',
            textAlign: 'center',
            marginBottom: 'var(--sp-6)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-1)' }}>
                Tutorial Complete!
              </h3>
              <p className="text-secondary text-sm">
                You now understand the full confidential token lifecycle. Ready to
                try it for real?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/faucet">
                <Button variant="primary" style={{ gap: 'var(--sp-2)' }}>
                  <Droplets size={16} /> Get Test Tokens
                </Button>
              </Link>
              <Link href="/wrap">
                <Button variant="secondary" style={{ gap: 'var(--sp-2)' }}>
                  <Shield size={16} /> Start Shielding
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" style={{ gap: 'var(--sp-2)' }}>
                  Explore Registry
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Active step content ── */}
      <Card variant="default" padding="lg" className="learn-content-card">
        <div className="learn-content-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div
              className="learn-content-icon"
              style={{
                background: `color-mix(in srgb, ${currentStep.accentColor} 15%, transparent)`,
                color: currentStep.accentColor,
              }}
            >
              {currentStep.icon}
            </div>
            <div>
              <div className="text-xs text-muted" style={{ marginBottom: 2 }}>
                Step {currentStep.id} of {STEPS.length}
              </div>
              <h2 style={{ fontWeight: 700, fontSize: 'var(--text-2xl)' }}>
                {currentStep.title}
              </h2>
              <p className="text-sm text-muted">{currentStep.subtitle}</p>
            </div>
          </div>
        </div>

        <StepContent stepId={activeStep} />

        {/* ── Navigation ── */}
        <div className="learn-nav">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={activeStep === 1}
            style={{ gap: 'var(--sp-2)' }}
          >
            <ChevronLeft size={16} /> Previous
          </Button>

          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {!completedSteps.has(activeStep) && (
              <Button
                variant="secondary"
                onClick={markComplete}
                style={{ gap: 'var(--sp-2)' }}
              >
                <CheckCircle2 size={14} /> Mark as Done
              </Button>
            )}
            {activeStep < STEPS.length ? (
              <Button
                variant="primary"
                onClick={goNext}
                style={{ gap: 'var(--sp-2)' }}
              >
                Next Step <ChevronRight size={16} />
              </Button>
            ) : !allComplete ? (
              <Button
                variant="primary"
                onClick={markComplete}
                style={{ gap: 'var(--sp-2)' }}
              >
                <CheckCircle2 size={14} /> Complete Tutorial
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ── Resources footer ── */}
      <div className="learn-resources">
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--sp-4)' }}>
          Further Resources
        </h3>
        <div className="learn-resources-grid">
          <ResourceLink
            href="https://docs.zama.org/protocol/sdk/overview"
            title="Zama SDK Docs"
            description="Official SDK documentation with API references and guides."
          />
          <ResourceLink
            href="https://docs.zama.org/protocol/protocol-apps/addresses/testnet/sepolia"
            title="Sepolia Addresses"
            description="Official contract addresses for the Sepolia testnet deployment."
          />
          <ResourceLink
            href="/api/registry?chain=sepolia"
            title="Registry API"
            description="ZamaVault's public REST API — query all wrapper pairs programmatically."
          />
          <ResourceLink
            href="https://docs.zama.org/protocol/sdk/api-references/sdk/errors"
            title="Error Reference"
            description="Complete guide to Zama SDK error codes and how to handle them."
          />
        </div>
      </div>
    </div>
  );
}

function ResourceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  const isExternal = href.startsWith('http');
  const Wrapper = isExternal ? 'a' : Link;
  const extraProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Wrapper href={href} {...extraProps}>
      <Card variant="glass" padding="sm" hover style={{ height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--sp-2)' }}>
          <ExternalLink size={14} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {title}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
              {description}
            </div>
          </div>
        </div>
      </Card>
    </Wrapper>
  );
}
