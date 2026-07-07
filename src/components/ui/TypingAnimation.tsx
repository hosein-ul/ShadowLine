'use client';

import React, { useEffect, useState } from 'react';

interface TypingAnimationProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}

export default function TypingAnimation({
  words,
  typingSpeed = 150,
  deletingSpeed = 80,
  delayBetweenWords = 2000,
}: TypingAnimationProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const longestWord = React.useMemo(() => {
    if (!words || words.length === 0) return '';
    return words.reduce((a, b) => (a.length > b.length ? a : b), words[0] || '');
  }, [words]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentWord = words[currentWordIndex];

    if (isDeleting) {
      // Deleting character
      timer = setTimeout(() => {
        setCurrentText(currentWord.substring(0, currentText.length - 1));
      }, deletingSpeed);
    } else {
      // Typing character
      timer = setTimeout(() => {
        setCurrentText(currentWord.substring(0, currentText.length + 1));
      }, typingSpeed);
    }

    // Handle full typed word
    if (!isDeleting && currentText === currentWord) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetweenWords);
    }

    // Handle fully deleted word
    if (isDeleting && currentText === '') {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, 0);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', whiteSpace: 'nowrap' }}>
      {/* Ghost text to reserve width dynamically for the longest word */}
      <span
        style={{
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontWeight: 800 }}>{longestWord}</span>
        <span
          style={{
            marginLeft: '2px',
            width: '2px',
            height: '1.2em',
          }}
        />
      </span>

      {/* Absolutely positioned actual animated text */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{currentText}</span>
        <span
          style={{
            marginLeft: '2px',
            width: '2px',
            height: '1.2em',
            backgroundColor: 'var(--accent)',
            animation: 'blink 1s step-end infinite',
          }}
        />
      </span>
      <style jsx global>{`
        @keyframes blink {
          from, to { background-color: transparent }
          50% { background-color: var(--accent) }
        }
      `}</style>
    </span>
  );
}

