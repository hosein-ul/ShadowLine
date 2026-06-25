'use client';

import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

/**
 * Scroll-driven generative background — simplex noise rendered to a 2D canvas.
 *
 * Hue and density shift based on document scroll progress so that the
 * background visually evolves through the page narrative:
 *   0–25%  : warm cream + faint gold haze
 *   25–50% : cream with denser gold particles
 *   50–75% : bone + deep-gold pulses (encryption beat)
 *   75–100%: drifts to aubergine before the dark final beat
 *
 * Pure Canvas2D — no R3F required, lower runtime cost than a shader.
 * Respects prefers-reduced-motion (renders one static frame, no animation).
 */
export function NoiseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const noise = createNoise2D();
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    // Palette stops, sampled per-progress
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }
    function rgbAt(progress: number) {
      // Cream → cream + warmer gold → bone with deep gold → aubergine drift
      if (progress < 0.33) {
        const t = progress / 0.33;
        return {
          r: lerp(250, 248, t),
          g: lerp(247, 240, t),
          b: lerp(241, 210, t),
        };
      } else if (progress < 0.66) {
        const t = (progress - 0.33) / 0.33;
        return {
          r: lerp(248, 242, t),
          g: lerp(240, 230, t),
          b: lerp(210, 190, t),
        };
      } else {
        const t = (progress - 0.66) / 0.34;
        return {
          r: lerp(242, 230, t),
          g: lerp(230, 215, t),
          b: lerp(190, 175, t),
        };
      }
    }

    let scrollProgress = 0;
    function updateScroll() {
      const h = document.documentElement;
      scrollProgress = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    }
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });

    let time = 0;
    function render() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const base = rgbAt(scrollProgress);

      // Base wash
      ctx!.fillStyle = `rgb(${base.r}, ${base.g}, ${base.b})`;
      ctx!.fillRect(0, 0, w, h);

      // Gold dots driven by noise — density grows with scroll progress
      const density = 12 + scrollProgress * 32; // 12 → 44
      const step = Math.max(40, 120 - scrollProgress * 60); // larger step at top = fewer dots
      const goldIntensity = 0.04 + scrollProgress * 0.18;   // 0.04 → 0.22

      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const n = noise((x + time) / 320, (y + time * 0.7) / 320);
          const r = (n + 1) * density;
          const alpha = goldIntensity * (0.5 + (n + 1) * 0.25);
          ctx!.fillStyle = `rgba(255, 210, 8, ${alpha.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.arc(x + n * 30, y + n * 20, r * 0.04 + 0.6, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      time += prefersReduced ? 0 : 0.15;
      rafRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
