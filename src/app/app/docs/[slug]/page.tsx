import React from 'react';
import DocRenderer from '../_docs/DocRenderer';
import { SUBPAGE_SLUGS } from '../_docs/nav';

/** Pre-render every known subpage; reject anything else with a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return SUBPAGE_SLUGS.map((slug) => ({ slug }));
}

export default async function DocSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DocRenderer slug={slug} />;
}
