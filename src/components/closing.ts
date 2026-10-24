export class ClosingComponent {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró #${containerId}`);
    this.container = el;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Homenaje y dedicatoria final del grupo -->
      <section class="pt-4" data-purpose="closing-dedication" id="dedicatoria-final">
        <div class="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-glass text-center border border-white/10">
          <!-- Sutil resplandor champagne -->
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-champagne-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <span class="text-[10px] uppercase font-semibold tracking-widest text-champagne-300 mb-2 block">
            Homenaje del grupo
          </span>
          <h3 class="text-2xl sm:text-3xl font-serif font-bold text-white mb-3 tracking-tight">
            Gracias por ser el corazón de cada encuentro
          </h3>
          <div class="space-y-3 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed max-w-md mx-auto">
            <p>Esta página reúne los momentos compartidos, las canciones de siempre y el cariño de quienes celebramos tu vida hoy.</p>
            <p class="font-serif italic text-champagne-200 text-base sm:text-lg pt-1">
              “Que este nuevo año traiga grandes historias, música inolvidable y muchos motivos para brindar juntos.”
            </p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-center">
            <span class="text-xs font-serif font-semibold text-neutral-300 tracking-widest uppercase">
              Tus amigos de siempre
            </span>
          </div>
        </div>
      </section>

      <!-- Pie de página -->
      <footer class="pt-10 pb-6 text-center space-y-1.5 border-t border-white/10 mt-8">
        <div class="text-champagne-300 font-serif italic text-lg">
          Celebración de Mariana “Nita”
        </div>
        <p class="text-[10px] text-neutral-500 tracking-widest uppercase font-mono font-medium">
          29 de Octubre • 2026
        </p>
      </footer>
    `;
  }
}
