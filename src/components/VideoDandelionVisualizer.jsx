import React, { useRef, useEffect } from 'react';

const RAY_COUNT = 440;

export default function VideoDandelionVisualizer({ currentTheme }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const raysRef = useRef([]);

  // Generate dandelion radial filaments anchored at bottom
  useEffect(() => {
    const list = [];
    for (let i = 0; i < RAY_COUNT; i++) {
      // Fan arc from roughly 175° to 5° (pointing upward into the sky)
      const t = i / (RAY_COUNT - 1);
      const baseAngle = Math.PI - (0.10 + t * (Math.PI - 0.20));

      // Organic variation for dandelion head texture
      const lengthVariance = 0.52 + Math.random() * 0.48;
      const waveSpeed = 0.6 + Math.random() * 1.2;
      const waveOffset = Math.random() * Math.PI * 2;
      const dotSize = 1.0 + Math.random() * 2.2;
      const hasIntermediate = Math.random() > 0.8;
      const intermediatePos = 0.4 + Math.random() * 0.35;

      list.push({
        baseAngle,
        lengthVariance,
        currentLengthAdd: 0,
        targetLengthAdd: 0,
        waveSpeed,
        waveOffset,
        dotSize,
        hasIntermediate,
        intermediatePos
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

      // 1. Semi-circular glowing core at bottom center (as seen in all video frames)
      const coreRadius = maxRadius * 0.48;
      const coreGrad = ctx.createRadialGradient(
        originX, originY, 5,
        originX, originY, coreRadius
      );
      coreGrad.addColorStop(0, currentTheme.coreInner);
      coreGrad.addColorStop(0.4, currentTheme.coreGlow);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(originX, originY, coreRadius, Math.PI, 0, false);
      ctx.fill();

      // Secondary wider diffuse aura
      const auraGrad = ctx.createRadialGradient(
        originX, originY, 20,
        originX, originY, maxRadius * 0.85
      );
      auraGrad.addColorStop(0, currentTheme.coreGlow.replace(/[\d.]+\)$/, '0.2)'));
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(originX, originY, maxRadius * 0.85, Math.PI, 0, false);
      ctx.fill();

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

      // 2. Render all dandelion filaments
      const rays = raysRef.current;
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        // Gentle breathing animation
        const breath = Math.sin(time * ray.waveSpeed + ray.waveOffset) * 6;
        let baseLen = ray.lengthVariance * maxRadius + breath;

        // Interactive hover reaction (Frame 25: rays stretch upward towards cursor)
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
              ray.targetLengthAdd = influence * 40;
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

        // Subtle curve
        const midRatio = 0.52;
        const midX = originX + Math.cos(angle + sway * 0.5) * (totalLen * midRatio);
        const midY = originY - Math.sin(angle + sway * 0.5) * (totalLen * midRatio);

        // Draw Ray Line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);

        ctx.strokeStyle = currentTheme.rayLine;
        ctx.lineWidth = 0.55;
        ctx.stroke();

        // Draw Tip Dot Node
        ctx.beginPath();
        const tipSize = ray.currentLengthAdd > 15 ? ray.dotSize * 1.4 : ray.dotSize;
        ctx.arc(tipX, tipY, tipSize, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.tipDot;
        ctx.fill();

        // Draw Intermediate Dot
        if (ray.hasIntermediate) {
          const imLen = totalLen * ray.intermediatePos;
          const imX = originX + Math.cos(angle) * imLen;
          const imY = originY - Math.sin(angle) * imLen;
          ctx.beginPath();
          ctx.arc(imX, imY, 1.0, 0, Math.PI * 2);
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
