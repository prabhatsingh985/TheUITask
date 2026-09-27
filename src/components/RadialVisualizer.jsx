import React, { useRef, useEffect, useState } from 'react';
import { soundEngine } from '../utils/audio';

const RAY_COUNT = 380;

export default function RadialVisualizer({ currentTheme }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const raysRef = useRef([]);
  const animFrameRef = useRef(null);
  const lastSoundSectorRef = useRef(-1);

  // Initialize rays once with organic variation
  useEffect(() => {
    const list = [];
    for (let i = 0; i < RAY_COUNT; i++) {
      // Angle across 10° to 170° (in radians: 0.18 to 2.96, or 180° - theta for upward projection)
      const t = i / (RAY_COUNT - 1);
      // Fan angle from roughly 175 degrees to 5 degrees (pointing upwards)
      const baseAngle = Math.PI - (0.12 + t * (Math.PI - 0.24));

      // Organic variation: dandelion / corona profile
      // Higher density & length variation
      const lengthVariance = 0.55 + Math.random() * 0.45;
      const noise = Math.sin(t * 12) * 0.15 + Math.cos(t * 26) * 0.08;
      const baseLength = (0.55 + noise + lengthVariance * 0.45);

      list.push({
        baseAngle,
        currentAngle: baseAngle,
        baseLengthFactor: baseLength,
        currentLength: 0,
        targetLength: 0,
        waveOffset: Math.random() * Math.PI * 2,
        waveSpeed: 0.015 + Math.random() * 0.02,
        dotSize: 1.2 + Math.random() * 2.2,
        hasDot: Math.random() > 0.18, // 82% of rays have a glowing tip node
        intermediateDot: Math.random() > 0.85 ? 0.4 + Math.random() * 0.4 : null,
        intensity: 0.6 + Math.random() * 0.4
      });
    }
    raysRef.current = list;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;

    const render = () => {
      time += 0.02;

      // Handle high-DPI crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Center Origin anchored at the bottom
      const originX = width / 2;
      const originY = height + 10; // Slightly below bottom line

      // Dynamic max radius based on canvas size
      const maxRadius = Math.min(width * 0.72, height * 0.95);

      // 1. Draw Central Warm Radial Glow (Peach / Coral / Orange dome from screenshot)
      const glowRadius = maxRadius * 0.75;
      const glowGrad = ctx.createRadialGradient(
        originX, originY, 10,
        originX, originY, glowRadius
      );
      glowGrad.addColorStop(0, currentTheme.coreGlowInner);
      glowGrad.addColorStop(0.35, currentTheme.coreGlow);
      glowGrad.addColorStop(0.7, currentTheme.coreGlow.replace(/[\d.]+\)$/, '0.15)'));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(originX, originY, glowRadius, Math.PI, 0, false);
      ctx.fill();

      // 2. Secondary soft ambient backlight aura
      const auraGrad = ctx.createRadialGradient(
        originX, originY - 40, 20,
        originX, originY - 40, maxRadius * 0.95
      );
      auraGrad.addColorStop(0, currentTheme.coreGlow.replace(/[\d.]+\)$/, '0.22)'));
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(originX, originY - 40, maxRadius * 0.95, Math.PI, 0, false);
      ctx.fill();

      // Mouse coordinates relative to canvas
      const mouse = mouseRef.current;
      const isMouseActive = mouse.active;

      // 3. Render each fine radiating fiber ray
      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Ambient undulating breathing motion
        const sway = Math.sin(time * ray.waveSpeed * 10 + ray.waveOffset) * 0.012;
        let angle = ray.baseAngle + sway;

        // Base ray length with subtle breathing pulse
        const pulse = Math.sin(time * 1.5 + ray.waveOffset) * 8;
        let len = (ray.baseLengthFactor * maxRadius) + pulse;

        // Interactive deflection and glow from cursor hover
        let hoverFactor = 0;
        if (isMouseActive) {
          // Tip position before deflection
          const nominalTipX = originX + Math.cos(angle) * len;
          const nominalTipY = originY - Math.sin(angle) * len;

          const dx = mouse.x - nominalTipX;
          const dy = mouse.y - nominalTipY;
          const distToCursor = Math.sqrt(dx * dx + dy * dy);

          const hoverRadius = 140;
          if (distToCursor < hoverRadius) {
            hoverFactor = Math.pow(1 - distToCursor / hoverRadius, 1.8);
            
            // Subtle magnetic pull toward mouse
            const angleToMouse = Math.atan2(originY - mouse.y, mouse.x - originX);
            const angleDiff = angleToMouse - angle;
            angle += angleDiff * hoverFactor * 0.12;

            // Length expands slightly when cursor approaches
            len += hoverFactor * 25;
          }
        }

        // Calculate final ray endpoint
        const tipX = originX + Math.cos(angle) * len;
        const tipY = originY - Math.sin(angle) * len;

        // Intermediate point for slight organic curve
        const midRatio = 0.55;
        const midX = originX + Math.cos(angle + sway * 0.5) * (len * midRatio);
        const midY = originY - Math.sin(angle + sway * 0.5) * (len * midRatio);

        // Draw Ray Line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);

        // Ray stroke style: gradient from core to tip
        if (hoverFactor > 0.05) {
          ctx.strokeStyle = currentTheme.activeGlow || '#ffffff';
          ctx.lineWidth = 0.8 + hoverFactor * 1.6;
          ctx.shadowColor = currentTheme.activeGlow;
          ctx.shadowBlur = hoverFactor * 14;
        } else {
          ctx.strokeStyle = currentTheme.rayTip;
          ctx.lineWidth = 0.55 * ray.intensity;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();

        // Draw Tip Dot Node (from screenshot)
        if (ray.hasDot) {
          const dotRadius = hoverFactor > 0.05 
            ? ray.dotSize * (1 + hoverFactor * 1.5) 
            : ray.dotSize;

          ctx.beginPath();
          ctx.arc(tipX, tipY, Math.max(0.8, dotRadius), 0, Math.PI * 2);
          
          if (hoverFactor > 0.05) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = currentTheme.activeGlow;
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = currentTheme.tipDot;
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }

        // Draw intermediate node if present
        if (ray.intermediateDot) {
          const imX = originX + Math.cos(angle) * (len * ray.intermediateDot);
          const imY = originY - Math.sin(angle) * (len * ray.intermediateDot);
          ctx.beginPath();
          ctx.arc(imX, imY, 1.1, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.tipDot;
          ctx.fill();
        }
      }

      // 4. Subtle Cursor Glow when hovering
      if (isMouseActive) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 45
        );
        mouseGlow.addColorStop(0, currentTheme.activeGlow ? `${currentTheme.activeGlow}55` : 'rgba(255,255,255,0.4)');
        mouseGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTheme]);

  // Mouse event handlers
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y, active: true };

    // Harmonic Audio feedback when sweeping cursor across the rays
    const sector = Math.floor((x / rect.width) * 16);
    if (sector !== lastSoundSectorRef.current) {
      lastSoundSectorRef.current = sector;
      const freq = (currentTheme.audioFreq || 432) * (0.8 + (sector / 16) * 0.5);
      soundEngine.playRadialHoverBlip(freq);
    }
  };

  const handleMouseEnter = () => {
    mouseRef.current.active = true;
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
    lastSoundSectorRef.current = -1;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full flex-1 flex flex-col justify-end items-center overflow-hidden cursor-crosshair select-none"
      style={{ minHeight: '380px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        id="radial-fiber-canvas"
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
