'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme, useBackgroundTheme } from '@/app/ClientLayout';

export default function DynamicBackground() {
  const { theme } = useTheme();
  const { backgroundTheme } = useBackgroundTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If backgroundTheme is none/aurora, or the theme is light, we don't run canvas animation
    if (backgroundTheme === 'none' || backgroundTheme === 'aurora' || theme === 'light') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // --- Matrix Rain Setup ---
    const columns = Math.floor(width / 22) + 1;
    const yPositions = Array(columns).fill(0).map(() => Math.random() * -100);
    const matrixChars = [
      '0', '1', '🔒', '🔓', 'F', 'H', 'E', 'Z', 'A', 'M', 'A', '🔑', 'x', 'y', 'z', '0x',
      'c', 'o', 'n', 'f', 'i', 'd', 'e', 'n', 't', 'i', 'a', 'l', 'v', 'a', 'u', 'l', 't'
    ];

    // --- Particles Setup ---
    const particleCount = 40;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // Interactive mouse positioning
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Render loop
    const render = () => {
      if (backgroundTheme === 'matrix') {
        // Draw semi-transparent black overlay for smooth trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '12px monospace';

        for (let i = 0; i < yPositions.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * 22;
          const y = yPositions[i];

          const isBright = Math.random() > 0.96;
          // Zama Brand style yellow: #FFD208
          ctx.fillStyle = isBright ? '#FFFFFF' : 'rgba(255, 210, 8, 0.65)';
          
          ctx.fillText(char, x, y);

          if (y > 100 + Math.random() * 12000) {
            yPositions[i] = 0;
          } else {
            yPositions[i] += 12;
          }
        }
      } else if (backgroundTheme === 'particles') {
        ctx.clearRect(0, 0, width, height);

        // Update & Draw particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          // Boundaries
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          // Connect to mouse if near
          if (mouse.x > 0) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(255, 210, 8, ${(1 - dist / 130) * 0.14})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }

          // Draw node dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 210, 8, ${p.alpha * 0.75})`;
          ctx.fill();
        });

        // Draw connections between nodes
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const pi = particles[i];
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.strokeStyle = `rgba(255, 210, 8, ${(1 - dist / 110) * 0.15})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [backgroundTheme, theme]);

  if (theme === 'light') return null;

  return (
    <>
      {/* Canvas for Matrix & Particles */}
      {(backgroundTheme === 'matrix' || backgroundTheme === 'particles') && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: backgroundTheme === 'matrix' ? 0.12 : 0.35,
          }}
        />
      )}

      {/* Aurora floating CSS gradient blobs */}
      {backgroundTheme === 'aurora' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
            background: 'var(--bg-base)',
          }}
        >
          {/* Yellow Blob */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '18%',
              width: '42vw',
              height: '42vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 210, 8, 0.055) 0%, transparent 70%)',
              filter: 'blur(90px)',
              animation: 'aurora-float 28s infinite alternate ease-in-out',
            }}
          />
          {/* Blue/Teal Blob */}
          <div
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '12%',
              width: '48vw',
              height: '48vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.035) 0%, transparent 70%)',
              filter: 'blur(100px)',
              animation: 'aurora-float-reverse 34s infinite alternate ease-in-out',
            }}
          />
          {/* Indigo/Spruce Blob */}
          <div
            style={{
              position: 'absolute',
              top: '45%',
              right: '25%',
              width: '38vw',
              height: '38vw',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.038) 0%, transparent 70%)',
              filter: 'blur(90px)',
              animation: 'aurora-float 32s infinite alternate-reverse ease-in-out',
            }}
          />
        </div>
      )}
    </>
  );
}
