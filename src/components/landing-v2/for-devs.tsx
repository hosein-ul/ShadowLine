'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * For Devs — three code blocks side by side, monospace, no syntax tinsel.
 * Tabs above let visitors pick React / curl / viem. Underneath: links to
 * /app/developers and /api/registry.
 */
const SAMPLES = {
  react: `import { useShield } from "@zama-fhe/react-sdk";

const { mutateAsync: shield } = useShield({
  address: "0xWrapper",
});

await shield({
  amount: 1000n,
  approvalStrategy: "skip",
});`,
  curl: `curl https://your-deployment.vercel.app/api/registry?chain=sepolia

# →
# {
#   "pairs": [
#     { "symbol": "USDC", "tokenAddress": "0x...",
#       "confidentialTokenAddress": "0x...",
#       "decimals": 6, "wrapperDecimals": 6 },
#     ...
#   ],
#   "total": 8,
#   "source": "on-chain"
# }`,
  viem: `import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { REGISTRY_ABI } from "./abi";

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const [tokens, wrappers] = await client.readContract({
  address: "0xRegistry",
  abi: REGISTRY_ABI,
  functionName: "listPairs",
  args: [0n, 100n],
});`,
};

export function ForDevs() {
  return (
    <section id="devs" data-section className="v2-section bg-cream-200/40">
      <div className="v2-container">

        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">

          <div className="md:col-span-5">
            <p className="v2-eyebrow mb-4">Build on it</p>
            <h2 className="v2-display text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] text-ink-900">
              An SDK, a REST endpoint, a copy-paste hook.
            </h2>
            <p className="mt-6 text-ink-700 leading-relaxed text-[15px] max-w-md">
              ZamaVault’s registry is exposed verbatim through a public
              JSON endpoint. The shield/decrypt/unshield flows are one
              hook each. Snippets for React, viem, and ethers are kept
              in sync with the live app.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/app/developers"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 border-b border-ink-900/30 hover:border-gold-500 pb-0.5 transition-colors"
              >
                Snippet generator
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/api/registry?chain=sepolia"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 border-b border-ink-900/30 hover:border-gold-500 pb-0.5 transition-colors"
              >
                Try the API
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <CodeBlock title="React · useShield" code={SAMPLES.react} delay={0.05} />
            <CodeBlock title="REST · /api/registry" code={SAMPLES.curl} delay={0.15} />
            <CodeBlock title="viem · listPairs" code={SAMPLES.viem} delay={0.25} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CodeBlock({ title, code, delay }: { title: string; code: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-ink-900/[0.08] bg-ink-900 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-cream-300">{title}</span>
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cream-300/30" />
          <span className="h-2 w-2 rounded-full bg-cream-300/30" />
          <span className="h-2 w-2 rounded-full bg-gold-500" />
        </span>
      </div>
      <pre className="px-5 py-5 font-mono text-[12px] leading-relaxed text-cream-100 overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </motion.div>
  );
}
