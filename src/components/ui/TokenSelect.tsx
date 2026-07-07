'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import TokenIcon from '@/components/ui/TokenIcon';
import Badge from '@/components/ui/Badge';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface TokenSelectOption {
  value: string;
  symbol: string;
  name: string;
  iconSymbol?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'accent' | 'warning' | 'success' | 'error' | 'info';
  };
  address?: string;
}

export interface TokenSelectGroup {
  label: string;
  options: TokenSelectOption[];
}

export interface TokenSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: TokenSelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'md' | 'sm';
  className?: string;
  style?: React.CSSProperties;
}

export default function TokenSelect({
  value,
  onChange,
  groups,
  placeholder = '— Select a token —',
  disabled = false,
  size = 'md',
  className = '',
  style,
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Find currently selected option across all groups
  const selectedOption = useMemo(() => {
    for (const group of groups) {
      for (const opt of group.options) {
        if (opt.value === value) return opt;
      }
    }
    return null;
  }, [groups, value]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.symbol.toLowerCase().includes(q) ||
            o.name.toLowerCase().includes(q) ||
            (o.address && o.address.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, searchQuery]);

  const totalOptions = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.options.length, 0);
  }, [groups]);

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`token-select-container ${className}`}
      style={{
        position: 'relative',
        width: isSmall ? 'auto' : '100%',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: isSmall ? '8px 12px' : '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
          background: isOpen ? 'var(--bg-card)' : 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontSize: isSmall ? 'var(--text-sm)' : 'var(--text-base)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(56, 189, 248, 0.15)' : 'none',
          textAlign: 'left',
          minWidth: isSmall ? '150px' : 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
          {selectedOption ? (
            <>
              <TokenIcon symbol={selectedOption.iconSymbol || selectedOption.symbol} size={isSmall ? 20 : 24} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOption.symbol}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  · {selectedOption.name}
                </span>
                {selectedOption.badge && (
                  <Badge variant={selectedOption.badge.variant || 'default'} size="sm" style={{ marginLeft: 4 }}>
                    {selectedOption.badge.text}
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>

      {/* Dropdown Menu (Always positioned downwards with maxHeight!) */}
      {isOpen && (
        <div
          className="token-select-dropdown animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: isSmall ? 'auto' : 0,
            right: 0,
            minWidth: isSmall ? '280px' : '100%',
            maxHeight: '280px',
            overflowY: 'auto',
            background: 'var(--bg-card, rgba(15, 23, 42, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 9999,
          }}
        >
          {/* Search bar (only if > 4 total items) */}
          {totalOptions > 4 && (
            <div
              style={{
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-card)',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  border: '1px solid var(--border)',
                }}
              >
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by symbol, name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    padding: 0,
                  }}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div style={{ padding: '6px' }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No tokens match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredGroups.map((group, gIdx) => (
                <div key={group.label} style={{ marginBottom: gIdx < filteredGroups.length - 1 ? 8 : 0 }}>
                  <div
                    style={{
                      padding: '6px 10px 4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--accent)',
                      opacity: 0.9,
                    }}
                  >
                    {group.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {group.options.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            transition: 'background 150ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                            <TokenIcon symbol={opt.iconSymbol || opt.symbol} size={24} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                                  {opt.symbol}
                                </span>
                                {opt.badge && (
                                  <Badge variant={opt.badge.variant || 'default'} size="sm">
                                    {opt.badge.text}
                                  </Badge>
                                )}
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {opt.name}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
