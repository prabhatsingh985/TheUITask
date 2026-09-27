import React, { useRef, useEffect } from 'react';

function extractRgb(colorStr) {
  if (!colorStr) return '37, 99, 235';
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) return `${match[1]}, ${match[2]}, ${match[3]}`;
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 6) {
      return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`;
    }
  }
  return '37, 99, 235';
}

// Deterministic pseudo-random number generator (Mulberry32)
function createSeededRandom(seed = 985721) {
  let s = seed;
  return function() {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Option 1: 3D Dandelion Globe Spin (Full 360° Celestial Dome Rotation)
function generate3DGlobeRays() {
  const rand = createSeededRandom(985721);
  const list = [];
  const TOTAL_RAYS = 620;

  for (let i = 0; i < TOTAL_RAYS; i++) {
    // Distribute evenly in a 3D hemisphere dome
    const phi0 = rand() * Math.PI * 2; // 0 to 360° azimuth around vertical axis
    // Polar angle theta from zenith (0) down towards horizon (PI/2)
    const theta = Math.acos(1 - rand() * 0.94); 

    // Multi-tier radial distribution
    let lengthVariance;
    let tier;
    const tierRoll = rand();
    if (tierRoll < 0.55) {
      // Outer canopy
      lengthVariance = 0.52 + rand() * 0.48;
      tier = 'outer';
    } else if (tierRoll < 0.80) {
      // Mid layer
      lengthVariance = 0.28 + rand() * 0.26;
      tier = 'mid';
    } else {
      // Core filling the inner space
      lengthVariance = 0.10 + rand() * 0.20;
      tier = 'core';
    }

    const waveSpeed = 0.5 + rand() * 1.0;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = tier === 'core' ? 0.75 + rand() * 1.0 : (tier === 'mid' ? 0.95 + rand() * 1.3 : 1.1 + rand() * 2.1);
    const stemFraction = 0.72 + rand() * 0.20;

    list.push({
      phi0,
      theta,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      tier
    });
  }

  return list;
}

const STATIC_RAYS = generate3DGlobeRays();

export default function VideoDandelionVisualizer({ currentTheme }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false, lastX: null });
  const spinAngleRef = useRef(0);
  const spinSpeedRef = useRef(0.0035);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;

    const render = () => {
      time += 0.016;

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

      // Anchored at bottom center
      const originX = width / 2;
      const originY = height + 10;
      const maxRadius = Math.min(width * 0.75, height * 0.92);

      // Mouse interactive spin nudge
      const mouse = mouseRef.current;
      if (mouse.active && mouse.lastX !== null) {
        const deltaX = mouse.x - mouse.lastX;
        spinSpeedRef.current += deltaX * 0.00012;
      }
      mouse.lastX = mouse.active ? mouse.x : null;

      // Friction to return to steady ambient 360° spin
      spinSpeedRef.current += (0.0035 - spinSpeedRef.current) * 0.03;
      spinAngleRef.current += spinSpeedRef.current;
      const currentSpin = spinAngleRef.current;

      const rgb = extractRgb(currentTheme.rayLine);
      const FOV = 750;

      // Calculate 3D projected coordinates for all rays
      const projectedList = [];
      for (let i = 0; i < STATIC_RAYS.length; i++) {
        const ray = STATIC_RAYS[i];

        // Breathing motion
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 5;
        const totalLen = ray.lengthVariance * maxRadius + breath;

        // Continuous 360° rotation around Y axis
        const phi = ray.phi0 + currentSpin;
        const sinTheta = Math.sin(ray.theta);
        const cosTheta = Math.cos(ray.theta);

        // 3D coordinates (Y is upward, X is horizontal, Z is depth towards camera)
        const x3d = totalLen * sinTheta * Math.sin(phi);
        const y3d = totalLen * cosTheta;
        const z3d = totalLen * sinTheta * Math.cos(phi);

        // Perspective scale
        const scale = FOV / (FOV - z3d);
        const tipX = originX + x3d * scale;
        const tipY = originY - y3d * scale;

        // Stem starting point in 3D
        const uStart = Math.max(0.04, 1.0 - ray.stemFraction);
        const startScale = FOV / (FOV - (z3d * uStart));
        const startX = originX + (x3d * uStart) * startScale;
        const startY = originY - (y3d * uStart) * startScale;

        // Mid curve control point
        const uMid = (uStart + 1.0) / 2;
        const midScale = FOV / (FOV - (z3d * uMid));
        const mx = originX + (x3d * uMid) * midScale;
        const my = originY - (y3d * uMid) * midScale;
        const ctrlX = 2 * mx - 0.5 * (startX + tipX);
        const ctrlY = 2 * my - 0.5 * (startY + tipY);

        projectedList.push({
          startX,
          startY,
          ctrlX,
          ctrlY,
          tipX,
          tipY,
          z3d,
          scale,
          dotSize: ray.dotSize * scale,
          tier: ray.tier
        });
      }

      // Depth sort: back to front (smaller z3d to larger z3d)
      projectedList.sort((a, b) => a.z3d - b.z3d);

      // Render sorted 3D globe rays
      for (let i = 0; i < projectedList.length; i++) {
        const p = projectedList[i];

        // Depth-based atmospheric fading (closer = clearer/brighter, farther = subtle)
        const depthAlpha = Math.max(0.2, Math.min(1.0, (p.z3d + 400) / 800));
        const topAlpha = (p.tier === 'core' ? 0.55 : 0.85) * depthAlpha;

        const grad = ctx.createLinearGradient(p.startX, p.startY, p.tipX, p.tipY);
        grad.addColorStop(0, `rgba(${rgb}, 0)`);
        grad.addColorStop(0.3, `rgba(${rgb}, ${0.06 * depthAlpha})`);
        grad.addColorStop(0.65, `rgba(${rgb}, ${0.28 * depthAlpha})`);
        grad.addColorStop(1, `rgba(${rgb}, ${topAlpha})`);

        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.quadraticCurveTo(p.ctrlX, p.ctrlY, p.tipX, p.tipY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = (p.tier === 'core' ? 0.42 : 0.55) * Math.max(0.65, p.scale);
        ctx.stroke();

        // Tip Dot Node
        ctx.beginPath();
        ctx.arc(p.tipX, p.tipY, Math.max(0.6, p.dotSize), 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.tipDot;
        ctx.globalAlpha = Math.max(0.35, depthAlpha);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentTheme]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = mouseRef.current;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  };

  const handleMouseLeave = () => {
    const mouse = mouseRef.current;
    mouse.active = false;
    mouse.lastX = null;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex flex-col justify-end items-center select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
