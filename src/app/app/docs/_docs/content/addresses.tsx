'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, AddressTable } from '../components';

export default function Addresses() {
  return (
    <>
      <Lead>
        All addresses below are sourced from the official Zama documentation and verified against the
        on-chain WrappersRegistry. Blocklisted entries (suspected test/placeholder contracts with
        vanity addresses) are excluded.
      </Lead>

      <H2>Sepolia Testnet</H2>
      <AddressTable
        network="Sepolia"
        registry="0x2f0750Bbb0A246059d80e94c454586a7F27a128e"
        pairs={[
          { symbol: 'USDC', erc20: '0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF', wrapper: '0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639', decimals: 6 },
          { symbol: 'USDT', erc20: '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0', wrapper: '0x4E7B06D78965594eB5EF5414c357ca21E1554491', decimals: 6 },
          { symbol: 'WETH', erc20: '0xff54739b16576FA5402F211D0b938469Ab9A5f3F', wrapper: '0x46208622DA27d91db4f0393733C8BA082ed83158', decimals: 18 },
          { symbol: 'ZAMA', erc20: '0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57', wrapper: '0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB', decimals: 18 },
          { symbol: 'BRON', erc20: '0xFf021fB13cA64e5354c62c954b949a88cfDEb25E', wrapper: '0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891', decimals: 18 },
          { symbol: 'tGBP', erc20: '0x93c931278A2aad1916783F952f94276eA5111442', wrapper: '0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC', decimals: 18 },
          { symbol: 'XAUt', erc20: '0x24377AE4AA0C45ecEe71225007f17c5D423dd940', wrapper: '0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7', decimals: 6 },
        ]}
      />
      <P>
        The pairs above are <strong>mock tokens</strong> with a public <code>mint()</code> — grab
        free test tokens from the Faucet page. Addresses read live from the on-chain registry; this
        list is a snapshot and may lag new registrations.
      </P>

      <H2>Ethereum Mainnet</H2>
      <AddressTable
        network="Mainnet"
        registry="0xeb5015fF021DB115aCe010f23F55C2591059bBA0"
        pairs={[
          { symbol: 'USDC', erc20: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', wrapper: '0xe978F22157048E5DB8E5d07971376e86671672B2', decimals: 6 },
          { symbol: 'USDT', erc20: '0xdAC17F958D2ee523a2206206994597C13D831ec7', wrapper: '0xAe0207C757Aa2B4019Ad96edD0092ddc63EF0c50', decimals: 6 },
          { symbol: 'WETH', erc20: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', wrapper: '0xda9396b82634Ea99243cE51258B6A5Ae512D4893', decimals: 18 },
          { symbol: 'ZAMA', erc20: '0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3', wrapper: '0x80CB147Fd86dC6dEe3Eee7e4Cee33d1397d98071', decimals: 18 },
          { symbol: 'BRON', erc20: '0xBA2C598E11eD093079cC324FCa5BbbA99F616E83', wrapper: '0x85dE671c3bec1aDeD752c3Cea943521181C826bc', decimals: 18 },
          { symbol: 'tGBP', erc20: '0x27f6c8289550fce67f6b50bed1f519966afe5287', wrapper: '0xa873750ccBafD5ec7Dd13bfD5237d7129832eDD9', decimals: 18 },
          { symbol: 'XAUt', erc20: '0x68749665FF8D2d112Fa859AA293F07A622782F38', wrapper: '0x73cc9aF9d6BEFdb3c3fAf8a5E8c05Cb95FdaEEf1', decimals: 6 },
        ]}
      />
      <P>
        These are the pairs included in the local fallback snapshot. The live on-chain registry
        may contain additional pairs registered after this snapshot was taken — use the{' '}
        <Link href="/app/docs/rest-api">REST API</Link> or the{' '}
        <Link href="/app">Registry page</Link> for the authoritative, always-current list.
      </P>
    </>
  );
}
