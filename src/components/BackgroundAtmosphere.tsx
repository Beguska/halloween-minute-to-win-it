import React, { useEffect, useRef } from 'react';

interface BackgroundAtmosphereProps {
  urgent?: boolean;
}

export const BackgroundAtmosphere: React.FC<BackgroundAtmosphereProps> = ({ urgent = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
    }

    const particleCount = 45;
    const particles: Particle[] = [];
    const colors = ['#FF7518', '#F5B942', '#D72638', '#8B5CF6'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.45 + 0.15),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 transition-colors duration-700 ${
        urgent
          ? 'bg-gradient-to-b from-[#250308] via-[#150205] to-[#0B090D]'
          : 'bg-gradient-to-b from-[#140c1e] via-[#0e0a14] to-[#0B090D]'
      }`}
    >
      {/* Mystical radial glows */}
      <div
        className={`absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          urgent ? 'bg-red-700/25' : 'bg-orange-600/15'
        }`}
      />
      <div
        className={`absolute bottom-10 right-1/4 w-[700px] h-[450px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 ${
          urgent ? 'bg-red-950/40' : 'bg-purple-900/15'
        }`}
      />

      {/* Floating animated bats */}
      <div className="absolute top-12 left-10 opacity-30 animate-bat scale-75 hidden sm:block">
        <svg width="48" height="24" viewBox="0 0 100 50" fill="currentColor" className="text-orange-500">
          <path d="M50 30 C35 15, 20 20, 5 10 C15 35, 35 40, 48 35 C49 37, 51 37, 52 35 C65 40, 85 35, 95 10 C80 20, 65 15, 50 30 Z" />
        </svg>
      </div>
      <div className="absolute top-24 right-16 opacity-25 animate-bat [animation-delay:4s] scale-90 hidden sm:block">
        <svg width="48" height="24" viewBox="0 0 100 50" fill="currentColor" className="text-purple-400">
          <path d="M50 30 C35 15, 20 20, 5 10 C15 35, 35 40, 48 35 C49 37, 51 37, 52 35 C65 40, 85 35, 95 10 C80 20, 65 15, 50 30 Z" />
        </svg>
      </div>
      <div className="absolute top-64 left-1/3 opacity-20 animate-bat [animation-delay:8s] scale-50 hidden md:block">
        <svg width="48" height="24" viewBox="0 0 100 50" fill="currentColor" className="text-amber-500">
          <path d="M50 30 C35 15, 20 20, 5 10 C15 35, 35 40, 48 35 C49 37, 51 37, 52 35 C65 40, 85 35, 95 10 C80 20, 65 15, 50 30 Z" />
        </svg>
      </div>

      {/* Fog horizontal drifting glow */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#0B090D] via-[#1a1226]/20 to-transparent pointer-events-none" />

      {/* Embers canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
