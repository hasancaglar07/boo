"use client";

import { useEffect, useRef } from "react";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

export interface ParticleEffectOptions {
  particleCount?: number;
  minSize?: number;
  maxSize?: number;
  minSpeed?: number;
  maxSpeed?: number;
  fadeInSpeed?: number;
  fadeOutSpeed?: number;
  colors?: string[];
  interactive?: boolean;
  mouseInfluenceRadius?: number;
  mouseRepelForce?: number;
}

const DEFAULT_OPTIONS: Required<ParticleEffectOptions> = {
  particleCount: 50,
  minSize: 2,
  maxSize: 6,
  minSpeed: 0.2,
  maxSpeed: 0.8,
  fadeInSpeed: 0.02,
  fadeOutSpeed: 0.01,
  colors: ["#124, 58, 237", "#16, 185, 129", "#245, 158, 11"], // primary, emerald, amber
  interactive: true,
  mouseInfluenceRadius: 150,
  mouseRepelForce: 0.5,
};

export function useParticleEffect(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: ParticleEffectOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create initial particles
    const createParticle = (x?: number, y?: number): Particle => {
      const colorIndex = Math.floor(Math.random() * opts.colors.length);
      const color = opts.colors[colorIndex];

      return {
        x: x ?? Math.random() * canvas.width,
        y: y ?? Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (opts.maxSpeed - opts.minSpeed) + opts.minSpeed,
        vy: (Math.random() - 0.5) * (opts.maxSpeed - opts.minSpeed) + opts.minSpeed,
        size: Math.random() * (opts.maxSize - opts.minSize) + opts.minSize,
        opacity: 0,
        hue: parseFloat(color),
      };
    };

    particlesRef.current = Array.from({ length: opts.particleCount }, () =>
      createParticle()
    );

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Interactive mouse effect
        if (opts.interactive) {
          const dx = particle.x - mouseRef.current.x;
          const dy = particle.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < opts.mouseInfluenceRadius) {
            const force = (1 - distance / opts.mouseInfluenceRadius) * opts.mouseRepelForce;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        // Fade in
        if (particle.opacity < 0.6) {
          particle.opacity += opts.fadeInSpeed;
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.hue}, ${particle.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, opts]);

  // Mouse tracking
  useEffect(() => {
    if (!opts.interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [opts.interactive]);

  return { particles: particlesRef.current };
}

// Gradient animation hook
export function useGradientAnimation(
  elementRef: React.RefObject<HTMLElement | null>,
  colors: string[] = ["rgba(124, 58, 237, 0.1)", "rgba(16, 185, 129, 0.1)", "rgba(245, 158, 11, 0.1)"],
  duration: number = 10000
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let currentColorIndex = 0;
    let nextColorIndex = 1;
    let progress = 0;
    const step = 100 / (duration / 16); // 60fps

    const animate = () => {
      progress += step;

      if (progress >= 100) {
        progress = 0;
        currentColorIndex = nextColorIndex;
        nextColorIndex = (nextColorIndex + 1) % colors.length;
      }

      const currentColor = colors[currentColorIndex];
      const nextColor = colors[nextColorIndex];
      const blendedColor = blendColors(currentColor, nextColor, progress / 100);

      element.style.background = blendedColor;

      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [elementRef, colors, duration]);
}

// Color blending utility
function blendColors(color1: string, color2: string, progress: number): string {
  const parseColor = (color: string) => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  };

  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * progress);
  const g = Math.round(c1.g + (c2.g - c1.g) * progress);
  const b = Math.round(c1.b + (c2.b - c1.b) * progress);
  const a = c1.a + (c2.a - c1.a) * progress;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Confetti effect for celebrations
export function triggerConfetti(container: HTMLElement) {
  const confettiCount = 100;
  const colors = ["#124, 58, 237", "#16, 185, 129", "#245, 158, 11", "#239, 68, 68"];

  for (let i = 0; i < confettiCount; i++) {
    createConfettiPiece(container, colors);
  }
}

function createConfettiPiece(container: HTMLElement, colors: string[]) {
  const confetti = document.createElement("div");
  const color = colors[Math.floor(Math.random() * colors.length)];
  const startX = Math.random() * container.offsetWidth;
  const rotation = Math.random() * 360;
  const scale = Math.random() * 0.5 + 0.5;

  confetti.style.cssText = `
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgb(${color});
    left: ${startX}px;
    top: -10px;
    transform: rotate(${rotation}deg) scale(${scale});
    border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
    pointer-events: none;
    z-index: 1000;
  `;

  container.appendChild(confetti);

  const animation = confetti.animate(
    [
      {
        transform: `translateY(0) rotate(${rotation}deg) scale(${scale})`,
        opacity: 1,
      },
      {
        transform: `translateY(${container.offsetHeight + 20}px) rotate(${rotation + 360}deg) scale(${scale})`,
        opacity: 0,
      },
    ],
    {
      duration: Math.random() * 2000 + 2000,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    }
  );

  animation.onfinish = () => confetti.remove();
}
