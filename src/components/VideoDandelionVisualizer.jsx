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
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, speed: 0, active: false, lastMoveTime: 0 });
  const raysRef = useRef([]);

  useEffect(() => {
    raysRef.current = STATIC_RAYS.map(ray => ({
      ...ray,
      orbitAngle: ray.orbitPhase,
      angularVel: ray.orbitSpeed,
      hoverInfluence: 0,
      currentRepelX: 0,
      currentRepelY: 0,
      currentFlowX: 0,
      currentFlowY: 0,
      currentExtendLen: 0
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

      // Check if mouse actively moved recently (within 40ms)
      const now = performance.now();
      if (now - mouse.lastMoveTime > 40) {
        mouse.speed = 0;
        mouse.vx *= 0.50;
        mouse.vy *= 0.50;
        if (Math.abs(mouse.vx) < 0.1) mouse.vx = 0;
        if (Math.abs(mouse.vy) < 0.1) mouse.vy = 0;
      }
      const isMouseMoving = isMouseActive && mouse.speed >= 1.0;
      const currentMouseSpeed = isMouseMoving ? Math.min(120, mouse.speed) : 0;

      // Direction of cursor movement vector (e.g. vy < 0 when moving upward)
      const mouseVelMag = Math.hypot(mouse.vx, mouse.vy);
      const mouseDirX = mouseVelMag > 0.5 ? mouse.vx / mouseVelMag : 0;
      const mouseDirY = mouseVelMag > 0.5 ? mouse.vy / mouseVelMag : 0;

      const rgb = extractRgb(currentTheme.rayLine);
      const colorStop0 = `rgba(${rgb}, 0)`;

      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Breathing motion
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 5;
        const baseLen = ray.lengthVariance * maxRadius + breath;
        const effectiveBaseLen = baseLen + ray.currentExtendLen;

        const baseTipX = originX + Math.cos(ray.baseAngle) * effectiveBaseLen;
        const baseTipY = originY - Math.sin(ray.baseAngle) * effectiveBaseLen;

        // Calculate distance from cursor directly to this ray's tip dot
        // (Ensures only dots surrounding the cursor move; distant dots remain completely still)
        let targetInfluence = 0;
        let minDistToDot = 9999;

        // Dynamic scale factor based on ray length (0.0 to 1.0):
        // Core/bottom rays have lenRatio ~0.08 to 0.28 -> factor ~0.0 to 0.08
        // Upper canopy rays have lenRatio ~0.70 to 1.0 -> factor ~0.60 to 1.0
        const lenRatio = Math.min(1.0, Math.max(0.08, baseLen / maxRadius));
        const factor = Math.pow((lenRatio - 0.08) / 0.92, 1.4);

        if (isMouseActive) {
          const distToTip = Math.hypot(mouse.x - baseTipX, mouse.y - baseTipY);
          minDistToDot = distToTip;

          // Localized hover radius: focused (~68px) near dense bottom core,
          // expanding to spacious (~112px) for top outer canopy
          const hoverRadius = 68 + factor * 44;
          if (distToTip < hoverRadius) {
            targetInfluence = Math.pow(1 - distToTip / hoverRadius, 1.15);
          }
        }

        // Smoothly adapt influence
        ray.hoverInfluence += (targetInfluence - ray.hoverInfluence) * 0.26;
        const inf = ray.hoverInfluence;

        // 360° Rotation Speed:
        // ONLY rotates when mouse cursor is actively moving!
        // When mouse cursor stops, rotation halts completely!
        const dir = Math.sign(ray.orbitSpeed);
        const speedBoost = isMouseMoving 
          ? dir * (5.8 + currentMouseSpeed * 0.58) * inf 
          : 0;

        const targetVel = speedBoost;

        if (!isMouseMoving || inf < 0.02) {
          // Rapid deceleration to a complete stop when mouse stops
          ray.angularVel *= 0.38;
          if (Math.abs(ray.angularVel) < 0.04) ray.angularVel = 0;
        } else {
          ray.angularVel += (targetVel - ray.angularVel) * 0.36;
        }

        // Only advance angle when rotating
        if (ray.angularVel !== 0) {
          ray.orbitAngle += ray.angularVel * 0.018;
        }

        // Ray unit direction vector (pointing outward from origin)
        const rayDirX = Math.cos(ray.baseAngle);
        const rayDirY = -Math.sin(ray.baseAngle);
        const dotAlignment = mouseDirX * rayDirX + mouseDirY * rayDirY;

        // 1. Directional Extension & Flow in cursor movement direction:
        // E.g., when cursor moves bottom to top (mouseDirY < 0), close lines/points move upward and extend outward!
        let targetFlowX = 0;
        let targetFlowY = 0;
        let targetExtendLen = 0;

        if (isMouseMoving && inf > 0.005) {
          // Directional drag/flow displacement
          const flowScale = 0.20 + factor * 1.25;
          const maxFlowDist = (16 + Math.min(26, currentMouseSpeed * 0.35)) * flowScale;
          targetFlowX = mouseDirX * (inf * maxFlowDist);
          targetFlowY = mouseDirY * (inf * maxFlowDist);

          // Radial length extension along ray direction
          const extendScale = 0.15 + factor * 1.35;
          const extendAmount = (14 + Math.min(24, currentMouseSpeed * 0.32)) * extendScale;
          targetExtendLen = Math.max(0, dotAlignment) * (inf * extendAmount);
        }

        // Smooth spring physics for directional flow and radial length extension
        ray.currentFlowX += (targetFlowX - ray.currentFlowX) * 0.22;
        ray.currentFlowY += (targetFlowY - ray.currentFlowY) * 0.22;
        ray.currentExtendLen += (targetExtendLen - ray.currentExtendLen) * 0.22;

        // 2. Repulsion away from cursor ("points with lines cursor se dur bhagni chahiye"):
        // Bottom lines get gentle push (~14-18px), top lines get full dynamic push (~110-128px)
        let targetRepelX = 0;
        let targetRepelY = 0;
        if (isMouseActive && minDistToDot < 9999 && inf > 0.005) {
          const dx = baseTipX - mouse.x;
          const dy = baseTipY - mouse.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const repelScale = 0.16 + factor * 1.44; // ~0.20 for bottom rays, ~1.60 for top rays
          const maxRepel = (42 + Math.min(38, currentMouseSpeed * 0.45)) * repelScale;
          targetRepelX = nx * (inf * maxRepel);
          targetRepelY = ny * (inf * maxRepel);
        }

        // Smooth spring physics for repulsion
        ray.currentRepelX += (targetRepelX - ray.currentRepelX) * 0.25;
        ray.currentRepelY += (targetRepelY - ray.currentRepelY) * 0.25;

        // 3. Dynamic 360° orbital circle with directional expansion ("and also increase their radius accordingly"):
        // Radius increases with motion speed and directional alignment
        const motionRadiusBoost = isMouseMoving ? (1.0 + Math.max(0, dotAlignment) * 0.35) : 1.0;
        const radiusScale = 0.14 + factor * 1.56; // ~0.18 for bottom rays, ~1.70 for top rays
        const hoverRadiusAdd = inf * (42 + Math.min(48, currentMouseSpeed * 0.55)) * radiusScale * motionRadiusBoost;
        const currentOrbitRadius = (ray.orbitRadius * radiusScale) + hoverRadiusAdd;
        const orbitDx = Math.cos(ray.orbitAngle) * currentOrbitRadius;
        const orbitDy = Math.sin(ray.orbitAngle) * currentOrbitRadius * 0.65; // Fuller 3D circular form
        const orbitDz = Math.sin(ray.orbitAngle); // depth layer factor

        // Combined position: Base + 360° rotation + Repulsion + Directional flow
        const tipX = baseTipX + orbitDx + ray.currentRepelX + ray.currentFlowX;
        const tipY = baseTipY + orbitDy + ray.currentRepelY + ray.currentFlowY;

        // Organic flexible curve towards moving dot (entire stem sways with 360° circle, bends away, and flows with movement)
        const midRatio = 0.52;
        const stemOrbitFactor = (0.22 + factor * 0.20) + inf * 0.20;
        const stemRepelFactor = 0.25 + factor * 0.30;
        const stemFlowFactor = 0.40 + factor * 0.25;
        const midX = originX + Math.cos(ray.baseAngle) * (effectiveBaseLen * midRatio) 
          + orbitDx * stemOrbitFactor 
          + ray.currentRepelX * stemRepelFactor 
          + ray.currentFlowX * stemFlowFactor;
        const midY = originY - Math.sin(ray.baseAngle) * (effectiveBaseLen * midRatio) 
          + orbitDy * stemOrbitFactor 
          + ray.currentRepelY * stemRepelFactor 
          + ray.currentFlowY * stemFlowFactor;

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
          grad.addColorStop(0.2, `rgba(${rgb}, ${(0.06 + inf * 0.10) * lineVisibility})`);
          grad.addColorStop(0.5, `rgba(${rgb}, ${(0.20 + inf * 0.18) * lineVisibility})`);
          grad.addColorStop(0.8, `rgba(${rgb}, ${(0.48 + inf * 0.22) * lineVisibility})`);
          grad.addColorStop(1, `rgba(${rgb}, ${(ray.tier === 'core' ? 0.48 : (0.82 + inf * 0.18)) * lineVisibility})`);

          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.strokeStyle = grad;
          const baseWidth = (ray.tier === 'core' ? 0.42 : (ray.tier === 'mid' ? 0.48 : (inf > 0.15 ? 0.78 : 0.55)));
          const widthGrowth = (0.06 + factor * 0.20) * inf;
          ctx.lineWidth = (baseWidth + widthGrowth) * (0.6 + 0.4 * lineVisibility);
          ctx.stroke();

          // Tip Dot Node (only shown when rotating in front)
          ctx.beginPath();
          const depthScale = 1.0 + orbitDz * 0.18;
          const dotGrowth = (0.12 + factor * 0.38) * inf;
          const tipSize = ray.dotSize * (1.0 + dotGrowth) * depthScale;
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
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;

    if (mouse.active) {
      const dx = newX - mouse.x;
      const dy = newY - mouse.y;
      const instSpeed = Math.hypot(dx, dy);
      mouse.speed = mouse.speed * 0.35 + instSpeed * 0.65;
      mouse.vx = mouse.vx * 0.35 + dx * 0.65;
      mouse.vy = mouse.vy * 0.35 + dy * 0.65;
    } else {
      mouse.speed = 0;
      mouse.vx = 0;
      mouse.vy = 0;
    }

    mouse.x = newX;
    mouse.y = newY;
    mouse.active = true;
    mouse.lastMoveTime = performance.now();
  };

  const handleMouseLeave = () => {
    const mouse = mouseRef.current;
    mouse.active = false;
    mouse.speed = 0;
    mouse.vx = 0;
    mouse.vy = 0;
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
