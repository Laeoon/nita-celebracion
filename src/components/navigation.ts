import { SessionService } from '../services/auth/session';

export class NavigationComponent {
  private headerContainer: HTMLElement;
  private navContainer: HTMLElement;
  private onAdminClick: () => void;

  constructor(headerId: string, navId: string, onAdminClick: () => void) {
    const h = document.getElementById(headerId);
    const n = document.getElementById(navId);
    if (!h || !n) throw new Error('Contenedores de navegación no encontrados');
    this.headerContainer = h;
    this.navContainer = n;
    this.onAdminClick = onAdminClick;

    this.render();
    this.bindScrollSpy();
  }

  render(): void {
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    this.headerContainer.innerHTML = `
      <div class="max-w-xl mx-auto flex items-center justify-between gap-3">
        <!-- Monograma y Nombre -->
        <a href="#hero" class="flex items-center gap-3 group focus:outline-none">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-b from-champagne-400/25 to-champagne-400/5 border border-champagne-400/40 flex items-center justify-center text-base font-serif italic font-bold text-champagne-300 shadow-inner group-hover:border-champagne-300 transition">
            N
          </div>
          <div class="flex flex-col">
            <div class="flex items-baseline gap-2">
              <h1 class="text-base sm:text-lg font-serif font-bold tracking-tight text-white leading-none">
                Mariana <span class="italic font-normal text-champagne-300">“Nita”</span>
              </h1>
              <span class="px-1.5 py-0.5 rounded bg-champagne-400/10 border border-champagne-400/25 text-[9px] font-mono uppercase tracking-widest text-champagne-300">
                29 Oct
              </span>
            </div>
            <p class="text-[10px] text-neutral-400 font-medium mt-0.5">
              ${usuario ? `Hola, <span class="text-champagne-200 font-semibold">${usuario.nombre}</span>` : 'Celebración de Cumpleaños'}
            </p>
          </div>
        </a>

        <!-- Botón Administrar -->
        <button id="btn-header-admin" class="px-3 py-1.5 rounded-xl ${esAdmin ? 'bg-champagne-400 text-midnight font-semibold shadow-champagne-glow' : 'btn-secondary text-neutral-300'} text-xs font-medium flex items-center gap-1.5 transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <span>${esAdmin ? 'Admin Activo' : 'Administrar'}</span>
        </button>
      </div>
    `;

    // Barra de navegación inferior
    this.navContainer.innerHTML = `
      <div class="max-w-md mx-auto glass-panel-elevated rounded-2xl px-2 py-1.5 flex items-center justify-around border border-white/10 shadow-2xl">
        <a href="#hero" data-nav="hero" class="nav-item px-3 py-1.5 rounded-xl text-xs font-medium text-champagne-300 transition flex flex-col items-center gap-0.5">
          <span>Inicio</span>
        </a>
        <a href="#musica" data-nav="musica" class="nav-item px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex flex-col items-center gap-0.5">
          <span>Música</span>
        </a>
        <a href="#recuerdos" data-nav="recuerdos" class="nav-item px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex flex-col items-center gap-0.5">
          <span>Recuerdos</span>
        </a>
        <a href="#dedicatorias" data-nav="dedicatorias" class="nav-item px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex flex-col items-center gap-0.5">
          <span>Muro</span>
        </a>
        <a href="#formulario-recuerdo" data-nav="publicar" class="nav-item px-3 py-1.5 rounded-xl text-xs font-medium bg-champagne-400 text-midnight font-semibold shadow hover:bg-champagne-300 transition flex flex-col items-center gap-0.5">
          <span>Publicar</span>
        </a>
      </div>
    `;

    document.getElementById('btn-header-admin')?.addEventListener('click', () => {
      this.onAdminClick();
    });
  }

  private bindScrollSpy(): void {
    const sections = ['hero', 'musica', 'recuerdos', 'dedicatorias'];
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 200;
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
    const links = this.navContainer.querySelectorAll('.nav-item');
    links.forEach((l) => {
      const navTarget = l.getAttribute('data-nav');
      if (navTarget === id) {
        l.classList.add('text-champagne-300');
        l.classList.remove('text-neutral-400');
      } else if (navTarget !== 'publicar') {
        l.classList.remove('text-champagne-300');
        l.classList.add('text-neutral-400');
      }
    });
  }
}
