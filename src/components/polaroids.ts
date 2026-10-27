import { store } from '../services/store/appStore';
import { audioPlayer } from '../services/audio/player';
import { SessionService } from '../services/auth/session';
import { showToast } from './toast';
import type { CategoriaRecuerdo } from '../types';

export class PolaroidsComponent {
  private container: HTMLElement;
  private animFrameId: number | null = null;
  private isUserInteracting: boolean = false;
  private activeDiveOutIndex: number | null = null;
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró #${containerId}`);
    this.container = el;

    this.render();

    store.subscribe(() => {
      this.actualizarLista();
    });
    audioPlayer.subscribe(() => {
      this.actualizarMiniPlayers();
    });

    // Control del botón Atrás del teléfono para el Dive Out
    window.addEventListener('popstate', () => {
      if (this.activeDiveOutIndex !== null) {
        this.cerrarDiveOut(false);
      }
    });
  }

  public render(): void {
    this.container.innerHTML = `
      <section class="space-y-4 scroll-mt-28" id="recuerdos">
        <!-- Encabezado de galería y filtros -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between px-1">
            <div>
              <h3 class="text-xl font-serif font-bold text-white tracking-wide">Galería Polaroid</h3>
              <p class="text-xs text-neutral-400">Momentos espontáneos con audio exclusivo de 30 segundos</p>
            </div>
            <span id="carousel-count-badge" class="px-2 py-0.5 rounded-full bg-champagne-400/15 text-champagne-300 font-mono text-[10px]">
              0 fotos
            </span>
          </div>

          <!-- Filtros de categoría horizontales deslizables -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full" id="polaroid-filters">
            <button data-cat="todas" class="px-3 py-1 rounded-full text-[11px] font-medium btn-primary whitespace-nowrap">Todas</button>
            <button data-cat="rumba" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">La Rumba</button>
            <button data-cat="grupo" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">El Grupo</button>
            <button data-cat="tomaderas" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">Tomaderas y Locuras</button>
            <button data-cat="viajes" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">Viajes y Playa</button>
            <button data-cat="infraganti" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">Infraganti y Fails</button>
            <button data-cat="nita" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap">Con Nita</button>
          </div>
        </div>

        <!-- Carrusel Continuo Infinito de Polaroids -->
        <div id="polaroid-carousel-wrapper" class="relative -mx-4 sm:mx-0 overflow-hidden py-1">
          <div id="polaroid-carousel" class="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-1 pb-4 pt-1 no-scrollbar select-none" style="scroll-behavior: smooth;">
            <!-- Renderizado dinámico de tarjetas -->
          </div>
        </div>

        <!-- Visor Fullscreen "Dive Out" con fondo blindado, flechas laterales y swipe -->
        <div id="polaroid-dive-out-modal" class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl hidden items-center justify-center p-3 sm:p-4 select-none">
          <!-- Contenido dinámico del Dive Out -->
        </div>
      </section>
    `;

    this.bindEvents();
    this.actualizarLista();
    this.iniciarMarqueeContinuo();
  }

  private bindEvents(): void {
    const filters = document.getElementById('polaroid-filters');
    filters?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      const cat = btn.getAttribute('data-cat') as CategoriaRecuerdo;
      if (cat) {
        store.setFiltro(cat);
        filters.querySelectorAll('button').forEach((b) => {
          b.className = b === btn
            ? 'px-3 py-1 rounded-full text-[11px] font-medium btn-primary whitespace-nowrap'
            : 'px-3 py-1 rounded-full text-[11px] font-medium btn-secondary whitespace-nowrap';
        });
      }
    });

    const carousel = document.getElementById('polaroid-carousel');
    // Congelar carrusel inmediatamente al apoyar el dedo o cursor
    carousel?.addEventListener('touchstart', () => {
      this.isUserInteracting = true;
    }, { passive: true });

    carousel?.addEventListener('touchend', () => {
      setTimeout(() => {
        this.isUserInteracting = false;
      }, 3000);
    }, { passive: true });

    carousel?.addEventListener('pointerdown', () => {
      this.isUserInteracting = true;
    });

    carousel?.addEventListener('pointerup', () => {
      setTimeout(() => {
        this.isUserInteracting = false;
      }, 2500);
    });

    carousel?.addEventListener('mouseenter', () => {
      this.isUserInteracting = true;
    });

    carousel?.addEventListener('mouseleave', () => {
      this.isUserInteracting = false;
    });
  }

  // --- DESPLAZAMIENTO SUAVE CONTINUO MARQUEE POR GPU ---
  private iniciarMarqueeContinuo(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      const carousel = document.getElementById('polaroid-carousel');
      if (carousel && !this.isUserInteracting && this.activeDiveOutIndex === null) {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        if (maxScroll > 15) {
          // Desplazamiento sutil a velocidad constante (60px por segundo)
          const step = (delta / 1000) * 35;
          carousel.scrollLeft += step;

          // Bucle continuo: al llegar al final, vuelve suavemente al principio
          if (carousel.scrollLeft >= maxScroll - 1) {
            carousel.scrollLeft = 1;
          }
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private actualizarLista(): void {
    const carousel = document.getElementById('polaroid-carousel');
    const badgeCount = document.getElementById('carousel-count-badge');
    if (!carousel) return;

    const recuerdos = store.getRecuerdosFiltrados();
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    if (badgeCount) badgeCount.textContent = `${recuerdos.length} fotos`;

    if (!recuerdos.length) {
      carousel.innerHTML = `
        <div class="w-full text-center py-12 glass-panel rounded-3xl border border-white/5 my-2">
          <p class="text-sm text-neutral-400 font-light">No hay fotos en esta categoría aún.</p>
          <p class="text-xs text-champagne-300/70 mt-1">Toca el botón + en el centro para sumar la primera.</p>
        </div>
      `;
      return;
    }

    const catLabels: Record<string, string> = {
      rumba: 'La Rumba',
      grupo: 'El Grupo',
      tomaderas: 'Tomaderas y Locuras',
      brindis: 'Tomaderas y Locuras',
      viajes: 'Viajes y Playa',
      infraganti: 'Infraganti',
      nita: 'Con Nita',
    };

    const tilts = ['-rotate-1', 'rotate-1', '-rotate-0.5', 'rotate-0.5'];

    carousel.innerHTML = recuerdos.map((r, i) => {
      const tilt = tilts[i % tilts.length];
      const puedeBorrar = esAdmin || (usuario && usuario.id === r.usuarioId);
      const labelCategoria = catLabels[r.categoria] || r.categoria;

      return `
        <div class="polaroid-card rounded-2xl p-4 sm:p-5 text-neutral-900 ${tilt} w-[84vw] max-w-[320px] flex-shrink-0 snap-center transform transition-all duration-300 relative group flex flex-col justify-between" id="card-${r.id}" data-card-index="${i}">
          <div>
            <!-- Marco Polaroid interactivo con Dive Out al tocar la foto -->
            <div class="w-full aspect-square bg-neutral-200 rounded-xl overflow-hidden shadow-inner relative mb-3 cursor-pointer select-none group/img" data-dive-out="${i}">
              <img src="${r.fotoUrl}" alt="${r.titulo}" class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" loading="lazy" />

              <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider text-champagne-300 border border-white/10 pointer-events-none">
                ${labelCategoria}
              </span>

              ${puedeBorrar ? `
                <button type="button" data-delete-id="${r.id}" class="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow" title="Eliminar foto">
                  ✕
                </button>
              ` : ''}
            </div>

            <!-- Título y fecha -->
            <div class="space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <h4 class="font-serif font-bold text-base text-neutral-900 leading-snug truncate">${r.titulo}</h4>
                <span class="text-[10px] text-neutral-500 font-mono flex-shrink-0">${r.fechaLugar || '29 Oct'}</span>
              </div>

              ${r.historia ? `
                <div class="text-xs text-neutral-700 italic font-serif leading-relaxed">
                  <p class="${r.historia.length > 90 ? 'line-clamp-2' : ''} transition-all" data-story-text="${r.id}">“${r.historia}”</p>
                  ${r.historia.length > 90 ? `
                    <button type="button" data-toggle-story="${r.id}" class="text-[10px] font-sans font-semibold text-champagne-600 hover:text-champagne-700 not-italic mt-0.5 underline">
                      ver más...
                    </button>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Parte inferior: reproductor 30s y reacciones -->
          <div class="pt-3 space-y-2 mt-2 border-t border-neutral-300/70">
            ${r.audioClipUrl ? `
              <div class="bg-neutral-900 rounded-xl p-2 text-white flex items-center gap-2 shadow" data-polaroid-player="${r.id}">
                <button type="button" data-play-clip="${r.id}" class="w-7 h-7 rounded-full bg-champagne-400 text-neutral-950 flex items-center justify-center flex-shrink-0 shadow hover:bg-champagne-300 transition">
                  <svg data-clip-icon="${r.id}" class="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between text-[9px] font-mono text-champagne-300/90 mb-0.5">
                    <span class="truncate max-w-[130px]">${r.cancionTitulo || '30s de música'}</span>
                    <span data-clip-time="${r.id}">0:30</span>
                  </div>
                  <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div data-clip-bar="${r.id}" class="h-full bg-champagne-400 w-0 transition-all duration-100"></div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="flex items-center justify-between text-xs">
              <span class="text-[11px] text-neutral-600 truncate max-w-[170px]">
                Por <strong class="text-neutral-900">${r.autorNombre}</strong> ${r.autorApodo ? `(${r.autorApodo})` : ''}
              </span>

              <button type="button" data-reaccionar-id="${r.id}" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${r.tieneMiReaccion ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'} text-xs font-semibold transition active:scale-95" title="Me gusta">
                <svg class="w-3.5 h-3.5 ${r.tieneMiReaccion ? 'fill-rose-500 text-rose-500' : 'fill-none text-neutral-500'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span>${r.reaccionesCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Asignar eventos de cards y Dive Out
    carousel.querySelectorAll('[data-dive-out]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.getAttribute('data-dive-out'));
        if (!isNaN(idx)) {
          this.abrirDiveOut(idx);
        }
      });
    });

    carousel.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (id && confirm('¿Deseas eliminar esta Polaroid?')) {
          if (audioPlayer.getEstado().activePolaroidId === id) {
            audioPlayer.detenerPolaroidAudio();
          }
          store.eliminarRecuerdo(id);
          showToast('Polaroid eliminada', 'info');
        }
      });
    });

    carousel.querySelectorAll('[data-play-clip]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-play-clip');
        if (!id) return;
        const recuerdo = recuerdos.find((r) => r.id === id);
        if (recuerdo?.audioClipUrl) {
          audioPlayer.playPolaroid(id, recuerdo.audioClipUrl, 0, 30);
        }
      });
    });

    carousel.querySelectorAll('[data-reaccionar-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-reaccionar-id');
        if (id) {
          store.toggleReaccion('recuerdo', id);
        }
      });
    });

    carousel.querySelectorAll('[data-toggle-story]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-toggle-story');
        const p = carousel.querySelector(`[data-story-text="${id}"]`);
        if (p) {
          const isClamped = p.classList.contains('line-clamp-2');
          if (isClamped) {
            p.classList.remove('line-clamp-2');
            btn.textContent = 'ver menos';
          } else {
            p.classList.add('line-clamp-2');
            btn.textContent = 'ver más...';
          }
        }
      });
    });
  }

  // --- TRANSICIÓN "DIVE OUT" (PANTALLA COMPLETA CON BLOQUEO Y FLECHAS LATERALES) ---
  private abrirDiveOut(index: number): void {
    const recuerdos = store.getRecuerdosFiltrados();
    const recuerdo = recuerdos[index];
    if (!recuerdo) return;

    this.activeDiveOutIndex = index;
    const modal = document.getElementById('polaroid-dive-out-modal');
    if (!modal) return;

    // Bloqueo estricto del scroll del fondo para que nada se mueva detrás
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Registrar estado en el historial para soportar el botón Atrás nativo del teléfono
    window.history.pushState({ modal: 'polaroid-dive-out', index }, '');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    modal.innerHTML = `
      <!-- Flecha Flotante Lateral Izquierda (<) -->
      ${index > 0 ? `
        <button id="btn-dive-arrow-prev" class="fixed left-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-champagne-400/40 text-champagne-300 flex items-center justify-center text-xl font-bold shadow-2xl transition active:scale-95" title="Anterior">
          ‹
        </button>
      ` : ''}

      <!-- Flecha Flotante Lateral Derecha (>) -->
      ${index < recuerdos.length - 1 ? `
        <button id="btn-dive-arrow-next" class="fixed right-3 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-champagne-400/40 text-champagne-300 flex items-center justify-center text-xl font-bold shadow-2xl transition active:scale-95" title="Siguiente">
          ›
        </button>
      ` : ''}

      <!-- Tarjeta ampliada centrada -->
      <div id="dive-out-card-panel" class="relative w-full max-w-sm rounded-3xl bg-neutral-950/98 border border-champagne-400/30 p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar transform transition-all duration-300">
        <!-- Barra superior: cerrar y contador -->
        <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span class="text-xs font-mono text-champagne-300">
            Foto ${index + 1} de ${recuerdos.length}
          </span>
          <button id="btn-cerrar-dive-out" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition" title="Cerrar">
            ✕
          </button>
        </div>

        <!-- Foto ampliada -->
        <div class="w-full aspect-square rounded-2xl overflow-hidden bg-black/60 shadow-lg relative">
          <img src="${recuerdo.fotoUrl}" alt="${recuerdo.titulo}" class="w-full h-full object-contain" />
          <span class="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-champagne-300 border border-white/10">
            ${recuerdo.categoria}
          </span>
        </div>

        <!-- Información y anécdota completa -->
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-lg font-serif font-bold text-white leading-tight">${recuerdo.titulo}</h3>
            <span class="text-xs text-neutral-400 font-mono flex-shrink-0">${recuerdo.fechaLugar || '29 Oct'}</span>
          </div>

          ${recuerdo.historia ? `
            <p class="text-xs text-neutral-300 font-serif italic leading-relaxed whitespace-pre-line pt-1">
              “${recuerdo.historia}”
            </p>
          ` : ''}

          <p class="text-[11px] text-neutral-400 pt-1">
            Por <strong class="text-champagne-200">${recuerdo.autorNombre}</strong> ${recuerdo.autorApodo ? `(${recuerdo.autorApodo})` : ''}
          </p>
        </div>

        <!-- Mini-reproductor de 30s -->
        ${recuerdo.audioClipUrl ? `
          <div class="bg-black/50 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
            <button type="button" id="btn-dive-out-play" class="w-9 h-9 rounded-full bg-champagne-400 text-midnight flex items-center justify-center flex-shrink-0 shadow hover:bg-champagne-300 transition">
              <svg id="dive-out-play-icon" class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
            </button>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between text-[10px] font-mono text-champagne-300 mb-1">
                <span class="truncate">${recuerdo.cancionTitulo || '30s de música'}</span>
              </div>
              <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div id="dive-out-clip-bar" class="h-full bg-champagne-400 w-0 transition-all duration-100"></div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-cerrar-dive-out')?.addEventListener('click', () => {
      this.cerrarDiveOut(true);
    });

    modal.onclick = (e) => {
      if (e.target === modal) this.cerrarDiveOut(true);
    };

    document.getElementById('btn-dive-arrow-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (index > 0) this.abrirDiveOut(index - 1);
    });

    document.getElementById('btn-dive-arrow-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (index < recuerdos.length - 1) this.abrirDiveOut(index + 1);
    });

    // Soporte de gesto táctil Swipe (deslizar a la izquierda o derecha en la pantalla)
    const cardPanel = document.getElementById('dive-out-card-panel');
    cardPanel?.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    cardPanel?.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;

      // Si el desplazamiento horizontal supera 45px y es mayor al vertical: cambiar foto
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0 && index < recuerdos.length - 1) {
          // Deslizó hacia la izquierda -> siguiente
          this.abrirDiveOut(index + 1);
        } else if (deltaX > 0 && index > 0) {
          // Deslizó hacia la derecha -> anterior
          this.abrirDiveOut(index - 1);
        }
      }
    }, { passive: true });

    document.getElementById('btn-dive-out-play')?.addEventListener('click', () => {
      if (recuerdo.audioClipUrl) {
        audioPlayer.playPolaroid(recuerdo.id, recuerdo.audioClipUrl, 0, 30);
      }
    });
  }

  private cerrarDiveOut(triggerHistoryBack: boolean = true): void {
    if (this.activeDiveOutIndex === null) return;
    this.activeDiveOutIndex = null;

    // Restaurar scroll de fondo
    document.body.style.overflow = '';
    document.body.style.touchAction = '';

    const modal = document.getElementById('polaroid-dive-out-modal');
    if (modal) {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      modal.innerHTML = '';
    }

    if (triggerHistoryBack && window.history.state?.modal === 'polaroid-dive-out') {
      window.history.back();
    }
  }

  private actualizarMiniPlayers(): void {
    const estado = audioPlayer.getEstado();

    document.querySelectorAll('[data-polaroid-player]').forEach((wrap) => {
      const id = wrap.getAttribute('data-polaroid-player');
      if (!id) return;

      const bar = wrap.querySelector(`[data-clip-bar="${id}"]`) as HTMLElement;
      const timeEl = wrap.querySelector(`[data-clip-time="${id}"]`);
      const icon = wrap.querySelector(`[data-clip-icon="${id}"]`);

      const isActive = estado.activePolaroidId === id && estado.isPolaroidPlaying;

      if (isActive) {
        const pct = Math.min(100, (estado.polaroidCurrentTime / 30) * 100);
        if (bar) bar.style.width = `${pct}%`;
        if (timeEl) timeEl.textContent = this.formatTime(Math.min(30, estado.polaroidCurrentTime));
        if (icon) {
          icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>';
        }
      } else {
        if (bar) bar.style.width = '0%';
        if (timeEl) timeEl.textContent = '0:30';
        if (icon) {
          icon.innerHTML = '<path d="M8 5v14l11-7z"></path>';
        }
      }
    });

    const diveOutBar = document.getElementById('dive-out-clip-bar');
    const diveOutPlayIcon = document.getElementById('dive-out-play-icon');
    if (diveOutBar && diveOutPlayIcon) {
      if (estado.isPolaroidPlaying) {
        const pct = Math.min(100, (estado.polaroidCurrentTime / 30) * 100);
        diveOutBar.style.width = `${pct}%`;
        diveOutPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>';
      } else {
        diveOutBar.style.width = '0%';
        diveOutPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"></path>';
      }
    }
  }

  private formatTime(seg: number): string {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  destroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
