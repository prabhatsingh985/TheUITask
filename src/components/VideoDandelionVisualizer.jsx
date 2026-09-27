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
// Guarantees 100% identical layout, lengths, and dots across every page reload
function createSeededRandom(seed = 985721) {
  let s = seed;
  return function() {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStaticRays() {
  const rand = createSeededRandom(985721);
  const list = [];

  // 1. Outer Canopy Rays (340 rays)
  const CANOPY_COUNT = 340;
  for (let i = 0; i < CANOPY_COUNT; i++) {
    const t = i / (CANOPY_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.015;
    const baseAngle = Math.PI - (0.08 + t * (Math.PI - 0.16)) + angleJitter;

    // Canopy lengths from 0.50 to 1.0
    const lengthVariance = 0.50 + rand() * 0.50;
    const waveSpeed = 0.6 + rand() * 1.2;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = 1.1 + rand() * 2.1;
    const stemFraction = 0.70 + rand() * 0.20; // stem extends gracefully down, fading to 0 opacity
    const hasIntermediate = rand() > 0.65;
    const intermediatePos = 0.38 + rand() * 0.35;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate,
      intermediatePos,
      tier: 'outer'
    });
  }

  // 2. Mid-layer Filling Rays (160 rays)
  const MID_COUNT = 160;
  for (let i = 0; i < MID_COUNT; i++) {
    const t = i / (MID_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.022;
    const baseAngle = Math.PI - (0.10 + t * (Math.PI - 0.20)) + angleJitter;

    // Mid lengths from 0.26 to 0.54
    const lengthVariance = 0.26 + rand() * 0.28;
    const waveSpeed = 0.5 + rand() * 1.1;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = 0.9 + rand() * 1.4;
    const stemFraction = 0.72 + rand() * 0.20;
    const hasIntermediate = false;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate: false,
      intermediatePos: 0,
      tier: 'mid'
    });
  }

  // 3. Core Inner Rays filling the hollow empty space right above the replay button (140 rays)
  const CORE_COUNT = 140;
  for (let i = 0; i < CORE_COUNT; i++) {
    const t = i / (CORE_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.028;
    const baseAngle = Math.PI - (0.12 + t * (Math.PI - 0.24)) + angleJitter;

    // Core lengths directly occupying the hollow space (0.08 to 0.28)
    const lengthVariance = 0.08 + rand() * 0.20;
    const waveSpeed = 0.45 + rand() * 1.0;
    const waveOffset = rand() * Math.PI * 2;
    const dotSize = 0.75 + rand() * 1.1;
    const stemFraction = 0.75 + rand() * 0.18; // delicate faded stem
    const hasIntermediate = false;

    list.push({
      baseAngle,
      lengthVariance,
      waveSpeed,
      waveOffset,
      dotSize,
      stemFraction,
      hasIntermediate: false,
      intermediatePos: 0,
      tier: 'core'
    });
  }

  return list;
}

const STATIC_RAYS = generateStaticRays();

export default function VideoDandelionVisualizer({ currentTheme }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const raysRef = useRef([]);

  // Initialize with fixed deterministic structure so it never changes on reload
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

      // Anchored at bottom center
      const originX = width / 2;
      const originY = height + 10;

      // Base radius scaled to window height/width
      const maxRadius = Math.min(width * 0.75, height * 0.92);

      // Mouse position
      const mouse = mouseRef.current;
      const isMouseActive = mouse.active;

      // Calculate mouse angle from bottom-center origin if inside canvas
      let mouseAngle = 0;
      let mouseDist = 0;
      if (isMouseActive) {
        const dx = mouse.x - originX;
        const dy = originY - mouse.y;
        mouseAngle = Math.atan2(dy, dx); // 0 to PI
        mouseDist = Math.sqrt(dx * dx + dy * dy);
      }

      // Pre-compute gradient color stops for current theme to maximize 60fps performance
      const rgb = extractRgb(currentTheme.rayLine);
      const colorStop0 = `rgba(${rgb}, 0)`;
      const colorStop1 = `rgba(${rgb}, 0.06)`;
      const colorStop2 = `rgba(${rgb}, 0.20)`;
      const colorStop3 = `rgba(${rgb}, 0.48)`;
      const colorStop4 = `rgba(${rgb}, 0.82)`;

      // Render all dandelion filaments
      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Gentle breathing animation
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 6;
        let baseLen = ray.lengthVariance * maxRadius + breath;

        // Interactive hover reaction (rays stretch upward towards cursor)
        if (isMouseActive) {
          const angleDiff = Math.abs(ray.baseAngle - mouseAngle);
          // If ray aligns with cursor direction
          if (angleDiff < 0.28) {
            const influence = Math.pow(1 - angleDiff / 0.28, 2);
            // Stretch ray towards cursor position
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

        // Smooth spring interpolation
        ray.currentLengthAdd += (ray.targetLengthAdd - ray.currentLengthAdd) * 0.12;
        const totalLen = baseLen + ray.currentLengthAdd;

        // Slight organic sway
        const sway = Math.sin(time * 0.8 + ray.waveOffset) * 0.012;
        const angle = ray.baseAngle + sway;

        const tipX = originX + Math.cos(angle) * totalLen;
        const tipY = originY - Math.sin(angle) * totalLen;

        // Subtle curve control
        const midRatio = 0.52;
        const midX = originX + Math.cos(angle + sway * 0.5) * (totalLen * midRatio);
        const midY = originY - Math.sin(angle + sway * 0.5) * (totalLen * midRatio);

        // Draw stem leading into tip dot:
        // Tail starts with 0 opacity (clean origin, no harsh clutter at bottom),
        // opacity gradually increases upwards, filling the space softly and connecting into the dot
        const uStart = Math.max(0.04, 1.0 - ray.stemFraction);
        const pStart = getPointOnBezier(uStart, originX, originY, midX, midY, tipX, tipY);
        const pMid = getPointOnBezier((uStart + 1.0) / 2, originX, originY, midX, midY, tipX, tipY);

        const ctrlX = 2 * pMid.x - 0.5 * (pStart.x + tipX);
        const ctrlY = 2 * pMid.y - 0.5 * (pStart.y + tipY);

        const grad = ctx.createLinearGradient(pStart.x, pStart.y, tipX, tipY);
        grad.addColorStop(0, colorStop0);
        grad.addColorStop(0.2, colorStop1);
        grad.addColorStop(0.5, colorStop2);
        grad.addColorStop(0.8, colorStop3);
        grad.addColorStop(1, ray.tier === 'core' ? colorStop3 : colorStop4);

        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ray.tier === 'core' ? 0.42 : (ray.tier === 'mid' ? 0.48 : (ray.currentLengthAdd > 15 ? 0.75 : 0.55));
        ctx.stroke();

        // Draw Tip Dot Node
        ctx.beginPath();
        const tipSize = ray.currentLengthAdd > 15 ? ray.dotSize * 1.35 : ray.dotSize;
        ctx.arc(tipX, tipY, tipSize, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.tipDot;
        ctx.fill();

        // Draw Intermediate Dot with subtle fading stem leading into it
        if (ray.hasIntermediate) {
          const imPos = ray.intermediatePos;
          const imUStart = Math.max(0.04, imPos * (1.0 - ray.stemFraction));
          const imStart = getPointOnBezier(imUStart, originX, originY, midX, midY, tipX, tipY);
          const imMid = getPointOnBezier((imUStart + imPos) / 2, originX, originY, midX, midY, tipX, tipY);
          const imEnd = getPointOnBezier(imPos, originX, originY, midX, midY, tipX, tipY);

          const imCtrlX = 2 * imMid.x - 0.5 * (imStart.x + imEnd.x);
          const imCtrlY = 2 * imMid.y - 0.5 * (imStart.y + imEnd.y);

          const imGrad = ctx.createLinearGradient(imStart.x, imStart.y, imEnd.x, imEnd.y);
          imGrad.addColorStop(0, colorStop0);
          imGrad.addColorStop(0.3, colorStop1);
          imGrad.addColorStop(0.7, colorStop2);
          imGrad.addColorStop(1, colorStop3);

          ctx.beginPath();
          ctx.moveTo(imStart.x, imStart.y);
          ctx.quadraticCurveTo(imCtrlX, imCtrlY, imEnd.x, imEnd.y);
          ctx.strokeStyle = imGrad;
          ctx.lineWidth = 0.45;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(imEnd.x, imEnd.y, 1.05, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.tipDot;
          ctx.fill();
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
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
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
