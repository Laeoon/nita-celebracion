import { audioPlayer } from '../services/audio/player';
import { store } from '../services/store/appStore';
import { SessionService } from '../services/auth/session';
import { showToast } from './toast';

export class PlayerComponent {
  private container: HTMLElement;
  private animFrameId: number | null = null;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró el elemento #${containerId}`);
    this.container = el;

    this.render();
    this.iniciarAnimacionOndas();

    // Re-renderizar o actualizar ante cambios de estado
    audioPlayer.subscribe(() => this.actualizarUI());
    store.subscribe(() => this.actualizarUI());
  }

  public render(): void {
    this.container.innerHTML = `
      <section id="musica" class="scroll-mt-28 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-serif font-bold text-white tracking-wide">Reproductor Musical</h3>
            <p class="text-[11px] text-neutral-400">Playlist oficial seleccionada para la fiesta</p>
          </div>
          <button id="btn-toggle-mute" class="px-3 py-1 rounded-full btn-secondary text-[11px] font-medium flex items-center gap-1.5 transition">
            <svg id="icon-mute" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M15.54 8.46a5 5 0 010 7.07" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span id="label-mute">Sonido</span>
          </button>
        </div>

        <!-- Tarjeta del reproductor -->
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
                  Sin pistas
                </span>
              </div>
              <h4 id="track-title" class="text-sm font-semibold text-white truncate">
                Reproductor listo
              </h4>
              <p id="track-artist" class="text-[11px] text-neutral-400 truncate">
                Toca "Agregar canción" para sumar música a la fiesta
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

            <!-- Botón para subir música libre para todo el grupo -->
            <label class="cursor-pointer px-3.5 py-1.5 rounded-xl btn-secondary text-xs flex items-center gap-1.5 font-medium border-champagne-400/30 text-champagne-300 hover:border-champagne-300 hover:bg-champagne-400/10 transition shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span>Agregar canción</span>
              <input id="input-subir-mp3" type="file" accept="audio/mp3,audio/mpeg,audio/*" multiple class="hidden" />
            </label>
          </div>
        </div>
      </section>
    `;

    this.bindEvents();
    this.actualizarUI();
  }

  private bindEvents(): void {
    const playBtn = document.getElementById('btn-play-pause');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const muteBtn = document.getElementById('btn-toggle-mute');
    const progressContainer = document.getElementById('progress-container');
    const mp3Input = document.getElementById('input-subir-mp3') as HTMLInputElement | null;

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

    mp3Input?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || !files.length) return;

      const usuario = SessionService.getUsuario();
      const autorTexto = usuario ? `Sumada por ${usuario.nombre}` : 'Mariana “Nita” • Fiesta';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const audioUrl = URL.createObjectURL(file);
        // Extraer nombre limpio sin extensión
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        store.agregarTrack({
          id: 'track-' + Date.now() + '-' + i,
          titulo: cleanName,
          artista: autorTexto,
          audioUrl: audioUrl,
        });
      }

      showToast(`Se agregaron ${files.length} canción(es) a la playlist`, 'exito');
      this.actualizarUI();
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
      if (artist) artist.textContent = 'Agrega pistas MP3 para comenzar';
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
