import { audioPlayer } from '../services/audio/player';
import { store } from '../services/store/appStore';
import { SessionService } from '../services/auth/session';
import { guardarAudioEnIndexedDB } from '../services/storage/audioStorage';
import { showToast } from './toast';

export class PlayerComponent {
  private container: HTMLElement;
  private animFrameId: number | null = null;
  private isPlaylistOpen: boolean = false;
  private searchQuery: string = '';

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el elemento #${containerId}`);
    this.container = el;

    this.render();
    this.iniciarAnimacionOndas();

    audioPlayer.subscribe(() => {
      this.actualizarUI();
      this.actualizarPlaylistItems();
    });
    store.subscribe(() => {
      this.actualizarUI();
      this.actualizarPlaylistItems();
    });
  }

  public render(): void {
    const tracks = store.getTracks();

    this.container.innerHTML = `
      <section id="musica" class="scroll-mt-28 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-serif font-bold text-white tracking-wide">Reproductor Musical</h3>
            <p class="text-[11px] text-neutral-400">Playlist compartida de la fiesta</p>
          </div>
          <button id="btn-toggle-mute" class="px-3 py-1 rounded-full btn-secondary text-[11px] font-medium flex items-center gap-1.5 transition">
            <svg id="icon-mute" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M15.54 8.46a5 5 0 010 7.07" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span id="label-mute">Sonido</span>
          </button>
        </div>

        <!-- Tarjeta principal del reproductor -->
        <div class="glass-panel rounded-3xl p-5 relative overflow-hidden shadow-glass border border-white/10" id="player-card">
          <div class="flex items-center gap-4 mb-4">
            <!-- Disco de vinilo rotatorio -->
            <div id="vinyl-disc" class="relative w-14 h-14 rounded-full bg-neutral-950 p-1 border border-champagne-400/40 shadow-lg flex-shrink-0 flex items-center justify-center vinyl-spin">
              <div class="w-5 h-5 rounded-full bg-champagne-400/20 border border-champagne-400/60 flex items-center justify-center text-[9px] font-mono text-champagne-300 font-bold">
                LP
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-1">
                <span id="player-badge" class="inline-block px-2 py-0.5 rounded bg-white/5 text-champagne-300 text-[9px] font-semibold uppercase tracking-wider">
                  ${tracks.length ? `${tracks.length} canciones` : 'Sin pistas'}
                </span>
              </div>
              <h4 id="track-title" class="text-sm font-semibold text-white truncate">
                Reproductor listo
              </h4>
              <p id="track-artist" class="text-[11px] text-neutral-400 truncate">
                Toca "+ Agregar canción" para sumar música
              </p>
            </div>

            <!-- Visualizador reactivo de ondas -->
            <div class="flex items-end gap-1 h-6 px-1" id="visualizer-bars">
              <span class="w-1 bg-champagne-400 rounded-full transition-all duration-75" style="height: 4px;"></span>
              <span class="w-1 bg-champagne-300 rounded-full transition-all duration-75" style="height: 4px;"></span>
              <span class="w-1 bg-champagne-400 rounded-full transition-all duration-75" style="height: 4px;"></span>
              <span class="w-1 bg-champagne-300 rounded-full transition-all duration-75" style="height: 4px;"></span>
              <span class="w-1 bg-champagne-400 rounded-full transition-all duration-75" style="height: 4px;"></span>
            </div>
          </div>

          <!-- Barra de progreso interactiva -->
          <div class="space-y-1.5 mb-4">
            <div id="progress-container" class="relative w-full h-2 bg-white/10 hover:bg-white/15 rounded-full cursor-pointer transition overflow-hidden">
              <div id="progress-bar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-champagne-500 to-champagne-300 rounded-full w-0 transition-all duration-100"></div>
            </div>
            <div class="flex justify-between text-[10px] font-mono text-neutral-400">
              <span id="time-current">0:00</span>
              <span id="time-total">0:00</span>
            </div>
          </div>

          <!-- Controles de transporte -->
          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-2">
              <button id="btn-prev" class="w-9 h-9 rounded-full btn-secondary flex items-center justify-center text-neutral-300 hover:text-white" title="Anterior">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path>
                </svg>
              </button>
              <button id="btn-play-pause" class="w-11 h-11 rounded-full btn-primary flex items-center justify-center text-midnight shadow-champagne-glow" title="Reproducir / Pausar">
                <svg id="icon-play-state" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              </button>
              <button id="btn-next" class="w-9 h-9 rounded-full btn-secondary flex items-center justify-center text-neutral-300 hover:text-white" title="Siguiente">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path>
                </svg>
              </button>
            </div>

            <!-- Botón para subir música libre -->
            <label class="cursor-pointer px-3.5 py-1.5 rounded-xl btn-secondary text-xs flex items-center gap-1.5 font-medium border-champagne-400/30 text-champagne-300 hover:border-champagne-300 hover:bg-champagne-400/10 transition shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span>Agregar canción</span>
              <input id="input-subir-mp3" type="file" accept="audio/*" multiple class="hidden" />
            </label>
          </div>
        </div>

        <!-- Acordeón / Lista de reproducción con buscador -->
        <div class="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-glass" id="playlist-drawer">
          <button id="btn-toggle-playlist" type="button" class="w-full px-4 py-2.5 flex items-center justify-between text-xs text-neutral-300 hover:text-white transition bg-white/[0.02]">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-champagne-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span class="font-medium">Ver Lista de Canciones</span>
              <span id="playlist-badge-count" class="px-2 py-0.5 rounded-full bg-champagne-400/15 text-champagne-300 font-mono text-[10px]">
                ${tracks.length}
              </span>
            </div>
            <span id="playlist-chevron-icon" class="text-xs transition-transform duration-200">▾</span>
          </button>

          <div id="playlist-drawer-body" class="hidden border-t border-white/10 p-3 space-y-2.5">
            <!-- Buscador en tiempo real -->
            <div class="relative">
              <input 
                type="text" 
                id="playlist-search-input" 
                placeholder="Buscar canción o quién la sumó..." 
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-champagne-400"
              />
              <svg class="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <!-- Lista con scroll limitado -->
            <div id="playlist-items-container" class="space-y-1 max-h-52 overflow-y-auto no-scrollbar">
              <!-- Renderizado dinámico -->
            </div>
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
    this.actualizarUI();
    this.actualizarPlaylistItems();
  }

  private bindEvents(): void {
    const playBtn = document.getElementById('btn-play-pause');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const muteBtn = document.getElementById('btn-toggle-mute');
    const progressContainer = document.getElementById('progress-container');
    const mp3Input = document.getElementById('input-subir-mp3') as HTMLInputElement | null;
    const togglePlaylistBtn = document.getElementById('btn-toggle-playlist');
    const searchInput = document.getElementById('playlist-search-input') as HTMLInputElement | null;

    togglePlaylistBtn?.addEventListener('click', () => {
      this.isPlaylistOpen = !this.isPlaylistOpen;
      const drawerBody = document.getElementById('playlist-drawer-body');
      const chevron = document.getElementById('playlist-chevron-icon');
      if (drawerBody && chevron) {
        if (this.isPlaylistOpen) {
          drawerBody.classList.remove('hidden');
          chevron.style.transform = 'rotate(180deg)';
        } else {
          drawerBody.classList.add('hidden');
          chevron.style.transform = 'rotate(0deg)';
        }
      }
    });

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this.actualizarPlaylistItems();
    });

    playBtn?.addEventListener('click', () => {
      const tracks = store.getTracks();
      if (!tracks.length) {
        showToast('No hay pistas cargadas en el reproductor', 'alerta');
        return;
      }
      audioPlayer.togglePlay();
    });

    prevBtn?.addEventListener('click', () => audioPlayer.prev());
    nextBtn?.addEventListener('click', () => audioPlayer.next());

    muteBtn?.addEventListener('click', () => {
      const isMuted = audioPlayer.toggleMute();
      const muteLabel = document.getElementById('label-mute');
      if (muteLabel) muteLabel.textContent = isMuted ? 'Silenciado' : 'Sonido';
    });

    progressContainer?.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const estado = audioPlayer.getEstado();
      if (estado.duration > 0) {
        audioPlayer.seek(pct * estado.duration);
      }
    });

    mp3Input?.addEventListener('change', async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !files.length) return;

      const usuario = SessionService.getUsuario();
      const autorTexto = usuario ? `Sumada por ${usuario.nombre}` : 'Mariana “Nita” • Fiesta';

      let agregadas = 0;
      let duplicadas = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const trackId = 'track-' + Date.now() + '-' + i;
        const audioUrl = URL.createObjectURL(file);

        // Guardar persistente en IndexedDB para que no muera al recargar
        await guardarAudioEnIndexedDB(trackId, file);

        const ok = store.agregarTrack({
          id: trackId,
          titulo: cleanName,
          artista: autorTexto,
          audioUrl: audioUrl,
        });

        if (ok) {
          agregadas++;
        } else {
          duplicadas++;
        }
      }

      if (duplicadas > 0 && agregadas === 0) {
        showToast('Esa canción ya está en la lista (evitamos duplicados)', 'alerta');
      } else if (agregadas > 0) {
        showToast(`Se agregaron ${agregadas} canción(es) a la playlist`, 'exito');
      }

      mp3Input.value = '';
      this.actualizarUI();
      this.actualizarPlaylistItems();

      // Abrir lista para que vea que se agregaron
      if (!this.isPlaylistOpen && togglePlaylistBtn) {
        togglePlaylistBtn.click();
      }
    });
  }

  private actualizarPlaylistItems(): void {
    const listContainer = document.getElementById('playlist-items-container');
    const badgeCount = document.getElementById('playlist-badge-count');
    if (!listContainer) return;

    const tracks = store.getTracks();
    if (badgeCount) badgeCount.textContent = String(tracks.length);

    if (!tracks.length) {
      listContainer.innerHTML = `
        <div class="text-center py-4 text-xs text-neutral-500 font-light">
          Aún no hay canciones en la lista. Toca "+ Agregar canción".
        </div>
      `;
      return;
    }

    const estado = audioPlayer.getEstado();

    // Filtrar por término de búsqueda si existe
    const filtradas = tracks
      .map((t, idx) => ({ track: t, originalIndex: idx }))
      .filter(({ track }) => {
        if (!this.searchQuery) return true;
        return (
          track.titulo.toLowerCase().includes(this.searchQuery) ||
          track.artista.toLowerCase().includes(this.searchQuery)
        );
      });

    if (!filtradas.length) {
      listContainer.innerHTML = `
        <div class="text-center py-3 text-xs text-neutral-500 font-light">
          No se encontraron canciones con "${this.searchQuery}"
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtradas
      .map(({ track, originalIndex }) => {
        const isCurrent = estado.currentIndex === originalIndex;
        const isPlayingThis = isCurrent && estado.isPlaying;

        return `
          <div class="flex items-center justify-between p-2 rounded-xl transition ${
            isCurrent ? 'bg-champagne-400/15 border border-champagne-400/30' : 'bg-white/[0.02] hover:bg-white/[0.06]'
          } text-xs group cursor-pointer" data-track-index="${originalIndex}">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <button type="button" class="w-6 h-6 rounded-full ${
                isCurrent ? 'bg-champagne-400 text-midnight' : 'bg-white/10 text-neutral-300'
              } flex items-center justify-center flex-shrink-0 text-[10px]" title="Reproducir">
                ${
                  isPlayingThis
                    ? '<svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>'
                    : '<svg class="w-2.5 h-2.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>'
                }
              </button>
              <div class="min-w-0 flex-1">
                <p class="font-medium truncate ${isCurrent ? 'text-champagne-200 font-semibold' : 'text-neutral-200'}">
                  ${track.titulo}
                </p>
                <p class="text-[10px] text-neutral-400 truncate">
                  ${track.artista}
                </p>
              </div>
            </div>

            <!-- Botón para eliminar canción -->
            <button type="button" data-delete-track="${track.id}" class="w-6 h-6 rounded-full text-neutral-500 hover:text-rose-400 flex items-center justify-center text-xs opacity-60 hover:opacity-100 transition flex-shrink-0 ml-2" title="Quitar de la lista">
              ✕
            </button>
          </div>
        `;
      })
      .join('');

    // Eventos para seleccionar y reproducir track
    listContainer.querySelectorAll('[data-track-index]').forEach((item) => {
      item.addEventListener('click', (e) => {
        // Ignorar si se hizo clic en el botón de borrar
        if ((e.target as HTMLElement).closest('[data-delete-track]')) return;
        const idx = Number(item.getAttribute('data-track-index'));
        if (!isNaN(idx)) {
          audioPlayer.play(idx);
        }
      });
    });

    // Eventos para borrar track
    listContainer.querySelectorAll('[data-delete-track]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-track');
        if (id) {
          store.eliminarTrack(id);
          showToast('Canción eliminada de la lista', 'info');
        }
      });
    });
  }

  private iniciarAnimacionOndas(): void {
    const barsContainer = document.getElementById('visualizer-bars');
    if (!barsContainer) return;
    const bars = barsContainer.querySelectorAll('span');

    const tick = () => {
      const frecuencias = audioPlayer.getFrecuencias();
      bars.forEach((bar, idx) => {
        const h = frecuencias[idx] || 4;
        bar.style.height = `${h}px`;
      });
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private actualizarUI(): void {
    const estado = audioPlayer.getEstado();
    const tracks = store.getTracks();
    const playerCard = document.getElementById('player-card');
    const vinyl = document.getElementById('vinyl-disc');
    const badge = document.getElementById('player-badge');
    const title = document.getElementById('track-title');
    const artist = document.getElementById('track-artist');
    const playIcon = document.getElementById('icon-play-state');
    const progressBar = document.getElementById('progress-bar');
    const timeCurrent = document.getElementById('time-current');
    const timeTotal = document.getElementById('time-total');

    if (vinyl) {
      if (estado.isPlaying) {
        vinyl.classList.add('is-playing');
        vinyl.style.animationPlayState = 'running';
      } else {
        vinyl.classList.remove('is-playing');
        vinyl.style.animationPlayState = 'paused';
      }
    }

    if (playerCard) {
      if (estado.isPlaying) {
        playerCard.classList.add('border-champagne-400/30');
      } else {
        playerCard.classList.remove('border-champagne-400/30');
      }
    }

    if (playIcon) {
      playIcon.innerHTML = estado.isPlaying
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>'
        : '<path d="M8 5v14l11-7z"></path>';
    }

    if (estado.currentTrack) {
      if (badge) badge.textContent = `Pista ${estado.currentIndex + 1} de ${tracks.length}`;
      if (title) title.textContent = estado.currentTrack.titulo;
      if (artist) artist.textContent = estado.currentTrack.artista;
    } else {
      if (badge) badge.textContent = 'Sin pistas';
      if (title) title.textContent = 'Reproductor listo';
      if (artist) artist.textContent = 'Toca "+ Agregar canción" para sumar música';
    }

    if (timeCurrent) timeCurrent.textContent = this.formatTime(estado.currentTime);
    if (timeTotal) timeTotal.textContent = this.formatTime(estado.duration);

    if (progressBar && estado.duration > 0) {
      const pct = (estado.currentTime / estado.duration) * 100;
      progressBar.style.width = `${pct}%`;
    }
  }

  private formatTime(segundos: number): string {
    if (isNaN(segundos) || segundos <= 0) return '0:00';
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  destroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
