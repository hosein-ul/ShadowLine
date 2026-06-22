'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 480 }}>
        An unexpected error occurred. You can try reloading the page or return to the home screen.
      </p>
      <details
        style={{
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-elevated, #1a1a2e)',
          borderRadius: '8px',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          maxWidth: 520,
          width: '100%',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error details</summary>
        <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error.message}
        </pre>
        {error.digest && (
          <p style={{ marginTop: '0.25rem', opacity: 0.6 }}>Digest: {error.digest}</p>
        )}
      </details>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--accent, #ffd208)',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--bg-surface, #252538)',
            color: 'var(--text-primary, #fff)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: '6px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to Registry
        </a>
      </div>
    </div>
  );
}
