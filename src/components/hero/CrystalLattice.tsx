'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

/* ─── Voronoi wireframe sphere ──────────────────────────────────────────────── */

function LatticeSphere({
  accentColor,
  goldColor,
  reducedMotion,
}: {
  accentColor: string;
  goldColor: string;
  reducedMotion: boolean;
}) {
  const meshRef = useRef<THREE.LineSegments>(null);
  const noise3D = useMemo(() => createNoise3D(), []);
  const accentThree = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const goldThree = useMemo(() => new THREE.Color(goldColor), [goldColor]);

  // Generate icosahedron wireframe points (subdivision creates Voronoi-like pattern)
  const { geometry, basePositions, colorArray } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(2.8, 3); // ~320 triangles
    const edges = new THREE.EdgesGeometry(ico);
    const positions = edges.attributes.position.array as Float32Array;
    const base = new Float32Array(positions.length);
    base.set(positions);

    // Initialize colors
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
      colors[i] = accentThree.r;
      colors[i + 1] = accentThree.g;
      colors[i + 2] = accentThree.b;
    }
    edges.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: edges, basePositions: base, colorArray: colors };
  }, [accentThree]);

  // Activation wave state
  const waveRef = useRef({ time: 0, seed: Math.random() * 100 });

  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return;
    const time = state.clock.elapsedTime;
    const positions = geometry.attributes.position.array as Float32Array;

    // Morph vertices with noise
    for (let i = 0; i < basePositions.length; i += 3) {
      const bx = basePositions[i];
      const by = basePositions[i + 1];
      const bz = basePositions[i + 2];

      const n = noise3D(bx * 0.4 + time * 0.08, by * 0.4, bz * 0.4 + time * 0.05);
      const displacement = 1 + n * 0.12;

      positions[i] = bx * displacement;
      positions[i + 1] = by * displacement;
      positions[i + 2] = bz * displacement;

      // Activation wave: propagate gold flash across surface
      const dist = Math.sqrt(bx * bx + by * by + bz * bz);
      const wavePos = (time * 0.5 + waveRef.current.seed) % 6;
      const waveDist = Math.abs(dist - wavePos);
      const waveIntensity = Math.max(0, 1 - waveDist * 2);

      // Blend between accent and gold based on wave
      const r = accentThree.r + (goldThree.r - accentThree.r) * waveIntensity;
      const g = accentThree.g + (goldThree.g - accentThree.g) * waveIntensity;
      const b = accentThree.b + (goldThree.b - accentThree.b) * waveIntensity;
      colorArray[i] = r;
      colorArray[i + 1] = g;
      colorArray[i + 2] = b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    // Slow rotation
    meshRef.current.rotation.y += delta * 0.06;
    meshRef.current.rotation.x += delta * 0.012;
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry} position={[1.5, 0, 0]}>
      <lineBasicMaterial vertexColors transparent opacity={0.3} />
    </lineSegments>
  );
}

/* ─── Diamond particles ─────────────────────────────────────────────────────── */

function DiamondParticles({ accentColor, count = 20 }: { accentColor: string; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  // Particle state: position, velocity, life
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(3 + Math.random()),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
      ),
      life: Math.random(),
      speed: 0.1 + Math.random() * 0.2,
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.life += delta * p.speed;

      if (p.life > 1) {
        // Respawn at sphere surface
        p.pos.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        ).normalize().multiplyScalar(3);
        p.vel.set(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
        );
        p.life = 0;
      }

      // Drift outward
      p.pos.add(p.vel);
      p.pos.multiplyScalar(1 + delta * 0.05);

      const scale = Math.sin(p.life * Math.PI) * 0.04;
      dummy.position.copy(p.pos);
      dummy.position.x += 1.5; // Match sphere offset
      dummy.scale.setScalar(scale);
      dummy.rotation.y += delta;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ─── Shield prism ──────────────────────────────────────────────────────────── */

function ShieldPrism({
  accentColor,
  goldColor,
}: {
  accentColor: string;
  goldColor: string;
}) {
  const prismRef = useRef<THREE.Mesh>(null);
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!prismRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle bob + rotation
    prismRef.current.position.y = Math.sin(t * 0.8) * 0.15;
    prismRef.current.rotation.y += 0.003;
    prismRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;

    // Lights orbit based on mouse
    if (light1Ref.current) {
      light1Ref.current.position.x = Math.cos(t * 0.3 + pointer.x * 2) * 3;
      light1Ref.current.position.z = Math.sin(t * 0.3 + pointer.y * 2) * 3;
      light1Ref.current.position.y = Math.sin(t * 0.2) * 1.5;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.cos(t * 0.4 + pointer.x) * -2.5;
      light2Ref.current.position.z = Math.sin(t * 0.4 + pointer.y) * 2.5;
      light2Ref.current.position.y = Math.cos(t * 0.3) * 1;
    }
  });

  return (
    <group position={[-1.2, 0, 0.5]}>
      <mesh ref={prismRef}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.05}
          transmission={0.85}
          ior={2.2}
          thickness={1.5}
          transparent
          opacity={0.9}
          envMapIntensity={1}
        />
      </mesh>

      <pointLight ref={light1Ref} color={accentColor} intensity={8} distance={10} />
      <pointLight ref={light2Ref} color={goldColor} intensity={6} distance={10} />
      <ambientLight intensity={0.15} />
    </group>
  );
}

/* ─── Floating hex badges ───────────────────────────────────────────────────── */

function FloatingBadge({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
      <group position={position}>
        {/* Using sprite text for simplicity — badges are rendered via CSS overlay instead */}
        <mesh>
          <planeGeometry args={[0.01, 0.01]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </Float>
  );
}

/* ─── Main 3D scene ─────────────────────────────────────────────────────────── */

interface CrystalLatticeProps {
  scrollProgress: number; // 0 to 1
  reducedMotion: boolean;
}

export default function CrystalLattice({ scrollProgress, reducedMotion }: CrystalLatticeProps) {
  const [accentColor, setAccentColor] = useState('#38bdf8');
  const goldColor = '#FFD208';

  // Read theme accent from CSS
  useEffect(() => {
    const readAccent = () => {
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (computed) setAccentColor(computed);
    };
    readAccent();

    // Re-read on theme change
    const observer = new MutationObserver(readAccent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-design-theme', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Shatter effect: scale explosion factor from scroll
  const shatterScale = 1 + scrollProgress * 3;
  const opacity = Math.max(0, 1 - scrollProgress * 1.5);

  if (reducedMotion || opacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        transition: reducedMotion ? 'none' : undefined,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <group scale={shatterScale > 1.5 ? [shatterScale, shatterScale, shatterScale] : undefined}>
          <LatticeSphere
            accentColor={accentColor}
            goldColor={goldColor}
            reducedMotion={reducedMotion}
          />
          <DiamondParticles accentColor={accentColor} count={25} />
        </group>

        <ShieldPrism accentColor={accentColor} goldColor={goldColor} />

        <FloatingBadge text="0x7a3f" position={[-2.8, 1.2, 0.5]} />
        <FloatingBadge text="ERC-7984" position={[-0.5, -1.5, 1]} />
        <FloatingBadge text="FHE" position={[-2, -0.8, -0.5]} />
      </Canvas>
    </div>
  );
}
