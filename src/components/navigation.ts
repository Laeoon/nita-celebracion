import { SessionService } from '../services/auth/session';

export class NavigationComponent {
  private headerContainer: HTMLElement;
  private onAdminClick: () => void;

  constructor(headerId: string, onAdminClick: () => void) {
    const h = document.getElementById(headerId);
    if (!h) throw new Error(`No se encontró #${headerId}`);
    this.headerContainer = h;
    this.onAdminClick = onAdminClick;

    this.render();
    this.bindScrollSpy();
  }

  render(): void {
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    this.headerContainer.innerHTML = `
      <div class="max-w-xl mx-auto flex flex-col gap-3">
        <!-- Fila superior: Marca, saludo y botón Administrar -->
        <div class="flex items-center justify-between gap-3">
          <a href="#hero" class="flex items-center gap-3 group focus:outline-none">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-b from-champagne-400/25 to-champagne-400/5 border border-champagne-400/40 flex items-center justify-center text-lg font-serif italic font-bold text-champagne-300 shadow-inner group-hover:border-champagne-300 transition">
              N
            </div>
            <div class="flex flex-col">
              <div class="flex items-baseline gap-2">
                <h1 class="text-lg font-serif font-bold tracking-tight text-white leading-none">
                  Mariana <span class="italic font-normal text-champagne-300">“Nita”</span>
                </h1>
                <span class="px-2 py-0.5 rounded-md bg-champagne-400/10 border border-champagne-400/25 text-[10px] font-mono uppercase tracking-widest text-champagne-300 font-semibold">
                  29 Oct
                </span>
              </div>
              <p class="text-[10px] uppercase tracking-[0.16em] text-neutral-400 font-medium mt-1">
                ${usuario ? `Hola, <span class="text-champagne-200 font-semibold lowercase tracking-normal font-sans">${usuario.nombre}</span>` : 'Celebración de Cumpleaños'}
              </p>
            </div>
          </a>

          <!-- Botón Administrar -->
          <button id="btn-header-admin" class="px-3.5 py-1.5 rounded-full ${esAdmin ? 'bg-champagne-400 text-midnight font-semibold shadow-champagne-glow' : 'btn-secondary text-neutral-300 hover:text-white'} text-xs font-medium flex items-center gap-1.5 transition">
            <span>${esAdmin ? 'Admin Activo' : 'Administrar'}</span>
          </button>
        </div>

        <!-- Barra de navegación segmentada (Pills integradas) -->
        <nav aria-label="Secciones" class="flex items-center justify-between p-1 bg-black/60 rounded-full border border-white/10 text-[11px] font-medium overflow-x-auto no-scrollbar">
          <a class="nav-pill px-3.5 py-1.5 rounded-full bg-champagne-400 text-midnight font-semibold transition-all whitespace-nowrap" data-nav="hero" href="#hero">
            Inicio
          </a>
          <a class="nav-pill px-3.5 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap" data-nav="musica" href="#musica">
            Música
          </a>
          <a class="nav-pill px-3.5 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap" data-nav="recuerdos" href="#recuerdos">
            Recuerdos
          </a>
          <a class="nav-pill px-3.5 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap" data-nav="dedicatorias" href="#dedicatorias">
            Dedicatorias
          </a>
          <a class="nav-pill px-3.5 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap" data-nav="formulario-recuerdo" href="#formulario-recuerdo">
            Publicar
          </a>
        </nav>
      </div>
    `;

    document.getElementById('btn-header-admin')?.addEventListener('click', () => {
      this.onAdminClick();
    });
  }

  private bindScrollSpy(): void {
    const sections = ['hero', 'musica', 'recuerdos', 'dedicatorias'];
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 180;
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            this.setActiveNav(id);
            break;
          }
        }
      }
    }, { passive: true });
  }

  private setActiveNav(id: string): void {
    const pills = this.headerContainer.querySelectorAll('.nav-pill');
    pills.forEach((p) => {
      const target = p.getAttribute('data-nav');
      if (target === id) {
        p.className = 'nav-pill px-3.5 py-1.5 rounded-full bg-champagne-400 text-midnight font-semibold transition-all whitespace-nowrap';
      } else {
        p.className = 'nav-pill px-3.5 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap';
      }
    });
  }
}
