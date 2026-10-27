import { supabase } from '../services/supabase/client';

export class CountdownComponent {
  private container: HTMLElement;
  private intervalId: number | null = null;
  private brindisCount: number = 0;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el elemento #${containerId}`);
    this.container = el;
    this.render();
    this.iniciar();
    this.iniciarBrindisSync();
  }

  private render(): void {
    this.container.innerHTML = `
      <section id="hero" class="scroll-mt-28">
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

          <!-- Acción: Brindar por Mariana con sonido, confeti y contador global -->
          <div class="space-y-2 relative" id="brindis-container">
            <button type="button" id="btn-brindar" class="w-full py-3.5 px-6 rounded-xl btn-primary font-sans font-bold text-xs uppercase tracking-wider shadow-champagne-glow flex items-center justify-center gap-2 active:scale-95 transition-all">
              <span>Brindar por Mariana</span>
            </button>
            <p class="text-[11px] text-neutral-400 text-center font-mono pt-1">
              El grupo ha brindado <strong id="brindis-count-val" class="text-champagne-300 font-bold">0</strong> veces por Nita
            </p>
          </div>
        </div>
      </section>
    `;

    this.bindBrindisEvent();
  }

  private iniciar(): void {
    const calcular = () => {
      const ahora = new Date();
      let anio = ahora.getFullYear();
      let fechaObjetivo = new Date(anio, 9, 29, 21, 0, 0);

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

  private bindBrindisEvent(): void {
    const btn = document.getElementById('btn-brindar');
    btn?.addEventListener('click', () => {
      this.brindisCount++;
      this.actualizarContadorBrindis(this.brindisCount);
      this.reproducirSonidoBrindis();
      this.dispararDestellosBrindis();

      // Guardar en Supabase en segundo plano
      supabase
        .from('comentarios')
        .update({ texto: String(this.brindisCount) })
        .eq('id', 'brindis-global')
        .then();
    });
  }

  private async iniciarBrindisSync(): Promise<void> {
    try {
      const { data } = await supabase
        .from('comentarios')
        .select('texto')
        .eq('id', 'brindis-global')
        .single();

      if (data && data.texto) {
        this.brindisCount = parseInt(data.texto, 10) || 0;
        this.actualizarContadorBrindis(this.brindisCount);
      }

      // Escuchar cambios de brindis en tiempo real desde otros teléfonos
      supabase
        .channel('brindis_sync')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comentarios', filter: 'id=eq.brindis-global' }, (payload) => {
          const nuevo = payload.new as { texto: string };
          if (nuevo && nuevo.texto) {
            this.brindisCount = parseInt(nuevo.texto, 10) || this.brindisCount;
            this.actualizarContadorBrindis(this.brindisCount);
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Error sincronizando brindis global:', err);
    }
  }

  private actualizarContadorBrindis(count: number): void {
    const el = document.getElementById('brindis-count-val');
    if (el) el.textContent = String(count);
  }

  // Sonido de copas de cristal chocando sintetizado por Web Audio
  private reproducirSonidoBrindis(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2450, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.85);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4900, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(4850, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.85);
      osc2.stop(ctx.currentTime + 0.85);
    } catch {
      // Ignorar si el navegador bloquea audio antes de interacción
    }
  }

  // Lluvia de destellos dorados y burbujas al brindar
  private dispararDestellosBrindis(): void {
    const btn = document.getElementById('btn-brindar');
    if (!btn) return;

    for (let i = 0; i < 18; i++) {
      const spark = document.createElement('span');
      spark.className = 'absolute w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-700 ease-out z-30 shadow';
      spark.style.backgroundColor = i % 2 === 0 ? '#d4a86a' : '#ffb0cd';
      spark.style.boxShadow = '0 0 8px #d4a86a';
      spark.style.left = '50%';
      spark.style.top = '50%';

      btn.appendChild(spark);

      const angle = (Math.PI * 2 * i) / 18;
      const distance = Math.random() * 80 + 40;
      const destX = Math.cos(angle) * distance;
      const destY = Math.sin(angle) * distance - 20;

      requestAnimationFrame(() => {
        spark.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
        spark.style.opacity = '0';
      });

      setTimeout(() => {
        spark.remove();
      }, 750);
    }
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
