import React, { useRef, useEffect } from 'react';

export const COLOR_PALETTES = [
  {
    id: 'bright-blue',
    name: 'Bright Blue',
    bg: '#040b17',
    primary: [0, 220, 255],     // Bright cyan/blue
    secondary: [56, 189, 248],  // Sky blue
    accent: [14, 116, 144],     // Cyan deep
    glow: 'rgba(0, 220, 255, 0.7)',
    diffusedLight: 'radial-gradient(circle at 50% 50%, rgba(0, 220, 255, 0.16) 0%, rgba(4, 11, 23, 0.98) 75%)',
    audioFreq: 528
  },
  {
    id: 'golden-sunset',
    name: 'Golden Sunset Orange',
    bg: '#1a0902',
    primary: [251, 146, 60],    // Sunset orange
    secondary: [253, 224, 71],  // Warm golden amber
    accent: [234, 88, 12],      // Deep orange
    glow: 'rgba(251, 146, 60, 0.7)',
    diffusedLight: 'radial-gradient(circle at 50% 50%, rgba(251, 146, 60, 0.18) 0%, rgba(26, 9, 2, 0.98) 75%)',
    audioFreq: 432
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple Night',
    bg: '#0b0318',
    primary: [192, 132, 252],   // Electric lavender
    secondary: [232, 121, 249], // Radiant magenta/purple
    accent: [126, 34, 206],     // Deep royal violet
    glow: 'rgba(192, 132, 252, 0.7)',
    diffusedLight: 'radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.18) 0%, rgba(11, 3, 24, 0.98) 75%)',
    audioFreq: 741
  }
];

function lerpColor(c1, c2, factor) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * factor),
    Math.round(c1[1] + (c2[1] - c1[1]) * factor),
    Math.round(c1[2] + (c2[2] - c1[2]) * factor)
  ];
}

const NODE_COUNT = 720;

export default function ParticleDataSphere({
  colorPaletteIndex,
  autoShift = true,
  expansion = 1.0,
  cameraSpeed = 1.0,
  glowIntensity = 1.0,
  networkDensity = 1.0
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0, targetRotX: 0, targetRotY: 0, active: false });
  const nodesRef = useRef([]);

  // Generate 3D Spherical Fibonacci Lattice
  useEffect(() => {
    const list = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      list.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        rayFactor: 0.3 + Math.random() * 0.7,
        pulseSpeed: 1.0 + Math.random() * 2.0,
        pulseOffset: Math.random() * Math.PI * 2,
        dotSize: 1.0 + Math.random() * 2.2,
        hasRay: Math.random() > 0.18,
        hasTipSpark: Math.random() > 0.25,
        alpha: 0.5 + Math.random() * 0.5
      });
    }
    nodesRef.current = list;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;
    let colorProgress = colorPaletteIndex;

    const render = () => {
      time += 0.016 * cameraSpeed;

      const dpr = window.devicePixelRatio || 2;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth Continuous Color Palette Interpolation
      if (autoShift) {
        colorProgress = (colorProgress + 0.0025) % COLOR_PALETTES.length;
      } else {
        colorProgress += (colorPaletteIndex - colorProgress) * 0.05;
      }

      const idxA = Math.floor(colorProgress) % COLOR_PALETTES.length;
      const idxB = (idxA + 1) % COLOR_PALETTES.length;
      const blend = colorProgress - Math.floor(colorProgress);

      const palA = COLOR_PALETTES[idxA];
      const palB = COLOR_PALETTES[idxB];

      const cPrimary = lerpColor(palA.primary, palB.primary, blend);
      const cSecondary = lerpColor(palA.secondary, palB.secondary, blend);
      const cAccent = lerpColor(palA.accent, palB.accent, blend);

      const pRGB = `${cPrimary[0]}, ${cPrimary[1]}, ${cPrimary[2]}`;
      const sRGB = `${cSecondary[0]}, ${cSecondary[1]}, ${cSecondary[2]}`;
      const aRGB = `${cAccent[0]}, ${cAccent[1]}, ${cAccent[2]}`;

      // Smooth Cinematic Camera Motion (continuous slow yaw + harmonic pitch)
      const mouse = mouseRef.current;
      mouse.rotX += (mouse.targetRotX - mouse.rotX) * 0.04;
      mouse.rotY += (mouse.targetRotY - mouse.rotY) * 0.04;

      const cameraYaw = mouse.rotY + time * 0.35;
      const cameraPitch = mouse.rotX + Math.sin(time * 0.5) * 0.18;
      const cameraDolly = 1.0 + Math.sin(time * 0.3) * 0.04; // Subtle cinematic breathing

      const cosY = Math.cos(cameraYaw);
      const sinY = Math.sin(cameraYaw);
      const cosX = Math.cos(cameraPitch);
      const sinX = Math.sin(cameraPitch);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.27 * expansion * cameraDolly;

      // 1. Soft Cinematic Ambient Diffused Lighting Core
      const coreAura = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 1.8
      );
      coreAura.addColorStop(0, `rgba(${pRGB}, ${0.32 * glowIntensity})`);
      coreAura.addColorStop(0.4, `rgba(${aRGB}, ${0.14 * glowIntensity})`);
      coreAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreAura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Transform Nodes in 3D
      const nodes = nodesRef.current;
      const projected = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // 3D Matrix Rotation (Yaw & Pitch)
        const x1 = n.baseX * cosY - n.baseZ * sinY;
        const z1 = n.baseZ * cosY + n.baseX * sinY;
        const y2 = n.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + n.baseY * sinX;
        const x2 = x1;

        // Perspective Projection
        const fov = 900;
        const scale = fov / (fov + z2 * baseRadius);
        const screenX = centerX + x2 * baseRadius * scale;
        const screenY = centerY + y2 * baseRadius * scale;

        // Dynamic Radiating Line Expansion
        const wave = Math.sin(time * 2.0 * n.pulseSpeed + n.pulseOffset) * 0.35 + 0.65;
        const rayLen = 1 + n.rayFactor * 0.75 * expansion * wave;
        const rayScreenX = centerX + x2 * baseRadius * rayLen * scale;
        const rayScreenY = centerY + y2 * baseRadius * rayLen * scale;

        projected.push({
          x: screenX,
          y: screenY,
          z: z2,
          scale,
          rayX: rayScreenX,
          rayY: rayScreenY,
          size: n.dotSize * scale,
          hasRay: n.hasRay,
          hasTipSpark: n.hasTipSpark,
          alpha: n.alpha
        });
      }

      // Sort depth (back-to-front rendering)
      projected.sort((a, b) => a.z - b.z);

      // 2. Radiating Thin Light Lines
      ctx.lineWidth = 0.65;
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        if (!pt.hasRay) continue;

        const depthFade = (pt.z + 1.2) / 2.4;
        const lineAlpha = Math.max(0.06, depthFade * 0.6 * glowIntensity);

        ctx.strokeStyle = `rgba(${pRGB}, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.rayX, pt.rayY);
        ctx.stroke();

        // Tip Sparkle
        if (pt.hasTipSpark) {
          ctx.fillStyle = `rgba(${sRGB}, ${lineAlpha * 1.1})`;
          ctx.beginPath();
          ctx.arc(pt.rayX, pt.rayY, Math.max(0.5, pt.size * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Network Constellation Connections (Adjacent Node Mesh)
      const connectThreshold = 30 * (baseRadius / 150) * networkDensity;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 2) {
        const p1 = projected[i];
        if (p1.z < -0.1) continue; // Skip back half for clean clarity

        for (let j = i + 1; j < Math.min(i + 14, projected.length); j++) {
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectThreshold) {
            const alpha = (1 - dist / connectThreshold) * 0.28 * glowIntensity;
            ctx.strokeStyle = `rgba(${aRGB}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 4. Core Glowing Network Nodes
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        const depth = Math.max(0.12, (pt.z + 1.1) / 2.2);

        ctx.fillStyle = `rgba(${sRGB}, ${depth * pt.alpha * glowIntensity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.7, pt.size * depth), 0, Math.PI * 2);
        ctx.fill();

        // Bloom halo on foreground nodes
        if (pt.z > 0.45) {
          ctx.fillStyle = `rgba(${pRGB}, ${(pt.z - 0.45) * 0.5 * glowIntensity})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Minimalist Digital Orbital Guide Rings
      ctx.save();
      ctx.strokeStyle = `rgba(${pRGB}, ${0.12 * glowIntensity})`;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.52, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${aRGB}, ${0.08 * glowIntensity})`;
      ctx.setLineDash([2, 12]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [colorPaletteIndex, autoShift, expansion, cameraSpeed, glowIntensity, networkDensity]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current.targetRotY = x * 1.6;
    mouseRef.current.targetRotX = -y * 1.6;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetRotX = 0;
    mouseRef.current.targetRotY = 0;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
