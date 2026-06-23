'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  /** The tooltip content — can be plain text or JSX */
  content: React.ReactNode;
  /** Optional custom trigger element. Defaults to a (?) icon */
  children?: React.ReactNode;
  /** Max width of the tooltip bubble in px. Default 260 */
  maxWidth?: number;
}

/**
 * A styled hover tooltip that renders as a dark speech-bubble.
 * Use it next to column headers or technical terms to give users
 * context without cluttering the UI.
 *
 * Usage:
 *   <Tooltip content="ERC-7984 balances are encrypted on-chain using FHE." />
 *   <Tooltip content="..."><span>My custom trigger</span></Tooltip>
 */
export default function Tooltip({ content, children, maxWidth = 260 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  };
  const hide = () => setVisible(false);

  // Hide on scroll / resize so it doesn't float away
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setVisible(false);
    window.addEventListener('scroll', dismiss, { passive: true });
    window.addEventListener('resize', dismiss, { passive: true });
    return () => {
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [visible]);

  const bubble = visible && typeof window !== 'undefined'
    ? createPortal(
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth,
            background: 'rgba(20,20,28,0.97)',
            color: '#f0f0f0',
            fontSize: '12px',
            lineHeight: '1.5',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            textAlign: 'left',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              top: -5,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid rgba(20,20,28,0.97)',
            }}
          />
          {content}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        role="button"
        aria-label="More information"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'help',
          color: 'var(--text-muted)',
          outline: 'none',
          marginLeft: 3,
        }}
      >
        {children ?? <HelpCircle size={13} />}
      </span>
      {bubble}
    </>
  );
}
