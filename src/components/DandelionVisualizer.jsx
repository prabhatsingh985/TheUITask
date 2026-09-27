import React, { useRef, useEffect } from 'react';

const NUM_RAYS = 460;

export default function DandelionVisualizer({ currentTheme, isExpandingTransition }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const raysRef = useRef([]);

  // Generate dandelion radial filaments
  useEffect(() => {
    const list = [];
    for (let i = 0; i < NUM_RAYS; i++) {
      const angle = (i / NUM_RAYS) * Math.PI * 2 + (Math.random() - 0.5) * 0.04;
      const lengthVariance = 0.58 + Math.random() * 0.42;
      const pulseSpeed = 1.0 + Math.random() * 1.5;
      const pulseOffset = Math.random() * Math.PI * 2;
      const dotSize = 0.9 + Math.random() * 1.8;
      const hasSecondary = Math.random() > 0.85;

      list.push({
        angle,
        lengthVariance,
        pulseSpeed,
        pulseOffset,
        dotSize,
        hasSecondary
      });
    }
    raysRef.current = list;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;
    let transitionWave = 0;

    const render = () => {
      time += 0.016;

      if (isExpandingTransition) {
        transitionWave = Math.min(1.0, transitionWave + 0.06);
      } else {
        transitionWave = Math.max(0.0, transitionWave - 0.025);
      }

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

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.35;

      // Continuous subtle calm breathing
      const breath = Math.sin(time * 1.0) * 10 + (transitionWave * 30);
      const coreBreath = Math.sin(time * 1.0) * 6;

      // 1. Soft Core Gradient Light (expands and recedes during transitions)
      const glowRadius = (baseRadius * 0.7) + coreBreath + (transitionWave * 35);
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 4,
        centerX, centerY, glowRadius
      );
      coreGrad.addColorStop(0, currentTheme.coreGlow);
      coreGrad.addColorStop(0.55, currentTheme.coreAura);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Render Thin Radial Filaments & Luminous Dots
      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Subtle gentle oscillation
        const rayPulse = Math.sin(time * ray.pulseSpeed + ray.pulseOffset) * 5;
        const len = (ray.lengthVariance * baseRadius) + breath + rayPulse;

        // Micro-sway
        const sway = Math.sin(time * 0.7 + ray.pulseOffset) * 0.015;
        const angle = ray.angle + sway;

        const tipX = centerX + Math.cos(angle) * len;
        const tipY = centerY + Math.sin(angle) * len;

        // Subtle curve
        const midRatio = 0.52;
        const midX = centerX + Math.cos(angle + sway * 0.5) * (len * midRatio);
        const midY = centerY + Math.sin(angle + sway * 0.5) * (len * midRatio);

        // Thin radial line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.strokeStyle = currentTheme.rayLine;
        ctx.lineWidth = 0.65;
        ctx.stroke();

        // Tip luminous dot
        ctx.beginPath();
        ctx.arc(tipX, tipY, ray.dotSize, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.rayTipDot;
        ctx.fill();

        // Secondary dot
        if (ray.hasSecondary) {
          const sX = centerX + Math.cos(angle) * (len * 0.6);
          const sY = centerY + Math.sin(angle) * (len * 0.6);
          ctx.beginPath();
          ctx.arc(sX, sY, 0.85, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.rayTipDot;
          ctx.fill();
        }
      }

      // 3. Small Dense Center Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = currentTheme.rayTipDot;
      ctx.fill();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTheme, isExpandingTransition]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
