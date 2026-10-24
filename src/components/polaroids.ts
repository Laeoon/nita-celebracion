import { store } from '../services/store/appStore';
import { audioPlayer } from '../services/audio/player';
import { SessionService } from '../services/auth/session';
import { comprimirImagenEnCliente } from '../services/image/compressor';
import { recortarAudioEnCliente } from '../services/audio/cutter';
import { showToast } from './toast';
import type { Recuerdo, CategoriaRecuerdo } from '../types';

export class PolaroidsComponent {
  private container: HTMLElement;
  private previewAudio: HTMLAudioElement = new Audio();
  private previewInterval: number | null = null;
  private selectedAudioFile: File | null = null;
  private selectedPhotoBlob: Blob | null = null;
  private trimmerAudioDuration: number = 0;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró #${containerId}`);
    this.container = el;

    this.render();
    this.bindEvents();

    store.subscribe(() => this.actualizarLista());
    audioPlayer.subscribe(() => this.actualizarMiniPlayers());
  }

  private render(): void {
    const usuario = SessionService.getUsuario();

    this.container.innerHTML = `
      <section class="space-y-6" id="recuerdos">
        <!-- Encabezado de galería y filtros -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-xl font-serif font-bold text-white tracking-wide">Galería Polaroid</h3>
            <p class="text-xs text-neutral-400">Momentos espontáneos con audio exclusivo de 30 segundos</p>
          </div>

          <!-- Filtros de categoría -->
          <div class="flex flex-wrap gap-1.5" id="polaroid-filters">
            <button data-cat="todas" class="px-3 py-1 rounded-full text-[11px] font-medium btn-primary">Todas</button>
            <button data-cat="rumba" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary">La Rumba</button>
            <button data-cat="grupo" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary">El Grupo</button>
            <button data-cat="brindis" class="px-3 py-1 rounded-full text-[11px] font-medium btn-secondary">Brindis y Locuras</button>
          </div>
        </div>

        <!-- Formulario para subir nueva foto Polaroid -->
        <div class="glass-panel rounded-3xl p-5 sm:p-6 shadow-glass border border-white/10" id="formulario-recuerdo">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <h4 class="text-sm font-semibold text-champagne-300 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>Subir una foto Polaroid</span>
            </h4>
            <span class="text-[10px] text-neutral-400 font-mono">Optimización móvil automática</span>
          </div>

          <form id="form-subir-polaroid" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Selección y vista previa de foto -->
              <div class="space-y-2">
                <label class="block text-xs font-medium text-neutral-300">1. Selecciona la foto</label>
                <div id="drop-foto-area" class="border-2 border-dashed border-white/15 hover:border-champagne-400/40 rounded-2xl p-4 text-center cursor-pointer transition bg-white/[0.02] flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden">
                  <div id="preview-foto-wrapper" class="hidden absolute inset-0">
                    <img id="preview-foto-img" class="w-full h-full object-cover" />
                    <button type="button" id="btn-remover-foto" class="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full text-xs">✕</button>
                  </div>
                  <div id="placeholder-foto" class="space-y-1.5 pointer-events-none">
                    <svg class="w-8 h-8 text-neutral-400 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    </svg>
                    <p class="text-xs text-neutral-300 font-medium">Toca para elegir foto</p>
                    <p class="text-[10px] text-neutral-500">Se comprime en tu teléfono al instante</p>
                  </div>
                  <input type="file" id="input-foto-polaroid" accept="image/*" class="hidden" />
                </div>
              </div>

              <!-- Metadatos de la tarjeta -->
              <div class="space-y-3">
                ${!usuario ? `
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[11px] text-neutral-300 mb-1">Tu Nombre</label>
                      <input id="input-polaroid-autor" type="text" required placeholder="Ej. Andrea" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-neutral-300 mb-1">Apodo (Opcional)</label>
                      <input id="input-polaroid-apodo" type="text" placeholder="Ej. La Cómplice" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                    </div>
                  </div>
                ` : `
                  <div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                    <span class="text-neutral-400">Publicando como:</span>
                    <span class="font-semibold text-champagne-300">${usuario.nombre} ${usuario.apodo ? `(${usuario.apodo})` : ''}</span>
                  </div>
                `}

                <div>
                  <label class="block text-[11px] text-neutral-300 mb-1">Título o Momento</label>
                  <input id="input-polaroid-titulo" type="text" required placeholder="Ej. El tequila que no debió ser" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] text-neutral-300 mb-1">Categoría</label>
                    <select id="select-polaroid-categoria" class="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400">
                      <option value="rumba">La Rumba</option>
                      <option value="grupo">El Grupo</option>
                      <option value="brindis">Brindis y Locuras</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] text-neutral-300 mb-1">Fecha o Lugar</label>
                    <input id="input-polaroid-lugar" type="text" placeholder="Ej. Playa El Yaque" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] text-neutral-300 mb-1">Anécdota / Historia corta</label>
                  <textarea id="input-polaroid-historia" rows="2" placeholder="Cuenta el chisme o lo que pasó ese día..." class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400"></textarea>
                </div>
              </div>
            </div>

            <!-- Recortador de audio de 30 segundos -->
            <div class="border border-champagne-400/20 rounded-2xl p-4 bg-champagne-400/[0.02] space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="text-xs font-semibold text-champagne-300 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                    <span>2. Canción de fondo (Recorte de 30s)</span>
                  </h5>
                  <p class="text-[10px] text-neutral-400">Adjunta una canción especial que sonará al ver tu Polaroid</p>
                </div>
                <label class="cursor-pointer px-3 py-1.5 rounded-xl btn-secondary text-xs flex items-center gap-1.5 font-medium">
                  <span>Elegir MP3</span>
                  <input type="file" id="input-audio-polaroid" accept="audio/*" class="hidden" />
                </label>
              </div>

              <!-- Controles deslizantes del recortador (aparece al elegir audio) -->
              <div id="trimmer-controls" class="hidden space-y-3 pt-2 border-t border-white/10">
                <div class="flex items-center justify-between text-xs">
                  <span id="trimmer-track-name" class="font-semibold text-white truncate max-w-[200px]">Canción seleccionada</span>
                  <button type="button" id="btn-preescucha-trimmer" class="px-2.5 py-1 rounded-lg btn-secondary text-[11px] flex items-center gap-1 text-champagne-300">
                    <span id="trimmer-btn-text">Escuchar 30s</span>
                  </button>
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between text-[10px] text-neutral-400 font-mono">
                    <span>Inicio: <strong id="trimmer-start-val" class="text-champagne-300">0:00</strong></span>
                    <span>Duración: <strong class="text-white">30 seg</strong></span>
                    <span>Fin: <strong id="trimmer-end-val" class="text-champagne-300">0:30</strong></span>
                  </div>
                  <input type="range" id="trimmer-slider" min="0" max="100" value="0" step="1" class="w-full accent-champagne-400 cursor-pointer" />
                </div>
              </div>
            </div>

            <!-- Botón de publicar -->
            <button type="submit" id="btn-submit-polaroid" class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle flex items-center justify-center gap-2">
              <span>Publicar Polaroid</span>
            </button>
          </form>
        </div>

        <!-- Grid de tarjetas Polaroid publicadas -->
        <div id="polaroid-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <!-- Renderizado dinámico -->
        </div>
      </section>
    `;
  }

  private bindEvents(): void {
    const filters = document.getElementById('polaroid-filters');
    const fotoArea = document.getElementById('drop-foto-area');
    const fotoInput = document.getElementById('input-foto-polaroid') as HTMLInputElement;
    const btnRemover = document.getElementById('btn-remover-foto');
    const audioInput = document.getElementById('input-audio-polaroid') as HTMLInputElement;
    const trimmerSlider = document.getElementById('trimmer-slider') as HTMLInputElement;
    const btnPreescucha = document.getElementById('btn-preescucha-trimmer');
    const form = document.getElementById('form-subir-polaroid') as HTMLFormElement;

    // Filtros
    filters?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (!btn) return;
      const cat = btn.getAttribute('data-cat') as CategoriaRecuerdo;
      if (cat) {
        store.setFiltro(cat);
        filters.querySelectorAll('button').forEach((b) => {
          b.className = b === btn ? 'px-3 py-1 rounded-full text-[11px] font-medium btn-primary' : 'px-3 py-1 rounded-full text-[11px] font-medium btn-secondary';
        });
      }
    });

    // Subir y comprimir foto
    fotoArea?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'btn-remover-foto') return;
      fotoInput.click();
    });

    fotoInput?.addEventListener('change', async () => {
      const file = fotoInput.files?.[0];
      if (!file) return;

      try {
        showToast('Comprimiendo foto para optimizar carga móvil...', 'info');
        const compressedBlob = await comprimirImagenEnCliente(file, 1200, 0.82);
        this.selectedPhotoBlob = compressedBlob;

        const previewImg = document.getElementById('preview-foto-img') as HTMLImageElement;
        const previewWrap = document.getElementById('preview-foto-wrapper');
        const placeholder = document.getElementById('placeholder-foto');

        if (previewImg && previewWrap && placeholder) {
          previewImg.src = URL.createObjectURL(compressedBlob);
          previewWrap.classList.remove('hidden');
          placeholder.classList.add('hidden');
        }
        showToast('Foto lista y optimizada', 'exito');
      } catch (err) {
        console.error(err);
        showToast('Error al procesar la foto', 'alerta');
      }
    });

    btnRemover?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedPhotoBlob = null;
      fotoInput.value = '';
      const previewWrap = document.getElementById('preview-foto-wrapper');
      const placeholder = document.getElementById('placeholder-foto');
      previewWrap?.classList.add('hidden');
      placeholder?.classList.remove('hidden');
    });

    // Audio input y trimmer
    audioInput?.addEventListener('change', () => {
      const file = audioInput.files?.[0];
      if (!file) return;
      this.selectedAudioFile = file;

      const trimmerControls = document.getElementById('trimmer-controls');
      const trimmerName = document.getElementById('trimmer-track-name');
      trimmerControls?.classList.remove('hidden');
      if (trimmerName) trimmerName.textContent = file.name;

      // Obtener duración del audio
      const tempAudio = new Audio(URL.createObjectURL(file));
      tempAudio.addEventListener('loadedmetadata', () => {
        this.trimmerAudioDuration = Math.floor(tempAudio.duration) || 120;
        if (trimmerSlider) {
          trimmerSlider.max = String(Math.max(0, this.trimmerAudioDuration - 30));
          trimmerSlider.value = '0';
          this.actualizarTrimmerLabels(0);
        }
      });
    });

    trimmerSlider?.addEventListener('input', () => {
      const val = Number(trimmerSlider.value);
      this.actualizarTrimmerLabels(val);
      if (!this.previewAudio.paused) {
        this.previewAudio.currentTime = val;
      }
    });

    btnPreescucha?.addEventListener('click', () => {
      if (!this.selectedAudioFile) return;

      if (!this.previewAudio.paused) {
        this.detenerPreescucha();
        return;
      }

      // Detener otros reproductores
      audioPlayer.pause();
      audioPlayer.detenerPolaroidAudio();

      const start = Number(trimmerSlider.value) || 0;
      this.previewAudio.src = URL.createObjectURL(this.selectedAudioFile);
      this.previewAudio.currentTime = start;
      this.previewAudio.play().then(() => {
        const btnText = document.getElementById('trimmer-btn-text');
        if (btnText) btnText.textContent = 'Detener';

        this.previewInterval = window.setInterval(() => {
          if (this.previewAudio.currentTime >= start + 30 || this.previewAudio.ended) {
            this.detenerPreescucha();
          }
        }, 150);
      });
    });

    // Envío del formulario
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.selectedPhotoBlob) {
        showToast('Por favor selecciona una foto para la Polaroid', 'alerta');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-polaroid') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Procesando y optimizando...</span>';

      try {
        const usuarioSesion = SessionService.getUsuario();
        const autorNombre = usuarioSesion ? usuarioSesion.nombre : (document.getElementById('input-polaroid-autor') as HTMLInputElement).value;
        const autorApodo = usuarioSesion ? usuarioSesion.apodo : (document.getElementById('input-polaroid-apodo') as HTMLInputElement)?.value;
        const titulo = (document.getElementById('input-polaroid-titulo') as HTMLInputElement).value;
        const categoria = (document.getElementById('select-polaroid-categoria') as HTMLSelectElement).value as 'rumba' | 'grupo' | 'brindis';
        const fechaLugar = (document.getElementById('input-polaroid-lugar') as HTMLInputElement).value || '29 de Octubre';
        const historia = (document.getElementById('input-polaroid-historia') as HTMLTextAreaElement).value;

        // Foto URL local o blob
        const fotoUrl = URL.createObjectURL(this.selectedPhotoBlob);

        // Recorte físico de audio si seleccionó canción
        let audioClipUrl: string | undefined = undefined;
        let cancionTitulo: string | undefined = undefined;

        if (this.selectedAudioFile) {
          showToast('Recortando físicamente 30s de audio...', 'info');
          const startSec = Number(trimmerSlider.value) || 0;
          const wavBlob = await recortarAudioEnCliente(this.selectedAudioFile, startSec, 30);
          audioClipUrl = URL.createObjectURL(wavBlob);
          cancionTitulo = this.selectedAudioFile.name.replace(/\.[^/.]+$/, '');
        }

        const nuevoRecuerdo: Recuerdo = {
          id: 'polaroid-' + Date.now(),
          usuarioId: usuarioSesion?.id,
          autorNombre,
          autorApodo,
          titulo,
          categoria,
          fechaLugar,
          historia,
          fotoUrl,
          audioClipUrl,
          cancionTitulo,
          clipInicio: 0, // Como ya está recortado físicamente a 30s, inicia en 0
          clipDuracion: 30,
          reaccionesCount: 0,
          tieneMiReaccion: false,
          creadoEn: new Date().toISOString(),
        };

        store.agregarRecuerdo(nuevoRecuerdo);
        showToast('¡Polaroid publicada con éxito!', 'exito');

        // Limpiar formulario
        form.reset();
        this.selectedPhotoBlob = null;
        this.selectedAudioFile = null;
        btnRemover?.click();
        document.getElementById('trimmer-controls')?.classList.add('hidden');
      } catch (err) {
        console.error(err);
        showToast('Error al publicar la tarjeta', 'alerta');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Publicar Polaroid</span>';
      }
    });

    this.actualizarLista();
  }

  private actualizarTrimmerLabels(start: number): void {
    const startEl = document.getElementById('trimmer-start-val');
    const endEl = document.getElementById('trimmer-end-val');
    if (startEl) startEl.textContent = this.formatTime(start);
    if (endEl) endEl.textContent = this.formatTime(start + 30);
  }

  private detenerPreescucha(): void {
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
      this.previewInterval = null;
    }
    this.previewAudio.pause();
    const btnText = document.getElementById('trimmer-btn-text');
    if (btnText) btnText.textContent = 'Escuchar 30s';
  }

  private actualizarLista(): void {
    const grid = document.getElementById('polaroid-grid');
    if (!grid) return;

    const recuerdos = store.getRecuerdosFiltrados();
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    if (!recuerdos.length) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 glass-panel rounded-3xl border border-white/5">
          <p class="text-sm text-neutral-400 font-light">Aún no hay fotos en esta categoría.</p>
          <p class="text-xs text-champagne-300/70 mt-1">¡Sé el primero en subir un recuerdo para Mariana!</p>
        </div>
      `;
      return;
    }

    // Ángulos sutiles para dar sensación física realista de Polaroid sobre mesa
    const tilts = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];

    grid.innerHTML = recuerdos.map((r, i) => {
      const tilt = tilts[i % tilts.length];
      const puedeBorrar = esAdmin || (usuario && usuario.id === r.usuarioId);

      return `
        <div class="polaroid-card rounded-2xl p-4 sm:p-5 text-neutral-900 ${tilt} transform transition-all duration-300 relative group" id="card-${r.id}">
          <!-- Foto con marco blanco característico Polaroid -->
          <div class="w-full aspect-square bg-neutral-200 rounded-xl overflow-hidden shadow-inner relative mb-3.5">
            <img src="${r.fotoUrl}" alt="${r.titulo}" class="w-full h-full object-cover" loading="lazy" />

            <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider text-champagne-300 border border-white/10">
              ${r.categoria}
            </span>

            ${puedeBorrar ? `
              <button data-delete-id="${r.id}" class="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow" title="Eliminar foto">
                ✕
              </button>
            ` : ''}
          </div>

          <!-- Metadatos de la tarjeta -->
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-serif font-bold text-base text-neutral-900 leading-snug">${r.titulo}</h4>
              <span class="text-[10px] text-neutral-500 font-mono flex-shrink-0">${r.fechaLugar || '29 Oct'}</span>
            </div>

            ${r.historia ? `
              <p class="text-xs text-neutral-700 italic font-serif leading-relaxed line-clamp-3">“${r.historia}”</p>
            ` : ''}

            <!-- Mini reproductor de 30 segundos -->
            ${r.audioClipUrl ? `
              <div class="bg-neutral-900 rounded-xl p-2.5 text-white flex items-center gap-2.5 shadow" data-polaroid-player="${r.id}">
                <button data-play-clip="${r.id}" class="w-8 h-8 rounded-full bg-champagne-400 text-neutral-950 flex items-center justify-center flex-shrink-0 shadow hover:bg-champagne-300 transition">
                  <svg data-clip-icon="${r.id}" class="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between text-[10px] font-mono text-champagne-300/90 mb-1">
                    <span class="truncate">${r.cancionTitulo || 'Momento 30s'}</span>
                    <span data-clip-time="${r.id}">0:30</span>
                  </div>
                  <div class="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div data-clip-bar="${r.id}" class="h-full bg-champagne-400 w-0 transition-all duration-100"></div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Pie de la Polaroid: autor y reacciones -->
            <div class="pt-2 border-t border-neutral-300 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-neutral-600 font-medium">
                <span>Por</span>
                <strong class="text-neutral-900">${r.autorNombre}</strong>
                ${r.autorApodo ? `<span class="text-[11px] text-neutral-500 font-normal">(${r.autorApodo})</span>` : ''}
              </div>

              <!-- Botón de reacción Brindis/Salud -->
              <button data-reaccionar-id="${r.id}" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${r.tieneMiReaccion ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'} text-xs font-semibold transition">
                <svg class="w-3.5 h-3.5 ${r.tieneMiReaccion ? 'text-amber-600 fill-amber-500' : 'text-neutral-500'}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M4.5 9.5a4 4 0 008 0V4H4.5v5.5zM12.5 9.5a4 4 0 008 0V4h-8v5.5zM8.5 13.5v7m7-7v7M6 21h12" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span>${r.reaccionesCount || 0}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Asignar eventos de cards
    grid.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (id && confirm('¿Deseas eliminar esta Polaroid?')) {
          store.eliminarRecuerdo(id);
          showToast('Polaroid eliminada', 'info');
        }
      });
    });

    grid.querySelectorAll('[data-play-clip]').forEach((btn) => {
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

    grid.querySelectorAll('[data-reaccionar-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-reaccionar-id');
        if (id) {
          store.toggleReaccion('recuerdo', id);
        }
      });
    });
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
  }

  private formatTime(seg: number): string {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
