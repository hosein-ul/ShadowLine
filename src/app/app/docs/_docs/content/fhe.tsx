'use client';

import React from 'react';
import Link from 'next/link';
import { Lead, P, H2, UL, Callout, FheConceptDiagram, Reveal } from '../components';

export default function Fhe() {
  return (
    <>
      <Lead>
        The whole system rests on two ideas: a way to compute on encrypted data (FHE), and a token
        standard that stores balances as ciphertext (ERC-7984).
      </Lead>

      <H2>Fully Homomorphic Encryption</H2>
      <P>
        <strong>Fully Homomorphic Encryption (FHE)</strong> is a cryptographic scheme that allows
        arbitrary computation on encrypted data without decrypting it first. Zama&apos;s{' '}
        <strong>fhEVM</strong> is a modified Ethereum Virtual Machine that supports FHE operations
        natively in Solidity — a contract can add two encrypted balances and get an encrypted sum,
        never seeing either plaintext.
      </P>

      <H2>The ERC-7984 standard</H2>
      <P>
        <strong>ERC-7984</strong> is the confidential token standard built on the fhEVM. Instead of
        storing balances as a public <code>uint256</code>, a wrapper contract stores them as{' '}
        <code>euint64</code> — an encrypted 64-bit integer. The plaintext is never on-chain; only the
        token owner can decrypt it.
      </P>

      <Reveal>
        <FheConceptDiagram />
      </Reveal>

      <Callout>
        <strong>Key properties of ERC-7984 tokens:</strong>
        <UL>
          <li>
            Balances are on-chain ciphertexts — unreadable by validators, indexers, or block
            explorers.
          </li>
          <li>Transfer amounts are encrypted — confidential even from recipients until decrypted.</li>
          <li>Decryption requires the owner&apos;s EIP-712 permit.</li>
          <li>The underlying ERC-20 is always 1:1 collateralized inside the wrapper contract.</li>
        </UL>
      </Callout>

      <H2>What FHE does and does not hide</H2>
      <P>
        FHE hides <strong>values</strong> — balances and transfer amounts. It does not hide the{' '}
        <strong>graph</strong>: the fact that address A interacted with a given wrapper contract, and
        when, is still public, because transactions and their senders are public on Ethereum. See the{' '}
        <Link href="/app/docs/security">Security Model</Link> for the precise trust boundaries.
      </P>
    </>
  );
}
