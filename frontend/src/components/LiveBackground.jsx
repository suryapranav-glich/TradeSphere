import React, { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════
// LAYER 3 — Canvas Particle Network with Mouse Repulsion
// ═══════════════════════════════════════════════════════════
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 120;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      opacity: 0.3 + Math.random() * 0.4,
    }));

    const handleMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const style = getComputedStyle(document.documentElement);
      const pColor = style.getPropertyValue('--particle-color').trim() || '147, 197, 253';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Mouse repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pColor}, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 120) {
            const opacity = (1 - d / 120) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${pColor}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />;
};

// ═══════════════════════════════════════════════════════════
// FULL LIVE BACKGROUND — 5 Layers
// ═══════════════════════════════════════════════════════════
const LiveBackground = () => {
  return (
    <>
      {/* LAYER 1 — Base radial gradient (handled by body CSS) */}

      {/* LAYER 2 — Aurora Orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '10%', top: '20%', width: 600, height: 600, borderRadius: '50%', background: 'var(--orb-1)', opacity: 0.15, filter: 'blur(100px)', willChange: 'transform', animation: 'orb-drift-1 12s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', left: '70%', top: '60%', width: 800, height: 800, borderRadius: '50%', background: 'var(--orb-2)', opacity: 0.12, filter: 'blur(100px)', willChange: 'transform', animation: 'orb-drift-2 15s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', left: '50%', top: '10%', width: 500, height: 500, borderRadius: '50%', background: 'var(--orb-3)', opacity: 0.10, filter: 'blur(100px)', willChange: 'transform', animation: 'orb-drift-3 18s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', left: '85%', top: '80%', width: 700, height: 700, borderRadius: '50%', background: 'var(--orb-4)', opacity: 0.08, filter: 'blur(100px)', willChange: 'transform', animation: 'orb-drift-4 20s ease-in-out infinite alternate' }} />
      </div>

      {/* LAYER 3 — Canvas Particles */}
      <ParticleCanvas />

      {/* LAYER 4 — Floating Geometric Shapes */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Hexagon 1 */}
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', top: '8%', left: '5%', width: 200, animation: 'geo-rotate 30s linear infinite' }}>
          <polygon points="100,10 190,55 190,145 100,190 10,145 10,55" fill="none" stroke="rgba(79,158,255,0.06)" strokeWidth="1.5" />
        </svg>
        {/* Triangle */}
        <svg viewBox="0 0 150 150" style={{ position: 'absolute', bottom: '10%', right: '8%', width: 150, animation: 'geo-rotate-r 25s linear infinite' }}>
          <polygon points="75,10 140,130 10,130" fill="none" stroke="rgba(167,139,250,0.05)" strokeWidth="1.5" />
        </svg>
        {/* Circle */}
        <svg viewBox="0 0 300 300" style={{ position: 'absolute', top: '30%', right: '15%', width: 300, animation: 'geo-pulse 8s ease-in-out infinite' }}>
          <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(6,182,212,0.04)" strokeWidth="1.5" />
        </svg>
        {/* Hexagon 2 */}
        <svg viewBox="0 0 120 120" style={{ position: 'absolute', top: '12%', right: '10%', width: 120, animation: 'geo-rotate 20s linear infinite' }}>
          <polygon points="60,5 115,32 115,88 60,115 5,88 5,32" fill="none" stroke="rgba(79,158,255,0.07)" strokeWidth="1" />
        </svg>
        {/* Diamond */}
        <svg viewBox="0 0 180 180" style={{ position: 'absolute', bottom: '15%', left: '12%', width: 180, animation: 'geo-rotate 35s linear infinite' }}>
          <polygon points="90,5 175,90 90,175 5,90" fill="none" stroke="rgba(167,139,250,0.05)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* LAYER 5 — Grid Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(79,158,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,158,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
    </>
  );
};

export default LiveBackground;
