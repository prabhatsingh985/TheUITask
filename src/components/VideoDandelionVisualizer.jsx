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

function getPointOnBezier(u, p0x, p0y, p1x, p1y, p2x, p2y) {
  const inv = 1 - u;
  return {
    x: inv * inv * p0x + 2 * inv * u * p1x + u * u * p2x,
    y: inv * inv * p0y + 2 * inv * u * p1y + u * u * p2y
  };
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

// Option 2: 3D Wobble / Orbital Precession (Individual 360° circular breeze dance)
function generateOrbitalRays() {
  const rand = createSeededRandom(985721);
  const list = [];

  // 1. Outer Canopy Rays (260 rays)
  const CANOPY_COUNT = 260;
  for (let i = 0; i < CANOPY_COUNT; i++) {
    const t = i / (CANOPY_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.015;
    const baseAngle = Math.PI - (0.08 + t * (Math.PI - 0.16)) + angleJitter;

    const lengthVariance = 0.50 + rand() * 0.50;
    const waveSpeed = 0.6 + rand() * 1.2;
    const waveOffset = rand() * Math.PI * 2;
    // 360° Orbital motion params (sweet spot: noticeable yet graceful flow)
    const dotSize = 0.85 + rand() * 1.45;
    const stemFraction = 0.70 + rand() * 0.20;
    const hasIntermediate = rand() > 0.75;
    const intermediatePos = 0.38 + rand() * 0.35;

    const orbitSpeed = (rand() > 0.5 ? 1 : -1) * (0.42 + rand() * 0.30);
    const orbitRadius = 6 + rand() * 7;
    const orbitPhase = rand() * Math.PI * 2;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate,
      intermediatePos,
      orbitSpeed,
      orbitRadius,
      orbitPhase,
      tier: 'outer'
    });
  }

  // 2. Mid-layer Rays (120 rays)
  const MID_COUNT = 120;
  for (let i = 0; i < MID_COUNT; i++) {
    const t = i / (MID_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.022;
    const baseAngle = Math.PI - (0.10 + t * (Math.PI - 0.20)) + angleJitter;

    const lengthVariance = 0.26 + rand() * 0.28;
    const waveSpeed = 0.5 + rand() * 0.9;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = 0.72 + rand() * 0.95;
    const stemFraction = 0.72 + rand() * 0.20;

    const orbitSpeed = (rand() > 0.5 ? 1 : -1) * (0.36 + rand() * 0.26);
    const orbitRadius = 4 + rand() * 5.5;
    const orbitPhase = rand() * Math.PI * 2;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate: false,
      intermediatePos: 0,
      orbitSpeed,
      orbitRadius,
      orbitPhase,
      tier: 'mid'
    });
  }

  // 3. Core Inner Rays filling the hollow empty space (100 rays)
  const CORE_COUNT = 100;
  for (let i = 0; i < CORE_COUNT; i++) {
    const t = i / (CORE_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.028;
    const baseAngle = Math.PI - (0.12 + t * (Math.PI - 0.24)) + angleJitter;

    const lengthVariance = 0.08 + rand() * 0.20;
    const waveSpeed = 0.4 + rand() * 0.8;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = 0.60 + rand() * 0.70;
    const stemFraction = 0.75 + rand() * 0.18;

    const orbitSpeed = (rand() > 0.5 ? 1 : -1) * (0.30 + rand() * 0.22);
    const orbitRadius = 2.5 + rand() * 4;
    const orbitPhase = rand() * Math.PI * 2;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate: false,
      intermediatePos: 0,
      orbitSpeed,
      orbitRadius,
      orbitPhase,
      tier: 'core'
    });
  }

  return list;
}

const STATIC_RAYS = generateOrbitalRays();

export default function VideoDandelionVisualizer({ currentTheme }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const raysRef = useRef([]);

  useEffect(() => {
    raysRef.current = STATIC_RAYS.map(ray => ({
      ...ray,
      currentLengthAdd: 0,
      targetLengthAdd: 0
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let time = 0;

    const render = () => {
      time += 0.018;

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

      const originX = width / 2;
      const originY = height + 10;
      const maxRadius = Math.min(width * 0.75, height * 0.92);

      const mouse = mouseRef.current;
      const isMouseActive = mouse.active;

      let mouseAngle = 0;
      let mouseDist = 0;
      if (isMouseActive) {
        const dx = mouse.x - originX;
        const dy = originY - mouse.y;
        mouseAngle = Math.atan2(dy, dx);
        mouseDist = Math.sqrt(dx * dx + dy * dy);
      }

      const rgb = extractRgb(currentTheme.rayLine);
      const colorStop0 = `rgba(${rgb}, 0)`;
      const colorStop1 = `rgba(${rgb}, 0.06)`;
      const colorStop2 = `rgba(${rgb}, 0.20)`;
      const colorStop3 = `rgba(${rgb}, 0.48)`;
      const colorStop4 = `rgba(${rgb}, 0.82)`;

      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Breathing motion
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 5;
        let baseLen = ray.lengthVariance * maxRadius + breath;

        // Interactive hover reaction
        if (isMouseActive) {
          const angleDiff = Math.abs(ray.baseAngle - mouseAngle);
          if (angleDiff < 0.28) {
            const influence = Math.pow(1 - angleDiff / 0.28, 2);
            const targetStretch = (mouseDist - baseLen) * 0.65 * influence;
            if (targetStretch > 0) {
              ray.targetLengthAdd = targetStretch;
            } else {
              ray.targetLengthAdd = influence * 35;
            }
          } else {
            ray.targetLengthAdd = 0;
          }
        } else {
          ray.targetLengthAdd = 0;
        }

        ray.currentLengthAdd += (ray.targetLengthAdd - ray.currentLengthAdd) * 0.12;
        const totalLen = baseLen + ray.currentLengthAdd;

        // Individual 360° circular wobble/orbit
        const orbitAngle = time * ray.orbitSpeed + ray.orbitPhase;
        const orbitDx = Math.cos(orbitAngle) * ray.orbitRadius;
        const orbitDy = Math.sin(orbitAngle) * ray.orbitRadius * 0.45; // perspective tilt
        const orbitDz = Math.sin(orbitAngle); // depth layer factor

        const baseTipX = originX + Math.cos(ray.baseAngle) * totalLen;
        const baseTipY = originY - Math.sin(ray.baseAngle) * totalLen;

        const tipX = baseTipX + orbitDx;
        const tipY = baseTipY + orbitDy;

        // Organic flexible curve towards moving dot
        const midRatio = 0.52;
        const midX = originX + Math.cos(ray.baseAngle) * (totalLen * midRatio) + orbitDx * 0.35;
        const midY = originY - Math.sin(ray.baseAngle) * (totalLen * midRatio) + orbitDy * 0.35;

        // Stem starting point
        const uStart = Math.max(0.04, 1.0 - ray.stemFraction);
        const pStart = getPointOnBezier(uStart, originX, originY, midX, midY, tipX, tipY);
        const pMid = getPointOnBezier((uStart + 1.0) / 2, originX, originY, midX, midY, tipX, tipY);

        const ctrlX = 2 * pMid.x - 0.5 * (pStart.x + tipX);
        const ctrlY = 2 * pMid.y - 0.5 * (pStart.y + tipY);

        // 3D Front/Back visibility:
        // Visible for ~75-80% of the orbit, dipping away smoothly only at the deep rear apex
        const lineVisibility = Math.max(0, Math.min(1.0, (orbitDz + 0.45) / 0.50));

        if (lineVisibility > 0.01) {
          const grad = ctx.createLinearGradient(pStart.x, pStart.y, tipX, tipY);
          grad.addColorStop(0, colorStop0);
          grad.addColorStop(0.2, `rgba(${rgb}, ${0.06 * lineVisibility})`);
          grad.addColorStop(0.5, `rgba(${rgb}, ${0.20 * lineVisibility})`);
          grad.addColorStop(0.8, `rgba(${rgb}, ${0.48 * lineVisibility})`);
          grad.addColorStop(1, `rgba(${rgb}, ${(ray.tier === 'core' ? 0.48 : 0.82) * lineVisibility})`);

          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = (ray.tier === 'core' ? 0.42 : (ray.tier === 'mid' ? 0.48 : (ray.currentLengthAdd > 15 ? 0.75 : 0.55))) * (0.6 + 0.4 * lineVisibility);
          ctx.stroke();

          // Tip Dot Node (only shown when rotating in front)
          ctx.beginPath();
          const depthScale = 1.0 + orbitDz * 0.18;
          const tipSize = (ray.currentLengthAdd > 15 ? ray.dotSize * 1.35 : ray.dotSize) * depthScale;
          ctx.arc(tipX, tipY, Math.max(0.6, tipSize), 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.tipDot;
          ctx.globalAlpha = lineVisibility;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Intermediate Dot with its own subtle orbital swing (only shown when rotating in front)
        if (ray.hasIntermediate && lineVisibility > 0.01) {
          const imPos = ray.intermediatePos;
          const imUStart = Math.max(0.04, imPos * (1.0 - ray.stemFraction));
          const imStart = getPointOnBezier(imUStart, originX, originY, midX, midY, tipX, tipY);
          const imMid = getPointOnBezier((imUStart + imPos) / 2, originX, originY, midX, midY, tipX, tipY);
          const imEnd = getPointOnBezier(imPos, originX, originY, midX, midY, tipX, tipY);

          const imCtrlX = 2 * imMid.x - 0.5 * (imStart.x + imEnd.x);
          const imCtrlY = 2 * imMid.y - 0.5 * (imStart.y + imEnd.y);

          const imGrad = ctx.createLinearGradient(imStart.x, imStart.y, imEnd.x, imEnd.y);
          imGrad.addColorStop(0, colorStop0);
          imGrad.addColorStop(0.3, `rgba(${rgb}, ${0.08 * lineVisibility})`);
          imGrad.addColorStop(0.7, `rgba(${rgb}, ${0.22 * lineVisibility})`);
          imGrad.addColorStop(1, `rgba(${rgb}, ${0.48 * lineVisibility})`);

          ctx.beginPath();
          ctx.moveTo(imStart.x, imStart.y);
          ctx.quadraticCurveTo(imCtrlX, imCtrlY, imEnd.x, imEnd.y);
          ctx.strokeStyle = imGrad;
          ctx.lineWidth = 0.45;
          ctx.stroke();

          ctx.beginPath();
          const depthScale = 1.0 + orbitDz * 0.18;
          ctx.arc(imEnd.x, imEnd.y, 0.85 * depthScale, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.tipDot;
          ctx.globalAlpha = lineVisibility;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
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
