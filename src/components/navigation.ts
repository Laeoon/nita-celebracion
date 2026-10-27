import { SessionService } from '../services/auth/session';

export type TabApp = 'recuerdos' | 'muro' | 'musica';

export class NavigationComponent {
  private headerContainer: HTMLElement;
  private bottomBarContainer: HTMLElement;
  private onAdminClick: () => void;
  private onPublishClick: () => void;
  private activeTab: TabApp = 'recuerdos';

  constructor(
    headerId: string,
    bottomBarId: string,
    onAdminClick: () => void,
    onPublishClick: () => void
  ) {
    const h = document.getElementById(headerId);
    const b = document.getElementById(bottomBarId);
    if (!h || !b) throw new Error('Contenedores de navegación no encontrados');
    this.headerContainer = h;
    this.bottomBarContainer = b;
    this.onAdminClick = onAdminClick;
    this.onPublishClick = onPublishClick;

    this.render();
  }

  render(): void {
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    // Header superior fijo y sobrio
    this.headerContainer.innerHTML = `
      <div class="max-w-xl mx-auto flex items-center justify-between gap-3">
        <a href="#hero" class="flex items-center gap-3 group focus:outline-none">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-b from-champagne-400/25 to-champagne-400/5 border border-champagne-400/40 flex items-center justify-center text-lg font-serif italic font-bold text-champagne-300 shadow-inner group-hover:border-champagne-300 transition">
            N
          </div>
          <div class="flex flex-col">
            <div class="flex items-baseline gap-2">
              <h1 class="text-base sm:text-lg font-serif font-bold tracking-tight text-white leading-none">
                Mariana <span class="italic font-normal text-champagne-300">“Nita”</span>
              </h1>
              <span class="px-1.5 py-0.5 rounded bg-champagne-400/10 border border-champagne-400/25 text-[9px] font-mono uppercase tracking-widest text-champagne-300 font-semibold">
                29 Oct
              </span>
            </div>
            <p class="text-[10px] uppercase tracking-[0.16em] text-neutral-400 font-medium mt-0.5">
              ${usuario ? `Hola, <span class="text-champagne-200 font-semibold lowercase tracking-normal font-sans">${usuario.nombre}</span>` : 'Celebración de Cumpleaños'}
            </p>
          </div>
        </a>

        <!-- Botón Administrar -->
        <button id="btn-header-admin" class="px-3.5 py-1.5 rounded-full ${esAdmin ? 'bg-champagne-400 text-midnight font-semibold shadow-champagne-glow' : 'btn-secondary text-neutral-300 hover:text-white'} text-xs font-medium flex items-center gap-1.5 transition">
          <span>${esAdmin ? 'Admin Activo' : 'Administrar'}</span>
        </button>
      </div>
    `;

    // Barra de navegación inferior estilo TikTok (sin emojis, tipografía limpia)
    this.bottomBarContainer.innerHTML = `
      <div class="max-w-md mx-auto flex items-center justify-around">
        <!-- Pestaña Recuerdos -->
        <button type="button" data-tab="recuerdos" class="tab-btn flex-1 py-1 flex flex-col items-center justify-center transition ${this.activeTab === 'recuerdos' ? 'text-champagne-300 font-semibold' : 'text-neutral-400 hover:text-white'}">
          <span class="text-xs font-medium tracking-wide">Recuerdos</span>
          <span class="w-1 h-1 rounded-full bg-champagne-300 mt-1 transition-opacity ${this.activeTab === 'recuerdos' ? 'opacity-100' : 'opacity-0'}"></span>
        </button>

        <!-- Pestaña Muro -->
        <button type="button" data-tab="muro" class="tab-btn flex-1 py-1 flex flex-col items-center justify-center transition ${this.activeTab === 'muro' ? 'text-champagne-300 font-semibold' : 'text-neutral-400 hover:text-white'}">
          <span class="text-xs font-medium tracking-wide">Muro</span>
          <span class="w-1 h-1 rounded-full bg-champagne-300 mt-1 transition-opacity ${this.activeTab === 'muro' ? 'opacity-100' : 'opacity-0'}"></span>
        </button>

        <!-- Botón Central + Estilo TikTok -->
        <div class="px-2">
          <button type="button" id="btn-bottom-publish" class="w-11 h-10 rounded-2xl bg-gradient-to-r from-champagne-400 to-champagne-300 text-midnight flex items-center justify-center font-bold text-xl shadow-champagne-glow active:scale-95 transition-transform" title="Compartir">
            +
          </button>
        </div>

        <!-- Pestaña Música -->
        <button type="button" data-tab="musica" class="tab-btn flex-1 py-1 flex flex-col items-center justify-center transition ${this.activeTab === 'musica' ? 'text-champagne-300 font-semibold' : 'text-neutral-400 hover:text-white'}">
          <span class="text-xs font-medium tracking-wide">Música</span>
          <span class="w-1 h-1 rounded-full bg-champagne-300 mt-1 transition-opacity ${this.activeTab === 'musica' ? 'opacity-100' : 'opacity-0'}"></span>
        </button>
      </div>
    `;

    document.getElementById('btn-header-admin')?.addEventListener('click', () => {
      this.onAdminClick();
    });

    document.getElementById('btn-bottom-publish')?.addEventListener('click', () => {
      this.onPublishClick();
    });

    this.bottomBarContainer.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as TabApp;
        if (tab) {
          this.cambiarPestana(tab);
        }
      });
    });
  }

  cambiarPestana(tab: TabApp): void {
    this.activeTab = tab;
    this.render();

    const viewRecuerdos = document.getElementById('view-recuerdos');
    const viewMuro = document.getElementById('view-muro');
    const viewMusica = document.getElementById('view-musica');

    if (viewRecuerdos && viewMuro && viewMusica) {
      viewRecuerdos.classList.toggle('hidden', tab !== 'recuerdos');
      viewMuro.classList.toggle('hidden', tab !== 'muro');
      viewMusica.classList.toggle('hidden', tab !== 'musica');
    }

    // Scroll suave a la parte superior de la vista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getActiveTab(): TabApp {
    return this.activeTab;
  }
}
