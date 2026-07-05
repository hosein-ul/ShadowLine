'use client';

/**
 * Client-side resolver for a docs subpage. The `[slug]` route is a server
 * component (so it can own generateStaticParams + dynamicParams), but the
 * slug→component map lives in a 'use client' module and must be read on the
 * client — hence this thin wrapper.
 */

import React from 'react';
import { DocPage } from './components';
import { DOC_CONTENT } from './content';

export default function DocRenderer({ slug }: { slug: string }) {
  const Body = DOC_CONTENT[slug];
  if (!Body) return null; // unknown slugs are already 404'd by dynamicParams=false
  return (
    <DocPage slug={slug}>
      <Body />
    </DocPage>
  );
}
