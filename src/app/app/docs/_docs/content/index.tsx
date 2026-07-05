'use client';

import React from 'react';
import Overview from './overview';
import QuickStart from './quickstart';
import Architecture from './architecture';
import Fhe from './fhe';
import DecimalScaling from './decimal-scaling';
import Permits from './permits';
import Shield from './shield';
import Transfer from './transfer';
import Registry from './registry';
import Portfolio from './portfolio';
import RestApi from './rest-api';
import AiAgents from './ai-agents';
import UseCases from './use-cases';
import Addresses from './addresses';
import Errors from './errors';
import Security from './security';
import Faq from './faq';

/** slug → body component. Keys must match `slug` values in nav.ts. */
export const DOC_CONTENT: Record<string, React.ComponentType> = {
  overview: Overview,
  quickstart: QuickStart,
  architecture: Architecture,
  fhe: Fhe,
  'decimal-scaling': DecimalScaling,
  permits: Permits,
  shield: Shield,
  transfer: Transfer,
  registry: Registry,
  portfolio: Portfolio,
  'rest-api': RestApi,
  'ai-agents': AiAgents,
  'use-cases': UseCases,
  addresses: Addresses,
  errors: Errors,
  security: Security,
  faq: Faq,
};
