/**
 * ShadowLine Autonomous AI Agent Harness (`@shadowline/agent-harness`)
 *
 * A headless, zero-hallucination execution harness for autonomous AI agents,
 * LLM scripts, background workers, and backend services building on ShadowLine.
 *
 * This harness uses `@zama-fhe/sdk` in Node.js mode (`node()`) with memory storage
 * and Viem client adapters to execute confidential DeFi operations without a browser.
 *
 * @example
 * ```ts
 * import { ShadowlineAgentHarness } from '@/lib/agent-harness';
 *
 * const agent = new ShadowlineAgentHarness({
 *   privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
 *   relayerApiKey: process.env.ZAMA_RELAYER_API_KEY!,
 * });
 *
 * await agent.init();
 * const pairs = await agent.getPairs();
 * const balance = await agent.getConfidentialBalance(pairs[0].confidentialTokenAddress);
 * ```
 */

import { ZamaSDK, MemoryStorage, SepoliaConfig } from '@zama-fhe/sdk';
import { RelayerNode } from '@zama-fhe/sdk/node';
import { ViemSigner } from '@zama-fhe/sdk/viem';
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, type Address, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export interface AgentHarnessConfig {
  /** The autonomous agent's private key (hex string starting with 0x) */
  privateKey: Hex;
  /** Relayer API Key for Zama KMS / Gateway authentication */
  relayerApiKey?: string;
  /** Custom RPC URL for Ethereum network (defaults to Sepolia public nodes) */
  rpcUrl?: string;
  /** Registry REST API base URL (defaults to https://shadow-line.netlify.app) */
  registryBaseUrl?: string;
}

export interface ConfidentialPair {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  symbol: string;
  confidentialSymbol: string;
  name: string;
  decimals: number;
  wrapperDecimals: number;
  isValid: boolean;
}

export class ShadowlineAgentHarness {
  private config: AgentHarnessConfig;
  private sdk: ZamaSDK | null = null;
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor(config: AgentHarnessConfig) {
    this.config = config;
    this.account = privateKeyToAccount(config.privateKey);
    
    const rpcUrl = config.rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Initialize the Zama FHE SDK worker pool and Viem signer adapter.
   * MUST be called before executing confidential operations.
   */
  async init(): Promise<void> {
    const rpcUrl = this.config.rpcUrl || 'https://ethereum-sepolia-rpc.publicnode.com';

    const signer = new ViemSigner({
      walletClient: this.walletClient,
      publicClient: this.publicClient,
    });

    const relayer = new RelayerNode({
      transports: {
        [sepolia.id]: {
          ...SepoliaConfig,
          network: rpcUrl,
        },
      },
      getChainId: () => Promise.resolve(sepolia.id),
    });

    this.sdk = new ZamaSDK({
      relayer,
      signer,
      storage: new MemoryStorage(),
    });
  }

  /**
   * Get the agent's public wallet address.
   */
  getAddress(): Address {
    return this.account.address;
  }

  /**
   * Fetch all verified ERC-20 ↔ ERC-7984 confidential token wrapper pairs from the registry API.
   */
  async getPairs(): Promise<ConfidentialPair[]> {
    const baseUrl = this.config.registryBaseUrl || 'https://shadow-line.netlify.app';
    const res = await fetch(`${baseUrl}/api/registry?chain=sepolia`);
    if (!res.ok) {
      throw new Error(`Failed to fetch registry pairs: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.pairs || [];
  }

  /**
   * Shield (wrap) public ERC-20 tokens into confidential ERC-7984 tokens.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Human-readable amount (e.g. "10.5"). MUST be in underlying ERC-20 units!
   */
  async shield(wrapperAddress: Address, amountStr: string, decimals?: number): Promise<Hex> {
    this.ensureInit();
    let dec = decimals;
    if (dec === undefined) {
      try {
        const pairs = await this.getPairs();
        const pair = pairs.find(p => p.confidentialTokenAddress.toLowerCase() === wrapperAddress.toLowerCase());
        dec = pair ? pair.decimals : 18;
      } catch {
        dec = 18;
      }
    }
    const rawAmount = parseUnits(amountStr, dec);
    const wrappedToken = this.sdk!.createToken(wrapperAddress);
    
    // Zama SDK createToken().shield() automatically handles ERC-20 allowance approval
    // and calls wrap() or transferAndCall() on-chain.
    const res = await wrappedToken.shield(rawAmount);
    return res.txHash;
  }

  /**
   * Check the agent's confidential token balance.
   * Automatically generates and signs an EIP-712 read-only permit, sends it to Zama KMS/Gateway,
   * and decrypts the resulting ciphertext inside the local Node.js WASM worker.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   */
  async getConfidentialBalance(wrapperAddress: Address): Promise<string> {
    this.ensureInit();
    const wrappedToken = this.sdk!.createToken(wrapperAddress);
    
    // Decrypts balance using the agent's EIP-712 read-only permit
    const balance = await wrappedToken.balanceOf(this.account.address);
    return balance.toString();
  }

  /**
   * Perform a confidential token transfer.
   * Automatically encrypts the transfer amount using local WASM FHE client-side encryption,
   * generates required ZK input proofs, and broadcasts the transaction.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param to - Recipient wallet address
   * @param amountStr - Human-readable amount (e.g. "5.0"). Formatted in fixed 6-decimal euint64 scale!
   */
  async transfer(wrapperAddress: Address, to: Address, amountStr: string): Promise<Hex> {
    this.ensureInit();
    const rawAmount = parseUnits(amountStr, 6); // FHE euint64 fixed 6-decimal scaling
    const wrappedToken = this.sdk!.createToken(wrapperAddress);
    
    // confidentialTransfer automatically encrypts amountStr into an FHE euint64 handle
    const res = await wrappedToken.confidentialTransfer(to, rawAmount);
    return res.txHash;
  }

  /**
   * Request unshielding (unwrap) of confidential ERC-7984 tokens back to public ERC-20 tokens.
   *
   * @param wrapperAddress - The confidential ERC-7984 wrapper contract address
   * @param amountStr - Human-readable amount (e.g. "5.0"). Formatted in fixed 6-decimal euint64 scale!
   */
  async unshield(wrapperAddress: Address, amountStr: string): Promise<Hex> {
    this.ensureInit();
    const rawAmount = parseUnits(amountStr, 6); // FHE euint64 fixed 6-decimal scaling
    const wrappedToken = this.sdk!.createToken(wrapperAddress);
    
    // Initiates unwrap request using already-approved or newly encrypted euint64 handle
    const res = await wrappedToken.unshield(rawAmount);
    return res.txHash;
  }

  private ensureInit(): void {
    if (!this.sdk) {
      throw new Error('ShadowlineAgentHarness not initialized. Call await agent.init() first.');
    }
  }
}
