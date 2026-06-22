import { type SupportedChainId } from './chains';
import { sepolia, mainnet } from 'wagmi/chains';

/**
 * Wrapper pair definitions.
 *
 * As of the dynamic-registry migration, the canonical source of pairs is the
 * on-chain `WrappersRegistry` contract, read via the `useRegistryPairs` hook
 * in `src/lib/registry.ts` (which itself wraps `useListPairs` from
 * `@zama-fhe/react-sdk`). The `KNOWN_WRAPPERS` map below is now a **fallback
 * snapshot only**, used while the wallet is disconnected or while the live
 * call is in flight. Do not rely on it for correctness — it WILL drift from
 * the registry over time (the audit captured two missing pairs already:
 * Sepolia `ctGBP`; Mainnet `cbbqTGBP` is blocklisted as a suspected
 * test entry — see `BLOCKLISTED_WRAPPERS` in `src/lib/registry.ts`).
 *
 * `REGISTRY_ADDRESSES` is exported for any direct on-chain reads (indexers,
 * CLI scripts) but the app itself goes through the SDK.
 */

export interface WrapperPair {
  erc20Address: `0x${string}`;
  erc7984Address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  wrapperDecimals: number;
  /**
   * Mirrors the registry's `isValid` flag. A pair with `isValid === false`
   * has been revoked but is still present in the registry's enumeration.
   * The UI should hide or visually mark such pairs. Optional because the
   * hardcoded fallback predates this field; treat `undefined` as `true`.
   */
  isValid?: boolean;
  /**
   * Original underlying ERC-20 symbol as reported by the on-chain contract
   * BEFORE any normalization (e.g. `USDCMock` rather than the normalized
   * `USDC`). Used by the faucet to detect mintable mock tokens — only
   * symbols ending in `Mock` (case-insensitive) have a public `mint()`.
   * Optional because the hardcoded fallback doesn't carry it; the faucet
   * falls back to the hardcoded mock list when this is absent.
   */
  underlyingRawSymbol?: string;
}

// Registry contract addresses per network
export const REGISTRY_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  [sepolia.id]: '0x2f0750Bbb0A246059d80e94c454586a7F27a128e' as `0x${string}`,
  [mainnet.id]: '0xeb5015fF021DB115aCe010f23F55C2591059bBA0' as `0x${string}`,
};

// Known wrapper pairs per network
export const KNOWN_WRAPPERS: Record<SupportedChainId, WrapperPair[]> = {
  [sepolia.id]: [
    {
      erc20Address: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF',
      erc7984Address: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0',
      erc7984Address: '0x4E7B06D78965594eB5EF5414c357ca21E1554491',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xff54739b16576FA5402F211D0b938469Ab9A5f3F',
      erc7984Address: '0x46208622DA27d91db4f0393733C8BA082ed83158',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57',
      erc7984Address: '0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB',
      symbol: 'ZAMA',
      name: 'Zama Token',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xFf021fB13cA64e5354c62c954b949a88cfDEb25E',
      erc7984Address: '0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891',
      symbol: 'BRON',
      name: 'BRON Token',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0x93c931278A2aad1916783F952f94276eA5111442',
      erc7984Address: '0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC',
      symbol: 'tGBP',
      name: 'Tether GBP',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0x24377AE4AA0C45ecEe71225007f17c5D423dd940',
      erc7984Address: '0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7',
      symbol: 'XAUt',
      name: 'Tether Gold',
      decimals: 6,
      wrapperDecimals: 6,
    },
  ],
  [mainnet.id]: [
    {
      erc20Address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      erc7984Address: '0xe978F22157048E5DB8E5d07971376e86671672B2',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      erc7984Address: '0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      erc7984Address: '0xda9396b82634Ea99243cE51258B6A5Ae512D4893',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3',
      erc7984Address: '0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071',
      symbol: 'ZAMA',
      name: 'Zama Token',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0xBA2C598E11eD093079cC324FCa5BbbA99F616E83',
      erc7984Address: '0x85dE671c3bec1aDeD752c3Cea943521181C826bc',
      symbol: 'BRON',
      name: 'BRON Token',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0x27f6c8289550fce67f6b50bed1f519966afe5287',
      erc7984Address: '0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9',
      symbol: 'tGBP',
      name: 'Tether GBP',
      decimals: 18,
      wrapperDecimals: 6,
    },
    {
      erc20Address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
      erc7984Address: '0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1',
      symbol: 'XAUt',
      name: 'Tether Gold',
      decimals: 6,
      wrapperDecimals: 6,
    },
  ],
};
