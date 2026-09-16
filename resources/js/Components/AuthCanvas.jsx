import { useEffect, useRef } from 'react';

/**
 * Shared authentication backdrop.
 *
 * Dark premium canvas: near-black base, one large blue radial glow that
 * breathes slowly, a faint blueprint grid and a few drifting particles.
 *
 * Public API is unchanged — the component still takes no props and stays
 * decorative (`aria-hidden`, `pointer-events-none`).
 */
export default function AuthCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return undefined;
        }

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

        let width = 0;
        let height = 0;
        let animationFrame = 0;

        // Drifting motes of accent light — small, slow, low-opacity.
        const particles = Array.from({ length: 22 }, () => ({
            x: 0,
            y: 0,
            radius: Math.random() * 1.6 + 0.6,
            speedX: (Math.random() - 0.5) * 0.18,
            speedY: (Math.random() - 0.5) * 0.18,
            alpha: Math.random() * 0.28 + 0.1,
        }));

        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);

            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * ratio);
            canvas.height = Math.floor(height * ratio);

            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            particles.forEach((particle) => {
                particle.x = Math.random() * width;
                particle.y = Math.random() * height;
            });
        };

        const drawBase = () => {
            const base = context.createLinearGradient(0, 0, 0, height);
            base.addColorStop(0, '#0b0b12');
            base.addColorStop(0.42, '#08080c');
            base.addColorStop(1, '#050508');
            context.fillStyle = base;
            context.fillRect(0, 0, width, height);
        };

        const drawGlows = (time) => {
            const drift = Math.sin(time * 0.00018);

            // Primary accent bloom anchored to the top of the viewport.
            const primary = context.createRadialGradient(
                width * 0.5,
                height * (-0.05 + drift * 0.02),
                0,
                width * 0.5,
                height * (-0.05 + drift * 0.02),
                Math.max(width, height) * 0.72,
            );
            primary.addColorStop(0, 'rgba(0, 85, 255, 0.30)');
            primary.addColorStop(0.45, 'rgba(0, 85, 255, 0.08)');
            primary.addColorStop(1, 'rgba(0, 85, 255, 0)');
            context.fillStyle = primary;
            context.fillRect(0, 0, width, height);

            // Secondary bloom bleeding in from the right edge.
            const secondary = context.createRadialGradient(
                width * (0.9 + drift * 0.03),
                height * 0.12,
                0,
                width * (0.9 + drift * 0.03),
                height * 0.12,
                Math.max(width, height) * 0.5,
            );
            secondary.addColorStop(0, 'rgba(0, 85, 255, 0.16)');
            secondary.addColorStop(1, 'rgba(0, 85, 255, 0)');
            context.fillStyle = secondary;
            context.fillRect(0, 0, width, height);
        };

        const drawGrid = () => {
            const size = 64;

            context.strokeStyle = 'rgba(255, 255, 255, 0.045)';
            context.lineWidth = 1;
            context.beginPath();

            for (let x = 0.5; x <= width; x += size) {
                context.moveTo(Math.floor(x) + 0.5, 0);
                context.lineTo(Math.floor(x) + 0.5, height);
            }

            for (let y = 0.5; y <= height; y += size) {
                context.moveTo(0, Math.floor(y) + 0.5);
                context.lineTo(width, Math.floor(y) + 0.5);
            }

            context.stroke();
        };

        const drawParticles = () => {
            particles.forEach((particle) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                if (particle.x <= 0 || particle.x >= width) {
                    particle.speedX *= -1;
                }

                if (particle.y <= 0 || particle.y >= height) {
                    particle.speedY *= -1;
                }

                const glow = context.createRadialGradient(
                    particle.x,
                    particle.y,
                    0,
                    particle.x,
                    particle.y,
                    particle.radius * 8,
                );
                glow.addColorStop(0, `rgba(120, 165, 255, ${particle.alpha})`);
                glow.addColorStop(1, 'rgba(0, 85, 255, 0)');

                context.fillStyle = glow;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius * 8, 0, Math.PI * 2);
                context.fill();
            });
        };

        const render = (time) => {
            drawBase();
            drawGlows(time);
            drawGrid();
            drawParticles();
            animationFrame = window.requestAnimationFrame(render);
        };

        resize();

        if (reduceMotion) {
            // Single static frame — still on-brand, no movement.
            drawBase();
            drawGlows(0);
            drawGrid();
            drawParticles();
        } else {
            animationFrame = window.requestAnimationFrame(render);
        }

        window.addEventListener('resize', resize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <canvas ref={canvasRef} className="h-full w-full" />
            {/* Vignette keeps the card readable over the glow. */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_35%,rgba(5,5,8,0.85)_100%)]" />
        </div>
    );
}
