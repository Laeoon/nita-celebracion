export class CountdownComponent {
  private container: HTMLElement;
  private intervalId: number | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el elemento #${containerId}`);
    this.container = el;
    this.render();
    this.iniciar();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="glass-panel rounded-3xl p-6 sm:p-8 text-center shadow-glass relative overflow-hidden">
        <!-- Ambient subtle glow behind title -->
        <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-champagne-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-champagne-400/25 text-[10px] font-semibold tracking-widest uppercase text-champagne-300 mb-5">
          <span>29 de Octubre</span>
        </div>

        <h2 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-[1.15] mb-3 text-white">
          Feliz Cumpleaños,<br/>
          <span class="text-champagne-300 font-serif italic font-bold text-4xl sm:text-5xl block mt-1">Mariana (“Nita”)</span>
        </h2>

        <p class="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed max-w-md mx-auto mb-6">
          Un espacio íntimo y exclusivo para reunir nuestras mejores anécdotas, recuerdos de rumba y dedicatorias en tu día especial.
        </p>

        <!-- Reloj cuenta regresiva -->
        <div class="bg-black/40 rounded-2xl p-4 border border-white/10 mb-6">
          <div class="flex items-center justify-between mb-2.5 px-1">
            <p class="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              Cuenta regresiva • 29 de Octubre • 21:00
            </p>
            <span class="text-[10px] font-mono text-champagne-300" id="countdown-status">En curso</span>
          </div>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="bg-white/[0.03] rounded-xl p-2.5 border border-white/10">
              <span class="block text-xl sm:text-2xl font-mono font-bold text-champagne-300 tracking-tight" id="count-days">00</span>
              <span class="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">Días</span>
            </div>
            <div class="bg-white/[0.03] rounded-xl p-2.5 border border-white/10">
              <span class="block text-xl sm:text-2xl font-mono font-bold text-white tracking-tight" id="count-hours">00</span>
              <span class="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">Horas</span>
            </div>
            <div class="bg-white/[0.03] rounded-xl p-2.5 border border-white/10">
              <span class="block text-xl sm:text-2xl font-mono font-bold text-white tracking-tight" id="count-mins">00</span>
              <span class="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">Min</span>
            </div>
            <div class="bg-white/[0.03] rounded-xl p-2.5 border border-white/10">
              <span class="block text-xl sm:text-2xl font-mono font-bold text-champagne-400 tracking-tight" id="count-secs">00</span>
              <span class="block text-[9px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">Seg</span>
            </div>
          </div>
        </div>

        <!-- Acciones principales -->
        <div class="space-y-2.5">
          <a href="#publicar" class="w-full py-3 px-6 rounded-xl btn-primary font-sans font-semibold text-xs uppercase tracking-wider shadow-subtle flex items-center justify-center gap-2">
            <span>Subir foto o dedicatoria</span>
          </a>
        </div>
      </div>
    `;
  }

  private iniciar(): void {
    const calcular = () => {
      const ahora = new Date();
      let anio = ahora.getFullYear();
      let fechaObjetivo = new Date(anio, 9, 29, 21, 0, 0); // Octubre es mes 9 (0-indexed)

      // Si ya pasó este año, apunta al siguiente
      if (ahora.getTime() > fechaObjetivo.getTime()) {
        fechaObjetivo = new Date(anio + 1, 9, 29, 21, 0, 0);
      }

      const diff = fechaObjetivo.getTime() - ahora.getTime();

      const daysEl = document.getElementById('count-days');
      const hoursEl = document.getElementById('count-hours');
      const minsEl = document.getElementById('count-mins');
      const secsEl = document.getElementById('count-secs');
      const statusEl = document.getElementById('countdown-status');

      if (diff <= 0) {
        if (statusEl) statusEl.textContent = '¡Es hoy!';
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
    };

    calcular();
    this.intervalId = window.setInterval(calcular, 1000);
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
