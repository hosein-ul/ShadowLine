/**
 * ShadowLine AI Agent Tools (`@shadowline/agent-tools`)
 *
 * Pre-built tool definitions compatible with Vercel AI SDK, LangChain, Eliza,
 * and OpenAI function calling. Equip any autonomous AI agent with native
 * understanding of Zama FHEVM asset shielding and confidential token pairs.
 *
 * @example
 * ```ts
 * import { shadowlineTools } from '@/lib/agent-tools';
 * // Pass directly into Vercel AI SDK or LangChain agent executor!
 * ```
 */

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
      },
      required: [],
    },
    execute: async ({ chain = 'sepolia' }: { chain?: 'sepolia' | 'mainnet' } = {}) => {
      const res = await fetch(`https://shadow-line.netlify.app/api/registry?chain=${chain}`);
      return await res.json();
    },
  },

  getDecimalScalingRule: {
    name: 'getDecimalScalingRule',
    description:
      'Get the mandatory decimal scaling rules for shielding (depositing) and unshielding (withdrawing) confidential tokens on Zama FHEVM.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      rule: 'FHE euint64 fixed scaling',
      shield_decimals: 'Use UNDERLYING ERC-20 decimals (e.g. 6 for USDC, 18 for WETH/ZAMA).',
      unshield_decimals: 'Always use FIXED 6 DECIMALS (euint64 scale), regardless of underlying token.',
      transfer_decimals: 'Always use FIXED 6 DECIMALS.',
      explanation:
        'Zama fhEVM represents encrypted balances as 64-bit unsigned homomorphic integers normalized to 6 decimal places to prevent overflow and standardize computation costs.',
    }),
  },

  getContractAbis: {
    name: 'getContractAbis',
    description:
      'Get the essential smart contract ABIs required for an AI agent to approve ERC-20 spend, shield tokens (depositFor), and unshield tokens (requestWithdraw).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    execute: async () => ({
      erc20_approve: 'function approve(address spender, uint256 amount) external returns (bool)',
      erc7984_shield: 'function depositFor(address to, uint256 amount) external returns (bool)',
      erc7984_unshield: 'function requestWithdraw(uint64 amount) external returns (uint256)',
      erc7984_transfer: 'function confidentialTransfer(address to, bytes calldata encryptedAmount) external returns (bool)',
    }),
  },
};
