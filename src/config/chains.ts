import { sepolia, mainnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [sepolia, mainnet] as const;

export type SupportedChainId = typeof sepolia.id | typeof mainnet.id;

export const DEFAULT_CHAIN = sepolia;

export const CHAIN_CONFIG: Record<SupportedChainId, {
  name: string;
  shortName: string;
  explorerUrl: string;
  isTestnet: boolean;
  color: string;
}> = {
  [sepolia.id]: {
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    color: '#627EEA',
  },
  [mainnet.id]: {
    name: 'Ethereum Mainnet',
    shortName: 'Mainnet',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    color: '#627EEA',
  },
};

export function getExplorerUrl(chainId: number): string {
  const config = CHAIN_CONFIG[chainId as SupportedChainId];
  return config?.explorerUrl ?? 'https://etherscan.io';
}
