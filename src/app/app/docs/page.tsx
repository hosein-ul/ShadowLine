import React from 'react';
import { DocPage } from './_docs/components';
import Overview from './_docs/content/overview';

/** Docs index → the Overview page. Real subpages live under `/app/docs/[slug]`. */
export default function DocsIndexPage() {
  return (
    <DocPage slug="overview">
      <Overview />
    </DocPage>
  );
}
