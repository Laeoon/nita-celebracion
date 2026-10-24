/**
 * Sistema de partículas de fondo animado (burbujas y destellos champaña)
 * Extremadamente liviano, sin dependencias externas y acelerado por canvas.
 */

export class ParticlesBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    opacity: number;
    maxOpacity: number;
    pulseSpeed: number;
    color: string;
  }> = [];

  constructor(canvasId: string) {
    let el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) {
      el = document.createElement('canvas');
      el.id = canvasId;
      el.className = 'fixed inset-0 pointer-events-none z-0';
      document.body.prepend(el);
    }
    this.canvas = el;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('No se pudo inicializar el contexto 2D para partículas');
    this.ctx = context;

    this.resize();
    this.initParticles();
    this.animate();

    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private initParticles(): void {
    const count = Math.min(55, Math.floor(window.innerWidth / 20));
    this.particles = [];

    const colors = [
      'rgba(212, 168, 106, ', // Champagne gold
      'rgba(229, 203, 153, ', // Light gold
      'rgba(243, 229, 200, ', // Warm cream
      'rgba(255, 176, 205, ', // Soft rose
    ];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.45 + 0.15,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        maxOpacity: Math.random() * 0.5 + 0.35,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Movimiento ascendente suave
      p.y -= p.speedY;
      p.x += Math.sin(p.y * 0.015) * p.speedX;

      // Efecto titilante
      p.opacity += p.pulseSpeed;
      if (p.opacity > p.maxOpacity || p.opacity < 0.1) {
        p.pulseSpeed = -p.pulseSpeed;
      }

      // Reiniciar al salir por arriba
      if (p.y < -10) {
        p.y = this.canvas.height + 10;
        p.x = Math.random() * this.canvas.width;
      }

      // Dibujar partícula con aura suave
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + Math.max(0, Math.min(1, p.opacity)) + ')';
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = '#d4a86a';
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(this.animate);
  };

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
