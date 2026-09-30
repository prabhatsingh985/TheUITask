import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

function parseRgb(colorStr, fallback = [37, 99, 235]) {
  if (!colorStr) return fallback;
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  }
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  return fallback;
}

function parseThreeColor(colorStr, fallback = 0x3b82f6) {
  const [r, g, b] = parseRgb(colorStr);
  return new THREE.Color(r / 255, g / 255, b / 255);
}

function createDotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.5)');
  grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 3D Quadratic Bezier evaluation
function get3DBezierPoint(u, p0, p1, p2) {
  const inv = 1 - u;
  return {
    x: inv * inv * p0.x + 2 * inv * u * p1.x + u * u * p2.x,
    y: inv * inv * p0.y + 2 * inv * u * p1.y + u * u * p2.y,
    z: inv * inv * p0.z + 2 * inv * u * p1.z + u * u * p2.z
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

// Option 2: 3D Wobble / Orbital Precession Rays
function generateOrbitalRays() {
  const rand = createSeededRandom(985721);
  const list = [];

  // 1. Outer Canopy Rays (260 rays)
  const CANOPY_COUNT = 260;
  for (let i = 0; i < CANOPY_COUNT; i++) {
    const t = i / (CANOPY_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.015;
    const baseAngle = 0.22 + t * (Math.PI - 0.44) + angleJitter;

    const lengthVariance = 0.50 + rand() * 0.50;
    const waveSpeed = 0.6 + rand() * 1.2;
    const waveOffset = rand() * Math.PI * 2;
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
    const baseAngle = 0.24 + t * (Math.PI - 0.48) + angleJitter;

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

  // 3. Core Inner Rays (100 rays)
  const CORE_COUNT = 100;
  for (let i = 0; i < CORE_COUNT; i++) {
    const t = i / (CORE_COUNT - 1);
    const angleJitter = (rand() - 0.5) * 0.028;
    const baseAngle = 0.26 + t * (Math.PI - 0.52) + angleJitter;

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
const SEGMENTS_PER_STEM = 14;

export default function VideoDandelionVisualizer({ currentTheme }) {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, speed: 0, active: false, lastMoveTime: 0 });
  const themeRef = useRef(currentTheme);

  useEffect(() => {
    themeRef.current = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const fov = 50;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 3000);

    const updateCameraDistance = (w, h) => {
      const dist = (h / 2) / Math.tan((fov * Math.PI / 180) / 2);
      camera.position.set(0, 0, dist);
      camera.aspect = w / h;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    updateCameraDistance(width, height);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Rays Runtime State
    const rays = STATIC_RAYS.map(ray => ({
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

    // Count dots: every ray has 1 tip dot, outer rays with hasIntermediate have 1 extra
    const intermediateRays = rays.filter(r => r.hasIntermediate);
    const totalDotsCount = rays.length + intermediateRays.length;

    // 3. Stems (LineSegments) Setup
    // Each stem has SEGMENTS_PER_STEM lines -> SEGMENTS_PER_STEM * 2 vertices
    const totalStemVertices = rays.length * SEGMENTS_PER_STEM * 2;
    const stemPositions = new Float32Array(totalStemVertices * 3);
    const stemAlphas = new Float32Array(totalStemVertices);
    const stemColors = new Float32Array(totalStemVertices * 3);

    const stemGeometry = new THREE.BufferGeometry();
    const stemPosAttr = new THREE.BufferAttribute(stemPositions, 3);
    const stemAlphaAttr = new THREE.BufferAttribute(stemAlphas, 1);
    const stemColorAttr = new THREE.BufferAttribute(stemColors, 3);

    stemGeometry.setAttribute('position', stemPosAttr);
    stemGeometry.setAttribute('vAlpha', stemAlphaAttr);
    stemGeometry.setAttribute('vColor', stemColorAttr);

    const stemMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uGlobalAlpha: { value: 1.0 }
      },
      vertexShader: `
        attribute float vAlpha;
        attribute vec3 vColor;
        varying float fAlpha;
        varying vec3 fColor;
        void main() {
          fAlpha = vAlpha;
          fColor = vColor;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float fAlpha;
        varying vec3 fColor;
        uniform float uGlobalAlpha;
        void main() {
          gl_FragColor = vec4(fColor, fAlpha * uGlobalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const stemLines = new THREE.LineSegments(stemGeometry, stemMaterial);
    scene.add(stemLines);

    // 4. Tip and Intermediate Dots (Points) Setup
    const dotPositions = new Float32Array(totalDotsCount * 3);
    const dotColors = new Float32Array(totalDotsCount * 3);
    const dotSizes = new Float32Array(totalDotsCount);
    const dotAlphas = new Float32Array(totalDotsCount);

    const dotGeometry = new THREE.BufferGeometry();
    const dotPosAttr = new THREE.BufferAttribute(dotPositions, 3);
    const dotColorAttr = new THREE.BufferAttribute(dotColors, 3);
    const dotSizeAttr = new THREE.BufferAttribute(dotSizes, 1);
    const dotAlphaAttr = new THREE.BufferAttribute(dotAlphas, 1);

    dotGeometry.setAttribute('position', dotPosAttr);
    dotGeometry.setAttribute('color', dotColorAttr);
    dotGeometry.setAttribute('size', dotSizeAttr);
    dotGeometry.setAttribute('alpha', dotAlphaAttr);

    const dotTexture = createDotTexture();
    const dotMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: dotTexture },
        uGlobalAlpha: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Perspective size attenuation
          gl_PointSize = size * (340.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uGlobalAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * vAlpha * uGlobalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const dotPoints = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dotPoints);

    // 5. Core Base Atmosphere Glow
    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const coreGlowSprite = new THREE.Sprite(glowMaterial);
    coreGlowSprite.scale.set(120, 80, 1);
    scene.add(coreGlowSprite);

    // 6. Animation and Render Loop
    let time = 0;
    let animId = null;

    const render = () => {
      time += 0.018;

      const theme = themeRef.current;
      const themeRayColor = parseThreeColor(theme.rayLine);
      const themeTipColor = parseThreeColor(theme.tipDot);
      const themeHighlight = parseThreeColor(theme.highlightGlow || theme.tipDot);
      const themeCoreGlow = parseThreeColor(theme.coreGlow || theme.rayLine);

      coreGlowSprite.material.color.copy(themeCoreGlow);

      const mouse = mouseRef.current;
      const isMouseActive = mouse.active;

      // Mouse speed tracking with stop timer
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

      // Mouse position and velocity in Three.js coordinates (origin at center)
      const mouseWorldX = mouse.x - width / 2;
      const mouseWorldY = height / 2 - mouse.y;

      const mouseVelMag = Math.hypot(mouse.vx, mouse.vy);
      // In Three.js: moving up is +Y, so invert mouse.vy
      const mouseDirX = mouseVelMag > 0.5 ? mouse.vx / mouseVelMag : 0;
      const mouseDirY = mouseVelMag > 0.5 ? -mouse.vy / mouseVelMag : 0;

      // Dandelion Base Origin (bottom center in Three.js space)
      const originX = 0;
      const originY = -height / 2;
      const maxRadius = Math.min(width * 0.44, height * 0.58);

      coreGlowSprite.position.set(originX, originY + 12, 0);

      let stemVertexIdx = 0;
      let dotIdx = 0;

      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Breathing motion
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 4;
        const baseLen = ray.lengthVariance * maxRadius + breath;
        const effectiveBaseLen = baseLen + ray.currentExtendLen;

        // Base unperturbed tip position (upward in Three.js +Y)
        const baseTipX = originX + Math.cos(ray.baseAngle) * effectiveBaseLen;
        const baseTipY = originY + Math.sin(ray.baseAngle) * effectiveBaseLen;

        // Calculate distance from cursor directly to this ray's tip dot
        let targetInfluence = 0;
        let minDistToDot = 9999;

        const lenRatio = Math.min(1.0, Math.max(0.08, baseLen / maxRadius));
        const factor = Math.pow((lenRatio - 0.08) / 0.92, 1.4);

        if (isMouseActive) {
          const distToTip = Math.hypot(mouseWorldX - baseTipX, mouseWorldY - baseTipY);
          minDistToDot = distToTip;

          const hoverRadius = 48 + factor * 38;
          if (distToTip < hoverRadius) {
            targetInfluence = Math.pow(1 - distToTip / hoverRadius, 1.15);
          }
        }

        // Smoothly adapt influence
        ray.hoverInfluence += (targetInfluence - ray.hoverInfluence) * 0.26;
        const inf = ray.hoverInfluence;

        // 360° Rotation Speed:
        // Normal state (without hover): Gentle continuous 360° orbital rotation for all lines
        // On Hover with mouse movement: High-speed dynamic 360° rotation!
        const dir = Math.sign(ray.orbitSpeed);
        const baseIdleSpeed = ray.orbitSpeed;

        const speedBoost = (isMouseMoving && inf > 0.01)
          ? dir * (5.8 + currentMouseSpeed * 0.58) * inf
          : 0;

        const targetVel = baseIdleSpeed + speedBoost;

        if (inf > 0.02 && !isMouseMoving) {
          ray.angularVel += (baseIdleSpeed - ray.angularVel) * 0.28;
        } else {
          ray.angularVel += (targetVel - ray.angularVel) * 0.32;
        }

        ray.orbitAngle += ray.angularVel * 0.018;

        // Ray unit direction vector (pointing outward from origin in Three.js)
        const rayDirX = Math.cos(ray.baseAngle);
        const rayDirY = Math.sin(ray.baseAngle);
        const dotAlignment = mouseDirX * rayDirX + mouseDirY * rayDirY;

        // 1. Directional Extension & Flow in cursor movement direction
        let targetFlowX = 0;
        let targetFlowY = 0;
        let targetExtendLen = 0;

        if (isMouseMoving && inf > 0.005) {
          const flowScale = 0.20 + factor * 1.25;
          const maxFlowDist = (12 + Math.min(18, currentMouseSpeed * 0.28)) * flowScale;
          targetFlowX = mouseDirX * (inf * maxFlowDist);
          targetFlowY = mouseDirY * (inf * maxFlowDist);

          const extendScale = 0.15 + factor * 1.35;
          const extendAmount = (10 + Math.min(16, currentMouseSpeed * 0.25)) * extendScale;
          targetExtendLen = Math.max(0, dotAlignment) * (inf * extendAmount);
        }

        ray.currentFlowX += (targetFlowX - ray.currentFlowX) * 0.22;
        ray.currentFlowY += (targetFlowY - ray.currentFlowY) * 0.22;
        ray.currentExtendLen += (targetExtendLen - ray.currentExtendLen) * 0.22;

        // 2. Repulsion away from cursor
        let targetRepelX = 0;
        let targetRepelY = 0;
        if (isMouseActive && minDistToDot < 9999 && inf > 0.005) {
          const dx = baseTipX - mouseWorldX;
          const dy = baseTipY - mouseWorldY;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const repelScale = 0.16 + factor * 1.44;
          const maxRepel = (28 + Math.min(24, currentMouseSpeed * 0.35)) * repelScale;
          targetRepelX = nx * (inf * maxRepel);
          targetRepelY = ny * (inf * maxRepel);
        }

        ray.currentRepelX += (targetRepelX - ray.currentRepelX) * 0.25;
        ray.currentRepelY += (targetRepelY - ray.currentRepelY) * 0.25;

        // 3. True 3D Orbital Rotation:
        // Orbits in the plane perpendicular to the ray direction (Tangential XY + Depth Z!)
        const motionRadiusBoost = isMouseMoving ? (1.0 + Math.max(0, dotAlignment) * 0.35) : 1.0;
        const radiusScale = 0.14 + factor * 1.56;
        const hoverRadiusAdd = inf * (28 + Math.min(32, currentMouseSpeed * 0.45)) * radiusScale * motionRadiusBoost;
        const currentOrbitRadius = (ray.orbitRadius * radiusScale) + hoverRadiusAdd;

        // Tangent vector perpendicular to ray in XY plane
        const perpX = -Math.sin(ray.baseAngle);
        const perpY = Math.cos(ray.baseAngle);

        const orbitDx = perpX * Math.cos(ray.orbitAngle) * currentOrbitRadius;
        const orbitDy = perpY * Math.cos(ray.orbitAngle) * currentOrbitRadius;
        const orbitDz = Math.sin(ray.orbitAngle) * currentOrbitRadius * 1.15; // True 3D depth

        // Final Tip Position in 3D Space
        const tipX = baseTipX + orbitDx + ray.currentRepelX + ray.currentFlowX;
        const tipY = baseTipY + orbitDy + ray.currentRepelY + ray.currentFlowY;
        const tipZ = orbitDz;

        // Flexible Curved Stem in 3D:
        const midRatio = 0.52;
        const stemOrbitFactor = (0.22 + factor * 0.20) + inf * 0.20;
        const stemRepelFactor = 0.25 + factor * 0.30;
        const stemFlowFactor = 0.40 + factor * 0.25;

        const midX = originX + Math.cos(ray.baseAngle) * (effectiveBaseLen * midRatio)
          + orbitDx * stemOrbitFactor
          + ray.currentRepelX * stemRepelFactor
          + ray.currentFlowX * stemFlowFactor;
        const midY = originY + Math.sin(ray.baseAngle) * (effectiveBaseLen * midRatio)
          + orbitDy * stemOrbitFactor
          + ray.currentRepelY * stemRepelFactor
          + ray.currentFlowY * stemFlowFactor;
        const midZ = orbitDz * stemOrbitFactor;

        // Stem start point
        const uStart = Math.max(0.04, 1.0 - ray.stemFraction);
        const p0 = { x: originX, y: originY, z: 0 };
        const pMid = { x: midX, y: midY, z: midZ };
        const pTip = { x: tipX, y: tipY, z: tipZ };

        // Solve for control point of quadratic bezier passing through pStart, pMid, pTip
        const pStart = get3DBezierPoint(uStart, p0, pMid, pTip);
        const pHalf = get3DBezierPoint((uStart + 1.0) / 2, p0, pMid, pTip);

        const ctrl = {
          x: 2 * pHalf.x - 0.5 * (pStart.x + tipX),
          y: 2 * pHalf.y - 0.5 * (pStart.y + tipY),
          z: 2 * pHalf.z - 0.5 * (pStart.z + tipZ)
        };

        // 3D Front/Back visibility & lighting factor
        // When swinging towards user (Z > 0), dot and line glow brighter!
        const depthNorm = Math.max(0, Math.min(1.0, (tipZ / (currentOrbitRadius + 1)) * 0.5 + 0.5));
        const lineBrightness = 0.60 + 0.40 * depthNorm;

        // Generate line segments along the 3D stem
        let prevPt = pStart;
        for (let seg = 1; seg <= SEGMENTS_PER_STEM; seg++) {
          const uSeg = uStart + (seg / SEGMENTS_PER_STEM) * (1.0 - uStart);
          const currPt = get3DBezierPoint(uSeg, pStart, ctrl, pTip);

          const segAlpha0 = Math.pow((seg - 1) / SEGMENTS_PER_STEM, 1.3) * (0.10 + inf * 0.25) * lineBrightness;
          const segAlpha1 = Math.pow(seg / SEGMENTS_PER_STEM, 1.3) * (0.80 + inf * 0.20) * lineBrightness;

          // Vertex A
          stemPositions[stemVertexIdx * 3] = prevPt.x;
          stemPositions[stemVertexIdx * 3 + 1] = prevPt.y;
          stemPositions[stemVertexIdx * 3 + 2] = prevPt.z;
          stemAlphas[stemVertexIdx] = segAlpha0;
          stemColors[stemVertexIdx * 3] = themeRayColor.r;
          stemColors[stemVertexIdx * 3 + 1] = themeRayColor.g;
          stemColors[stemVertexIdx * 3 + 2] = themeRayColor.b;
          stemVertexIdx++;

          // Vertex B
          stemPositions[stemVertexIdx * 3] = currPt.x;
          stemPositions[stemVertexIdx * 3 + 1] = currPt.y;
          stemPositions[stemVertexIdx * 3 + 2] = currPt.z;
          stemAlphas[stemVertexIdx] = segAlpha1;
          stemColors[stemVertexIdx * 3] = themeRayColor.r;
          stemColors[stemVertexIdx * 3 + 1] = themeRayColor.g;
          stemColors[stemVertexIdx * 3 + 2] = themeRayColor.b;
          stemVertexIdx++;

          prevPt = currPt;
        }

        // Tip Dot (Point)
        const dotGrowth = (0.12 + factor * 0.38) * inf;
        const currentDotSize = ray.dotSize * (1.0 + dotGrowth) * (2.8 + depthNorm * 1.5);

        dotPositions[dotIdx * 3] = tipX;
        dotPositions[dotIdx * 3 + 1] = tipY;
        dotPositions[dotIdx * 3 + 2] = tipZ;

        // Color blend: hovered points glow with theme highlight
        const dotCol = inf > 0.05 ? themeHighlight : themeTipColor;
        dotColors[dotIdx * 3] = dotCol.r;
        dotColors[dotIdx * 3 + 1] = dotCol.g;
        dotColors[dotIdx * 3 + 2] = dotCol.b;

        dotSizes[dotIdx] = currentDotSize;
        dotAlphas[dotIdx] = 0.50 + 0.50 * depthNorm;
        dotIdx++;

        // Intermediate Dot (for outer canopy rays)
        if (ray.hasIntermediate) {
          const imPos = ray.intermediatePos;
          const imPt = get3DBezierPoint(imPos, pStart, ctrl, pTip);

          dotPositions[dotIdx * 3] = imPt.x;
          dotPositions[dotIdx * 3 + 1] = imPt.y;
          dotPositions[dotIdx * 3 + 2] = imPt.z;

          dotColors[dotIdx * 3] = themeTipColor.r;
          dotColors[dotIdx * 3 + 1] = themeTipColor.g;
          dotColors[dotIdx * 3 + 2] = themeTipColor.b;

          dotSizes[dotIdx] = 2.4 * (0.8 + 0.4 * depthNorm);
          dotAlphas[dotIdx] = 0.40 + 0.45 * depthNorm;
          dotIdx++;
        }
      }

      // Mark Three.js attributes for GPU upload
      stemPosAttr.needsUpdate = true;
      stemAlphaAttr.needsUpdate = true;
      stemColorAttr.needsUpdate = true;

      dotPosAttr.needsUpdate = true;
      dotColorAttr.needsUpdate = true;
      dotSizeAttr.needsUpdate = true;
      dotAlphaAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    render();

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      updateCameraDistance(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      stemGeometry.dispose();
      stemMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      dotTexture.dispose();
      glowTexture.dispose();
      glowMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
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
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex flex-col justify-end items-center select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
}
