'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme, useBackgroundTheme } from '@/app/ClientLayout';

export default function DynamicBackground() {
  const { theme } = useTheme();
  const { backgroundTheme } = useBackgroundTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Canvas only animates for specified canvas effects
    const isCanvasAnim = [
      'matrix', 'particles', 'stars', 'grid',
      'digital-fever', 'dna-helix', 'crypto-snow',
      'binary-wind', 'constellation', 'cyber-pulse'
    ].includes(backgroundTheme);
    
    if (!isCanvasAnim) return;

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

    // --- 1. Matrix Rain Setup (Ultra-Smooth Slow Floating Flow) ---
    const matrixChars = [
      '0', '1', '🔒', '🔓', 'F', 'H', 'E', 'Z', 'A', 'M', 'A', '🔑', 'x', 'y', 'z', '0x',
      'c', 'o', 'n', 'f', 'i', 'd', 'e', 'n', 't', 'i', 'a', 'l', 'v', 'a', 'u', 'l', 't'
    ];
    const matrixColumns = Math.floor(width / 20) + 1;
    const matrixDrops = Array(matrixColumns).fill(0).map(() => {
      return {
        y: Math.random() * -height - 100,
        speed: Math.random() * 0.45 + 0.25, // Extremely slow drift (0.25px to 0.7px per frame)
        chars: Array(Math.floor(Math.random() * 12) + 12).fill(0).map(() => matrixChars[Math.floor(Math.random() * matrixChars.length)]),
        updateTimer: 0,
        updateInterval: Math.random() * 120 + 80 // Interval to mutate characters
      };
    });

    // --- 2. Particles Setup (Blockchain Node Mesh) ---
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
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // --- 3. Starfield Setup ---
    const starCount = 85;
    const maxDepth = 1000;
    const stars: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * maxDepth,
      });
    }

    // --- 4. 3D Retro Grid Setup ---
    let gridOffset = 0;
    const gridSpeed = 0.55;

    // --- 5. Digital Wave Flow (digital-fever) ---
    const waves = [
      { amplitude: 38, frequency: 0.0018, speed: 0.0004, color: 'rgba(255, 210, 8, 0.12)', offset: 0 },
      { amplitude: 25, frequency: 0.0028, speed: -0.0006, color: 'rgba(255, 170, 0, 0.07)', offset: Math.PI / 3 },
      { amplitude: 50, frequency: 0.0012, speed: 0.0003, color: 'rgba(0, 180, 255, 0.06)', offset: Math.PI * 0.7 },
      { amplitude: 18, frequency: 0.004, speed: -0.0008, color: 'rgba(79, 70, 229, 0.08)', offset: Math.PI * 1.2 }
    ];
    let wavePhase = 0;

    // --- 6. DNA Helix (dna-helix) ---
    const helixPoints: Array<{ angle: number; y: number; type: 'left' | 'right' }> = [];
    const pointsCount = 40;
    for (let i = 0; i < pointsCount; i++) {
      helixPoints.push({ angle: (i / pointsCount) * Math.PI * 4, y: (i / pointsCount) * height, type: 'left' });
      helixPoints.push({ angle: (i / pointsCount) * Math.PI * 4 + Math.PI, y: (i / pointsCount) * height, type: 'right' });
    }
    let rotationAngle = 0;

    // --- 7. Crypto Snow (crypto-snow) ---
    const snowSymbols = ['🔒', '🔓', '🔑', 'Z', '0', '1', 'FHE', 'ETH', 'USDT'];
    const snowParticles: Array<{
      x: number;
      y: number;
      symbol: string;
      speed: number;
      size: number;
      spin: number;
      spinSpeed: number;
      opacity: number;
    }> = [];
    for (let i = 0; i < 30; i++) {
      snowParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        symbol: snowSymbols[Math.floor(Math.random() * snowSymbols.length)],
        speed: Math.random() * 0.45 + 0.2,
        size: Math.random() * 6 + 10,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.006,
        opacity: Math.random() * 0.2 + 0.1,
      });
    }

    // --- 8. Binary Wind (binary-wind) ---
    const windRows = Math.floor(height / 28) + 1;
    const windStreams = Array(windRows).fill(0).map(() => {
      return {
        x: Math.random() * -width,
        speed: Math.random() * 0.7 + 0.3,
        chars: Array(14).fill(0).map(() => (Math.random() > 0.5 ? '1' : '0'))
      };
    });

    // --- 9. Concentric Cyber Pulses (cyber-pulse) ---
    const pulses: Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      speed: number;
      alpha: number;
    }> = [];
    for (let i = 0; i < 6; i++) {
      pulses.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 120,
        maxRadius: Math.random() * 180 + 180,
        speed: Math.random() * 0.35 + 0.25,
        alpha: 1,
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

    // Delta Time Render Loop
    let lastTimestamp = 0;
    const render = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // ----------------------------------------------------
      // RENDER: MATRIX CODE RAIN (ULTRA SMOOTH & SLOW)
      // ----------------------------------------------------
      if (backgroundTheme === 'matrix') {
        ctx.fillStyle = theme === 'light' ? 'rgba(244, 244, 245, 0.08)' : 'rgba(6, 6, 8, 0.07)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '12px monospace';

        matrixDrops.forEach((drop, colIndex) => {
          const x = colIndex * 20;
          drop.y += drop.speed;

          // Mutate letters occasionally
          drop.updateTimer += deltaTime;
          if (drop.updateTimer >= drop.updateInterval) {
            drop.chars.shift();
            drop.chars.push(matrixChars[Math.floor(Math.random() * matrixChars.length)]);
            drop.updateTimer = 0;
          }

          // Draw the characters in this drop stream
          for (let i = 0; i < drop.chars.length; i++) {
            const charY = drop.y - (i * 15);
            if (charY < -15 || charY > height + 15) continue;

            const opacity = (1 - (i / drop.chars.length)) * 0.75;
            if (opacity <= 0) continue;

            const isLead = i === 0;
            if (isLead) {
              ctx.fillStyle = theme === 'light' ? '#000000' : '#FFFFFF';
            } else {
              ctx.fillStyle = theme === 'light'
                ? `rgba(255, 170, 0, ${opacity * 0.65})`
                : `rgba(255, 210, 8, ${opacity * 0.75})`;
            }

            ctx.fillText(drop.chars[i], x, charY);
          }

          // Recycle drop to top
          if (drop.y - (drop.chars.length * 15) > height) {
            drop.y = Math.random() * -120 - 50;
            drop.speed = Math.random() * 0.45 + 0.25;
          }
        });
      }
      // ----------------------------------------------------
      // RENDER: BLOCKCHAIN NODE MESH
      // ----------------------------------------------------
      else if (backgroundTheme === 'particles') {
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          if (mouse.x > 0) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = theme === 'light'
                ? `rgba(255, 130, 0, ${(1 - dist / 150) * 0.28})`
                : `rgba(255, 210, 8, ${(1 - dist / 150) * 0.35})`;
              ctx.lineWidth = 1.0;
              ctx.stroke();
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'light'
            ? `rgba(255, 120, 0, ${p.alpha * 0.8})`
            : `rgba(255, 210, 8, ${p.alpha * 0.9})`;
          ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const pi = particles[i];
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.strokeStyle = theme === 'light'
                ? `rgba(0, 0, 0, ${(1 - dist / 120) * 0.12})`
                : `rgba(255, 210, 8, ${(1 - dist / 120) * 0.25})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }
      // ----------------------------------------------------
      // RENDER: STARFIELD WARP
      // ----------------------------------------------------
      else if (backgroundTheme === 'stars') {
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const fov = 350;

        stars.forEach((star) => {
          star.z -= 0.65;

          if (star.z <= 0) {
            star.z = maxDepth;
            star.x = (Math.random() - 0.5) * width * 1.5;
            star.y = (Math.random() - 0.5) * height * 1.5;
          }

          const px = cx + (star.x / star.z) * fov;
          const py = cy + (star.y / star.z) * fov;

          if (px < 0 || px > width || py < 0 || py > height) {
            star.z = maxDepth;
            star.x = (Math.random() - 0.5) * width * 1.5;
            star.y = (Math.random() - 0.5) * height * 1.5;
          } else {
            const percent = 1 - star.z / maxDepth;
            const size = percent * 2 + 0.3;
            const opacity = percent * 0.75;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = theme === 'light'
              ? `rgba(255, 120, 0, ${opacity})`
              : `rgba(255, 210, 8, ${opacity})`;
            ctx.fill();
          }
        });
      }
      // ----------------------------------------------------
      // RENDER: 3D RETRO WIREFRAME GRID
      // ----------------------------------------------------
      else if (backgroundTheme === 'grid') {
        ctx.clearRect(0, 0, width, height);

        gridOffset += gridSpeed;
        if (gridOffset >= 40) gridOffset = 0;

        const horizon = height / 3;
        const gridColor = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 210, 8, 0.16)';
        const lineCount = 35;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        const centerX = width / 2;
        for (let i = -lineCount; i <= lineCount; i++) {
          const xStart = centerX;
          const yStart = horizon;
          const xEnd = centerX + i * (width / 20);
          const yEnd = height;

          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();
        }

        const totalHorizontalLines = 14;
        for (let i = 0; i < totalHorizontalLines; i++) {
          const val = (i * 40 + gridOffset) / (totalHorizontalLines * 40);
          const ratio = Math.pow(val, 2.5);
          const y = horizon + ratio * (height - horizon);

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(0, horizon);
        ctx.lineTo(width, horizon);
        ctx.strokeStyle = theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 210, 8, 0.4)';
        ctx.stroke();
      }
      // ----------------------------------------------------
      // RENDER: DIGITAL WAVE FLOW (digital-fever)
      // ----------------------------------------------------
      else if (backgroundTheme === 'digital-fever') {
        ctx.clearRect(0, 0, width, height);
        wavePhase += 0.005;

        waves.forEach((w) => {
          ctx.beginPath();
          ctx.strokeStyle = theme === 'light'
            ? w.color.replace('0.12', '0.07').replace('0.07', '0.04').replace('0.06', '0.03').replace('0.08', '0.05')
            : w.color;
          ctx.lineWidth = 1.6;

          for (let x = 0; x < width; x += 6) {
            const y = height / 2 + Math.sin(x * w.frequency + wavePhase * w.speed * 100 + w.offset) * w.amplitude;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
      // ----------------------------------------------------
      // RENDER: DNA/FHE HELIX ROTATION (dna-helix)
      // ----------------------------------------------------
      else if (backgroundTheme === 'dna-helix') {
        ctx.clearRect(0, 0, width, height);
        rotationAngle += 0.005;

        const centerX = width / 2;
        const radius = Math.min(width * 0.16, 190);

        ctx.lineWidth = 0.85;
        for (let i = 0; i < pointsCount; i++) {
          const pointLeft = helixPoints[i * 2];
          const pointRight = helixPoints[i * 2 + 1];

          const xL = centerX + Math.sin(pointLeft.angle + rotationAngle) * radius;
          const xR = centerX + Math.sin(pointRight.angle + rotationAngle) * radius;
          const y = (pointLeft.y + rotationAngle * 10) % height;

          const cosL = Math.cos(pointLeft.angle + rotationAngle);
          const cosR = Math.cos(pointRight.angle + rotationAngle);
          const avgCos = (cosL + cosR) / 2;
          const opacity = (avgCos + 1.2) / 2.2 * (theme === 'light' ? 0.07 : 0.14);

          ctx.beginPath();
          ctx.moveTo(xL, y);
          ctx.lineTo(xR, y);
          ctx.strokeStyle = theme === 'light'
            ? `rgba(0, 0, 0, ${opacity})`
            : `rgba(255, 210, 8, ${opacity})`;
          ctx.stroke();
        }

        for (let i = 0; i < helixPoints.length; i++) {
          const p = helixPoints[i];
          const x = centerX + Math.sin(p.angle + rotationAngle) * radius;
          const y = (p.y + rotationAngle * 10) % height;

          const cos = Math.cos(p.angle + rotationAngle);
          const size = (cos + 1.5) * 1.8 + 0.6;
          const opacity = (cos + 1.2) / 2.2 * (theme === 'light' ? 0.22 : 0.55);

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'light'
            ? (p.type === 'left' ? `rgba(255, 120, 0, ${opacity * 0.75})` : `rgba(0, 150, 255, ${opacity * 0.75})`)
            : (p.type === 'left' ? `rgba(255, 210, 8, ${opacity})` : `rgba(0, 242, 254, ${opacity})`);
          ctx.fill();
        }
      }
      // ----------------------------------------------------
      // RENDER: CRYPTO SNOW (crypto-snow)
      // ----------------------------------------------------
      else if (backgroundTheme === 'crypto-snow') {
        ctx.clearRect(0, 0, width, height);

        snowParticles.forEach((p) => {
          p.y += p.speed;
          p.spin += p.spinSpeed;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.font = `${p.size}px sans-serif`;
          ctx.fillStyle = theme === 'light'
            ? `rgba(0, 0, 0, ${p.opacity * 0.6})`
            : `rgba(255, 210, 8, ${p.opacity})`;
          ctx.fillText(p.symbol, 0, 0);
          ctx.restore();
        });
      }
      // ----------------------------------------------------
      // RENDER: HORIZONTAL BINARY WIND (binary-wind)
      // ----------------------------------------------------
      else if (backgroundTheme === 'binary-wind') {
        ctx.clearRect(0, 0, width, height);
        ctx.font = '10px monospace';

        windStreams.forEach((stream, rowIndex) => {
          stream.x += stream.speed;
          const y = rowIndex * 28;

          for (let i = 0; i < stream.chars.length; i++) {
            const charX = stream.x - (i * 12);
            if (charX < -15 || charX > width + 15) continue;

            const opacity = (1 - (i / stream.chars.length)) * (theme === 'light' ? 0.12 : 0.25);
            ctx.fillStyle = theme === 'light'
              ? `rgba(0, 0, 0, ${opacity})`
              : `rgba(255, 210, 8, ${opacity})`;
            ctx.fillText(stream.chars[i], charX, y);
          }

          if (stream.x - (stream.chars.length * 12) > width) {
            stream.x = Math.random() * -120 - 80;
            stream.speed = Math.random() * 0.75 + 0.25;
          }
        });
      }
      // ----------------------------------------------------
      // RENDER: MOUSE CONSTELLATIONS (constellation)
      // ----------------------------------------------------
      else if (backgroundTheme === 'constellation') {
        ctx.clearRect(0, 0, width, height);

        particles.forEach((p) => {
          p.x += p.vx * 0.75;
          p.y += p.vy * 0.75;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'light'
            ? `rgba(0, 0, 0, ${p.alpha * 0.22})`
            : `rgba(255, 255, 255, ${p.alpha * 0.38})`;
          ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const pi = particles[i];
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 135) {
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.strokeStyle = theme === 'light'
                ? `rgba(0, 0, 0, ${(1 - dist / 135) * 0.05})`
                : `rgba(255, 255, 255, ${(1 - dist / 135) * 0.08})`;
              ctx.lineWidth = 0.55;
              ctx.stroke();
            }
          }

          if (mouse.x > 0) {
            const p = particles[i];
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = theme === 'light'
                ? `rgba(255, 170, 0, ${(1 - dist / 180) * 0.16})`
                : `rgba(255, 210, 8, ${(1 - dist / 180) * 0.24})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
          }
        }
      }
      // ----------------------------------------------------
      // RENDER: CONCENTRIC CYBER PULSES (cyber-pulse)
      // ----------------------------------------------------
      else if (backgroundTheme === 'cyber-pulse') {
        ctx.clearRect(0, 0, width, height);

        pulses.forEach((p) => {
          p.radius += p.speed;
          p.alpha = 1 - (p.radius / p.maxRadius);

          if (p.radius >= p.maxRadius) {
            p.radius = 0;
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.maxRadius = Math.random() * 150 + 150;
            p.speed = Math.random() * 0.35 + 0.2;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = theme === 'light'
            ? `rgba(255, 120, 0, ${p.alpha * 0.11})`
            : `rgba(255, 210, 8, ${p.alpha * 0.16})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = theme === 'light'
            ? `rgba(255, 120, 0, ${p.alpha * 0.22})`
            : `rgba(255, 210, 8, ${p.alpha * 0.32})`;
          ctx.fill();
        });
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [backgroundTheme, theme]);

  // Determine aura colors dynamically
  const getAuroraBlobs = () => {
    switch (backgroundTheme) {
      case 'sunset':
        return {
          b1: theme === 'light' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.12)', // Sunset Pink
          b2: theme === 'light' ? 'rgba(249, 115, 22, 0.06)' : 'rgba(249, 115, 22, 0.08)', // Sunset Orange
          b3: theme === 'light' ? 'rgba(124, 58, 237, 0.06)' : 'rgba(124, 58, 237, 0.09)'  // Sunset Violet
        };
      case 'forest':
        return {
          b1: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)', // Emerald Green
          b2: theme === 'light' ? 'rgba(20, 184, 166, 0.06)' : 'rgba(20, 184, 166, 0.08)', // Mint Teal
          b3: theme === 'light' ? 'rgba(5, 150, 105, 0.06)' : 'rgba(5, 150, 105, 0.08)'  // Spruce Teal
        };
      case 'glacier':
        return {
          b1: theme === 'light' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.12)', // Ice Blue
          b2: theme === 'light' ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.08)', // Glacier Blue
          b3: theme === 'light' ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 92, 246, 0.09)'  // Frost Violet
        };
      case 'matrix-neon':
        return {
          b1: theme === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.13)', // Neon Green
          b2: theme === 'light' ? 'rgba(139, 92, 246, 0.07)' : 'rgba(139, 92, 246, 0.10)', // Purple
          b3: theme === 'light' ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.08)'   // Cyan
        };
      case 'lavender':
        return {
          b1: theme === 'light' ? 'rgba(167, 139, 250, 0.09)' : 'rgba(167, 139, 250, 0.13)', // Soft Lavender
          b2: theme === 'light' ? 'rgba(196, 181, 253, 0.06)' : 'rgba(196, 181, 253, 0.09)', // Wisteria
          b3: theme === 'light' ? 'rgba(129, 140, 248, 0.06)' : 'rgba(129, 140, 248, 0.08)'  // Indigo Soft
        };
      case 'cyber-abyss':
        return {
          b1: theme === 'light' ? 'rgba(30, 41, 59, 0.05)' : 'rgba(15, 23, 42, 0.15)', // Very Dark Slate
          b2: theme === 'light' ? 'rgba(255, 210, 8, 0.02)' : 'rgba(255, 210, 8, 0.04)', // Golden highlight
          b3: theme === 'light' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(2, 6, 23, 0.20)'      // Deep Obsidian
        };
      case 'rose-gold':
        return {
          b1: theme === 'light' ? 'rgba(251, 191, 36, 0.06)' : 'rgba(251, 191, 36, 0.08)', // Gold
          b2: theme === 'light' ? 'rgba(244, 143, 177, 0.07)' : 'rgba(244, 143, 177, 0.11)', // Rose
          b3: theme === 'light' ? 'rgba(254, 219, 204, 0.06)' : 'rgba(254, 219, 204, 0.08)'  // Champagne
        };
      case 'solar-flare':
        return {
          b1: theme === 'light' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)', // Solar Orange
          b2: theme === 'light' ? 'rgba(252, 211, 77, 0.06)' : 'rgba(252, 211, 77, 0.09)', // Yellow
          b3: theme === 'light' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.08)'   // Flare Red
        };
      case 'cherry-blossom':
        return {
          b1: theme === 'light' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.12)', // Blossom Rose
          b2: theme === 'light' ? 'rgba(251, 207, 232, 0.06)' : 'rgba(251, 207, 232, 0.08)', // Pale Pink
          b3: theme === 'light' ? 'rgba(225, 29, 72, 0.05)' : 'rgba(225, 29, 72, 0.08)'   // Deep Cherry
        };
      case 'deep-space':
        return {
          b1: theme === 'light' ? 'rgba(30, 64, 175, 0.07)' : 'rgba(30, 64, 175, 0.12)', // Space Cobalt
          b2: theme === 'light' ? 'rgba(124, 58, 237, 0.06)' : 'rgba(124, 58, 237, 0.09)', // Nebula Purple
          b3: theme === 'light' ? 'rgba(88, 28, 135, 0.05)' : 'rgba(88, 28, 135, 0.08)'   // Deep Void
        };
      case 'zama-laser':
        return {
          b1: theme === 'light' ? 'rgba(255, 210, 8, 0.10)' : 'rgba(255, 210, 8, 0.14)', // Zama Gold Laser
          b2: theme === 'light' ? 'rgba(255, 170, 0, 0.06)' : 'rgba(255, 170, 0, 0.09)', // Amber Pulse
          b3: theme === 'light' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)' // White Light
        };
      case 'aurora':
      default:
        return {
          b1: theme === 'light' ? 'rgba(255, 170, 0, 0.09)' : 'rgba(255, 210, 8, 0.12)', // Zama Gold/Yellow
          b2: theme === 'light' ? 'rgba(0, 180, 255, 0.08)' : 'rgba(0, 242, 254, 0.08)', // Cyberspace Cyan
          b3: theme === 'light' ? 'rgba(79, 70, 229, 0.07)' : 'rgba(79, 70, 229, 0.09)'  // Secure Indigo
        };
    }
  };

  const isAura = [
    'aurora', 'sunset', 'forest', 'glacier',
    'matrix-neon', 'lavender', 'cyber-abyss', 'rose-gold',
    'solar-flare', 'cherry-blossom', 'deep-space', 'zama-laser'
  ].includes(backgroundTheme);

  const isImage = [
    'cyber-vault', 'crypto-mesh', 'fhe-matrix',
    'fhe-secure-shield', 'quantum-encryption', 'confidential-vault',
    'zero-knowledge-proof', 'digital-sanctuary', 'cyberpunk-zama',
    'fhe-key-generation', 'decrypted-reality', 'secure-blockchain'
  ].includes(backgroundTheme);

  const isCanvas = [
    'matrix', 'particles', 'stars', 'grid',
    'digital-fever', 'dna-helix', 'crypto-snow',
    'binary-wind', 'constellation', 'cyber-pulse'
  ].includes(backgroundTheme);

  const blobs = getAuroraBlobs();

  return (
    <>
      {/* 1. Canvas for Code & Grid Effects */}
      {isCanvas && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: backgroundTheme === 'matrix' ? (theme === 'light' ? 0.38 : 0.28) : (theme === 'light' ? 0.65 : 0.55),
          }}
        />
      )}

      {/* 2. Aurora/Nebula CSS Floating Gradient Blobs */}
      {isAura && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* Blob 1 */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '18%',
              width: '42vw',
              height: '42vw',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${blobs.b1} 0%, transparent 70%)`,
              filter: 'blur(90px)',
              animation: 'aurora-float 28s infinite alternate ease-in-out',
            }}
          />
          {/* Blob 2 */}
          <div
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '12%',
              width: '48vw',
              height: '48vw',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${blobs.b2} 0%, transparent 70%)`,
              filter: 'blur(100px)',
              animation: 'aurora-float-reverse 34s infinite alternate ease-in-out',
            }}
          />
          {/* Blob 3 */}
          <div
            style={{
              position: 'absolute',
              top: '45%',
              right: '25%',
              width: '38vw',
              height: '38vw',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${blobs.b3} 0%, transparent 70%)`,
              filter: 'blur(90px)',
              animation: 'aurora-float 32s infinite alternate-reverse ease-in-out',
            }}
          />
        </div>
      )}

      {/* 3. Textured Images (generated assets) */}
      {isImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: `url('/backgrounds/${
              backgroundTheme === 'cyber-vault' ? 'cyber_vault' :
              backgroundTheme === 'crypto-mesh' ? 'crypto_mesh' :
              backgroundTheme === 'fhe-matrix' ? 'fhe_matrix' :
              backgroundTheme
            }.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: theme === 'light' ? 0.06 : 0.09,
            mixBlendMode: theme === 'light' ? 'multiply' : 'screen',
            transition: 'background-image 0.5s ease, opacity 0.5s ease',
          }}
        />
      )}
    </>
  );
}
