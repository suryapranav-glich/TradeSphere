import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useDashboardStore } from '../store/dashboardStore';

const ParticleBackground = () => {
  const [init, setInit] = useState(false);
  const theme = useDashboardStore(state => state.theme);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const getParticleColor = () => {
    if (theme === 'aurora') return "#34D399";
    if (theme === 'crimson') return "#F87171";
    return "#4F9EFF"; // midnight
  };

  if (!init) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Particles
        id="tsparticles"
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            color: { value: getParticleColor() },
            links: { color: getParticleColor(), distance: 150, enable: true, opacity: 0.2, width: 1 },
            move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: true, speed: 0.5, straight: false },
            number: { density: { enable: true, area: 800 }, value: 60 },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
};

export default ParticleBackground;
