import { useEffect, useRef } from 'react';

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

        let width = 0;
        let height = 0;
        let animationFrame = 0;

        const particles = Array.from({ length: 26 }, () => ({
            x: 0,
            y: 0,
            radius: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: (Math.random() - 0.5) * 0.25,
            drift: Math.random() * 0.7 + 0.2,
        }));

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            particles.forEach((particle) => {
                particle.x = Math.random() * width;
                particle.y = Math.random() * height;
            });
        };

        const drawGradient = (time) => {
            const gradient = context.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#f8fbff');
            gradient.addColorStop(0.5, '#ecf4ff');
            gradient.addColorStop(1, '#fdfdfd');

            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);

            const waveY = height * (0.15 + Math.sin(time * 0.00025) * 0.02);
            context.fillStyle = 'rgba(56, 189, 248, 0.10)';
            context.beginPath();
            context.moveTo(0, waveY);
            context.quadraticCurveTo(width * 0.35, waveY + 40, width * 0.7, waveY - 20);
            context.quadraticCurveTo(width * 0.9, waveY - 45, width, waveY + 20);
            context.lineTo(width, 0);
            context.lineTo(0, 0);
            context.closePath();
            context.fill();
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

                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius + particle.drift, 0, Math.PI * 2);
                context.fillStyle = 'rgba(30, 64, 175, 0.11)';
                context.fill();
            });
        };

        const render = (time) => {
            drawGradient(time);
            drawParticles();
            animationFrame = window.requestAnimationFrame(render);
        };

        resize();
        animationFrame = window.requestAnimationFrame(render);
        window.addEventListener('resize', resize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />;
}
