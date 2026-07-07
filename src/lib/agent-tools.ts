/**
 * ShadowLine AI Agent Tools (`@shadowline/agent-tools`)
 *
 * Pre-built tool definitions compatible with Vercel AI SDK, LangChain, Eliza,
 * and OpenAI function calling. Equip any autonomous AI agent with native
 * understanding of Zama FHEVM asset shielding, confidential token pairs,
 * and headless SDK execution via `ShadowlineAgentHarness`.
 *
 * @example
 * ```ts
 * import { shadowlineTools, ShadowlineAgentHarness } from '@/lib/agent-tools';
 * // Pass directly into Vercel AI SDK or LangChain agent executor!
 * ```
 */

export * from './agent-harness';

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute?: (args: any) => Promise<any>;
}

export const shadowlineTools: Record<string, AgentToolDefinition> = {
  getConfidentialPairs: {
    name: 'getConfidentialPairs',
    description:
      'Fetch all verified ERC-20 to ERC-7984 confidential token wrapper pairs on Zama FHEVM. Returns token addresses, symbols, and decimals.',
    parameters: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['sepolia', 'mainnet'],
          description: 'The blockchain network to query. Defaults to sepolia.',
        },
        baseUrl: {
          type: 'string',
          description: 'Optional base URL of the ShadowLine API (defaults to https://shadow-line.vercel.app)',
        },
      },
      required: [],
    },
    execute: async ({ chain = 'sepolia', baseUrl = 'https://shadow-line.vercel.app' }: { chain?: 'sepolia' | 'mainnet'; baseUrl?: string } = {}) => {
      const res = await fetch(`${baseUrl}/api/registry?chain=${chain}`);
      return await res.json();
    },
  },

  getDecimalScalingRule: {
    name: 'getDecimalScalingRule',
    description:
      'Get the mandatory decimal scaling rules for shielding (depositing), transferring, and unshielding (withdrawing) confidential tokens on Zama FHEVM.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      rule: 'FHE euint64 fixed scaling',
      shield_decimals: 'Use UNDERLYING ERC-20 decimals (e.g. 6 for USDC, 18 for WETH/ZAMA).',
      unshield_decimals: 'Always use FIXED 6 DECIMALS (euint64 scale), regardless of underlying token.',
      transfer_decimals: 'Always use FIXED 6 DECIMALS (euint64 scale).',
      explanation:
        'Zama fhEVM represents encrypted balances as 64-bit unsigned homomorphic integers normalized to 6 decimal places to prevent overflow and standardize computation costs across all assets.',
    }),
  },

  getAgentHarnessGuide: {
    name: 'getAgentHarnessGuide',
    description:
      'Get instructions and TypeScript code for running an autonomous AI agent in headless Node.js or Python backend environments using ShadowlineAgentHarness.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      summary: 'Headless AI agents must NOT use browser hooks or raw Viem FHE contract calls. Use ShadowlineAgentHarness which wraps @zama-fhe/sdk in Node worker pool mode.',
      code_example: `
import { ShadowlineAgentHarness } from '@/lib/agent-harness';

// 1. Initialize Headless Agent Harness
const agent = new ShadowlineAgentHarness({
  privateKey: '0xYOUR_AGENT_PRIVATE_KEY',
  relayerApiKey: 'YOUR_ZAMA_RELAYER_API_KEY', // Required for KMS decryption
});
await agent.init();

// 2. Discover Verified Pairs
const pairs = await agent.getPairs();
const wrapper = pairs[0].confidentialTokenAddress;

// 3. Shield (Wrap) ERC-20 -> ERC-7984 (in underlying decimals)
const shieldHash = await agent.shield(wrapper, '10.5');

// 4. Decrypt Confidential Balance (auto-signs EIP-712 permit & decrypts in WASM)
const balance = await agent.getConfidentialBalance(wrapper);

// 5. Confidential Transfer (auto-encrypts amount client-side via WASM)
const transferHash = await agent.transfer(wrapper, '0xRecipientAddress', '5.0');

// 6. Unshield (Unwrap) ERC-7984 -> ERC-20 (in fixed 6 decimals scale)
const unshieldHash = await agent.unshield(wrapper, '5.0');
      `.trim(),
    }),
  },

  getReactSdkGuide: {
    name: 'getReactSdkGuide',
    description:
      'Get instructions and React hook code for integrating ShadowLine FHE shielding and confidential transfers into frontend dApps.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      summary: 'React developers should use the drop-in useShadowline() hook or official @zama-fhe/react-sdk hooks.',
      code_example: `
import { useShadowline } from '@/lib/use-shadowline';

export default function ConfidentialWallet() {
  const { pairs, shield, unshield, decryptBalance, transfer, isReady } = useShadowline();

  return (
    <div>
      <button onClick={() => shield(pairs[0].erc7984Address, '10.0')}>Shield 10 USDC</button>
      <button onClick={() => transfer(pairs[0].erc7984Address, '0xRecipient', '5.0')}>Send 5 cUSDC</button>
      <button onClick={async () => alert(await decryptBalance(pairs[0].erc7984Address))}>View Balance</button>
    </div>
  );
}
      `.trim(),
    }),
  },

  getContractAbis: {
    name: 'getContractAbis',
    description:
      'Get verified read-only smart contract ABIs for underlying ERC-20 token inspection. Explicitly warns against hand-rolling FHE write calldata without Zama SDK.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      warning: 'CRITICAL: Do NOT attempt to call confidential transfer() or unwrap() using plaintext uint256/bytes32 amounts in Viem/Ethers! FHE operations require client-side WASM encryption of euint64 handles and FHE input proof generation. Always use @zama-fhe/sdk or ShadowlineAgentHarness.',
      erc20_readonly: [
        'function balanceOf(address account) external view returns (uint256)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function decimals() external view returns (uint8)',
      ],
      erc7984_readonly: [
        'function underlying() external view returns (address)',
        'function confidentialBalanceOf(address account) external view returns (bytes32)',
        'function rate() external view returns (uint256)',
      ],
    }),
  },
};
