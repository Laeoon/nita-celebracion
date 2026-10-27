import { store } from '../services/store/appStore';
import { SessionService } from '../services/auth/session';
import { comprimirImagenEnCliente } from '../services/image/compressor';
import { recortarAudioEnCliente } from '../services/audio/cutter';
import { SupabaseService } from '../services/supabase/client';
import { audioPlayer } from '../services/audio/player';
import { showToast } from './toast';
import type { Recuerdo, Dedicatoria } from '../types';

export class PublishModalComponent {
  private overlay: HTMLElement;
  private currentMode: 'selector' | 'polaroid' | 'dedicatoria' = 'selector';
  private selectedPhotoBlob: Blob | null = null;
  private selectedAudioFile: File | null = null;
  private previewAudio: HTMLAudioElement = new Audio();
  private trimmerDuration: number = 0;
  private onPublishSuccess: () => void;

  constructor(onPublishSuccess: () => void) {
    this.onPublishSuccess = onPublishSuccess;
    this.overlay = document.createElement('div');
    this.overlay.id = 'publish-modal-overlay';
    this.overlay.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300';
    document.body.appendChild(this.overlay);

    audioPlayer.registrarPreviewAudio(this.previewAudio);

    this.previewAudio.onpause = () => {
      const btn = document.getElementById('btn-modal-preview-trimmer');
      if (btn) btn.textContent = 'Escuchar 30s';
    };
  }

  abrir(modoInicial: 'selector' | 'polaroid' | 'dedicatoria' = 'selector'): void {
    this.currentMode = modoInicial;
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('flex');
    this.render();
  }

  cerrar(): void {
    this.detenerPreviewAudio();
    this.overlay.classList.remove('flex');
    this.overlay.classList.add('hidden');
    this.overlay.innerHTML = '';
    this.selectedPhotoBlob = null;
    this.selectedAudioFile = null;
  }

  private detenerPreviewAudio(): void {
    this.previewAudio.pause();
    this.previewAudio.ontimeupdate = null;
    this.previewAudio.currentTime = 0;
    const btn = document.getElementById('btn-modal-preview-trimmer');
    if (btn) btn.textContent = 'Escuchar 30s';
  }

  private render(): void {
    const usuario = SessionService.getUsuario();

    this.overlay.innerHTML = `
      <div class="glass-panel-elevated w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto no-scrollbar transform transition-transform duration-300">
        <!-- Barra de arrastre superior para móvil -->
        <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden"></div>

        <button id="btn-cerrar-publish-modal" class="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm p-2" title="Cerrar">✕</button>

        ${this.currentMode === 'selector' ? this.renderSelector() : ''}
        ${this.currentMode === 'polaroid' ? this.renderPolaroidForm(usuario) : ''}
        ${this.currentMode === 'dedicatoria' ? this.renderDedicatoriaForm(usuario) : ''}
      </div>
    `;

    document.getElementById('btn-cerrar-publish-modal')?.addEventListener('click', () => this.cerrar());
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.cerrar();
    };

    if (this.currentMode === 'selector') {
      document.getElementById('opt-subir-polaroid')?.addEventListener('click', () => {
        this.currentMode = 'polaroid';
        this.render();
      });
      document.getElementById('opt-subir-dedicatoria')?.addEventListener('click', () => {
        this.currentMode = 'dedicatoria';
        this.render();
      });
    } else if (this.currentMode === 'polaroid') {
      this.bindPolaroidEvents();
    } else if (this.currentMode === 'dedicatoria') {
      this.bindDedicatoriaEvents();
    }
  }

  private renderSelector(): string {
    return `
      <div class="space-y-4 text-center py-2">
        <div>
          <h3 class="text-lg font-serif font-bold text-white tracking-wide">Compartir en la Celebración</h3>
          <p class="text-xs text-neutral-400 mt-0.5">Elige qué deseas publicar para Mariana</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button id="opt-subir-polaroid" class="p-5 rounded-2xl glass-panel border border-champagne-400/30 hover:border-champagne-300 transition text-left space-y-2 group">
            <span class="text-xs uppercase font-mono tracking-widest text-champagne-300 font-semibold block">Galería</span>
            <h4 class="text-sm font-semibold text-white group-hover:text-champagne-200">Foto Polaroid</h4>
            <p class="text-[11px] text-neutral-400 leading-relaxed">Sube una foto del carrete con canción de fondo de 30 segundos.</p>
          </button>

          <button id="opt-subir-dedicatoria" class="p-5 rounded-2xl glass-panel border border-white/10 hover:border-champagne-400/40 transition text-left space-y-2 group">
            <span class="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold block">Muro</span>
            <h4 class="text-sm font-semibold text-white group-hover:text-champagne-200">Dedicatoria</h4>
            <p class="text-[11px] text-neutral-400 leading-relaxed">Deja un mensaje, anécdota o buenos deseos en el muro del grupo.</p>
          </button>
        </div>
      </div>
    `;
  }

  private renderPolaroidForm(usuario: ReturnType<typeof SessionService.getUsuario>): string {
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <span class="text-[10px] uppercase font-mono text-champagne-300 tracking-wider">Nueva Publicación</span>
            <h3 class="text-base font-serif font-bold text-white">Subir Foto Polaroid</h3>
          </div>
          <button id="btn-volver-selector" class="text-xs text-neutral-400 hover:text-champagne-300">Cambiar</button>
        </div>

        <form id="form-modal-polaroid" class="space-y-3.5">
          <!-- Foto Picker -->
          <div id="drop-foto-modal" class="border-2 border-dashed border-white/15 hover:border-champagne-400/40 rounded-2xl p-4 text-center cursor-pointer transition bg-white/[0.02] flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
            <div id="preview-foto-modal-wrap" class="hidden absolute inset-0">
              <img id="preview-foto-modal-img" class="w-full h-full object-cover" />
              <button type="button" id="btn-remover-foto-modal" class="absolute top-2 right-2 bg-black/75 hover:bg-black text-white p-1 rounded-full text-xs">✕</button>
            </div>
            <div id="placeholder-foto-modal" class="space-y-1 pointer-events-none">
              <p class="text-xs text-neutral-200 font-medium">Toca para seleccionar foto</p>
              <p class="text-[10px] text-neutral-500">Se optimiza automáticamente</p>
            </div>
            <input type="file" id="input-foto-modal" accept="image/*" class="hidden" />
          </div>

          ${usuario ? `
            <div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
              <span class="text-neutral-400">Publicando como:</span>
              <span class="font-semibold text-champagne-300">${usuario.nombre} ${usuario.apodo ? `(${usuario.apodo})` : ''}</span>
            </div>
          ` : `
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="modal-polaroid-autor" required placeholder="Tu Nombre (ej. Wilmer)" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
              <input type="text" id="modal-polaroid-apodo" placeholder="Apodo (ej. Lawi)" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
            </div>
          `}

          <div>
            <label class="block text-[11px] text-neutral-300 mb-1">Título o Momento</label>
            <input type="text" id="modal-polaroid-titulo" required placeholder="Ej. Cuando wilmer se perdio" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] text-neutral-300 mb-1">Categoría <span class="text-champagne-400">*</span></label>
              <select id="modal-polaroid-categoria" required class="w-full bg-neutral-900 border border-champagne-400/30 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-champagne-400 cursor-pointer">
                <option value="" disabled selected>-- Categoría obligatoria --</option>
                <option value="rumba">La Rumba</option>
                <option value="grupo">El Grupo</option>
                <option value="tomaderas">Tomaderas y Locuras</option>
                <option value="viajes">Viajes y Playa</option>
                <option value="infraganti">Momentos Infraganti y Fails</option>
                <option value="nita">Con la Cumpleañera</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] text-neutral-300 mb-1">Lugar o Fecha</label>
              <input type="text" id="modal-polaroid-lugar" placeholder="Ej. Cata" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
            </div>
          </div>

          <div>
            <label class="block text-[11px] text-neutral-300 mb-1">Anécdota / Historia corta</label>
            <textarea id="modal-polaroid-historia" rows="2" placeholder="Wilmer se perdio en la playa... que mas voy a agregar" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400"></textarea>
          </div>

          <!-- Recortador de audio 30s -->
          <div class="border border-champagne-400/20 rounded-2xl p-3 bg-champagne-400/[0.02] space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-champagne-300 block">Canción de fondo (30s)</span>
                <span class="text-[10px] text-neutral-400">Opcional para que suene con la foto</span>
              </div>
              <label class="cursor-pointer px-3 py-1.5 rounded-xl btn-secondary text-xs font-medium">
                <span>Elegir MP3</span>
                <input type="file" id="modal-audio-input" accept="audio/*" class="hidden" />
              </label>
            </div>

            <div id="modal-trimmer-controls" class="hidden space-y-2 pt-1 border-t border-white/10">
              <div class="flex items-center justify-between text-xs">
                <span id="modal-trimmer-name" class="font-semibold text-white truncate max-w-[180px]">Canción</span>
                <button type="button" id="btn-modal-preview-trimmer" class="px-2.5 py-1 rounded-lg btn-secondary text-[11px] text-champagne-300">
                  Escuchar 30s
                </button>
              </div>

              <div class="relative w-full h-10 bg-black/50 rounded-xl border border-white/10 overflow-hidden flex items-center px-1 select-none">
                <div class="absolute inset-0 flex items-center justify-between px-2 opacity-20 pointer-events-none">
                  ${Array.from({ length: 36 }).map((_, i) => `
                    <span class="w-1 bg-white rounded-full" style="height: ${Math.round((Math.sin(i * 0.5) * 0.5 + 0.5) * 20 + 4)}px"></span>
                  `).join('')}
                </div>
                <div id="modal-trimmer-window" class="absolute top-1 bottom-1 border-2 border-champagne-400 bg-champagne-400/25 rounded-lg shadow-champagne-glow pointer-events-none" style="left: 0%; width: 25%;">
                  <div id="modal-trimmer-playhead" class="absolute top-0 bottom-0 w-1 bg-white rounded-full" style="left: 0%;"></div>
                </div>
              </div>

              <input type="range" id="modal-trimmer-slider" min="0" max="100" value="0" step="0.5" class="w-full accent-champagne-400 cursor-pointer" />

              <div class="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span id="modal-trimmer-start">0:00</span>
                <span id="modal-trimmer-prog" class="text-white">0:00 / 0:30</span>
                <span id="modal-trimmer-end">0:30</span>
              </div>
            </div>
          </div>

          <button type="submit" id="btn-modal-submit-polaroid" class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle">
            Publicar Polaroid
          </button>
        </form>
      </div>
    `;
  }

  private renderDedicatoriaForm(usuario: ReturnType<typeof SessionService.getUsuario>): string {
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <span class="text-[10px] uppercase font-mono text-champagne-300 tracking-wider">Nuevo Mensaje</span>
            <h3 class="text-base font-serif font-bold text-white">Escribir Dedicatoria</h3>
          </div>
          <button id="btn-volver-selector-ded" class="text-xs text-neutral-400 hover:text-champagne-300">Cambiar</button>
        </div>

        <form id="form-modal-dedicatoria" class="space-y-3.5">
          ${usuario ? `
            <div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
              <span class="text-neutral-400">Escribiendo como:</span>
              <span class="font-semibold text-champagne-300">${usuario.nombre} ${usuario.apodo ? `(${usuario.apodo})` : ''}</span>
            </div>
          ` : `
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="modal-ded-autor" required placeholder="Tu Nombre (ej. Wilmer)" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
              <input type="text" id="modal-ded-apodo" placeholder="Apodo (ej. Lawi)" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
            </div>
          `}

          <div>
            <label class="block text-[11px] text-neutral-300 mb-1">Tu Mensaje para Mariana</label>
            <textarea id="modal-ded-mensaje" rows="4" required placeholder="Escribe aquí tus mejores deseos, anécdotas o palabras de cariño..." class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-champagne-400"></textarea>
          </div>

          <button type="submit" id="btn-modal-submit-dedicatoria" class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle">
            Publicar en el Muro
          </button>
        </form>
      </div>
    `;
  }

  private bindPolaroidEvents(): void {
    document.getElementById('btn-volver-selector')?.addEventListener('click', () => {
      this.currentMode = 'selector';
      this.render();
    });

    const fotoArea = document.getElementById('drop-foto-modal');
    const fotoInput = document.getElementById('input-foto-modal') as HTMLInputElement;
    const btnRemover = document.getElementById('btn-remover-foto-modal');
    const audioInput = document.getElementById('modal-audio-input') as HTMLInputElement;
    const trimmerSlider = document.getElementById('modal-trimmer-slider') as HTMLInputElement;
    const btnPreview = document.getElementById('btn-modal-preview-trimmer');
    const form = document.getElementById('form-modal-polaroid') as HTMLFormElement;

    fotoArea?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'btn-remover-foto-modal') return;
      fotoInput.click();
    });

    fotoInput?.addEventListener('change', async () => {
      const file = fotoInput.files?.[0];
      if (!file) return;

      try {
        showToast('Comprimiendo foto para el móvil...', 'info');
        const compressedBlob = await comprimirImagenEnCliente(file, 1200, 0.82);
        this.selectedPhotoBlob = compressedBlob;

        const previewImg = document.getElementById('preview-foto-modal-img') as HTMLImageElement;
        const previewWrap = document.getElementById('preview-foto-modal-wrap');
        const placeholder = document.getElementById('placeholder-foto-modal');

        if (previewImg && previewWrap && placeholder) {
          previewImg.src = URL.createObjectURL(compressedBlob);
          previewWrap.classList.remove('hidden');
          placeholder.classList.add('hidden');
        }
      } catch (err) {
        console.error(err);
        showToast('Error al procesar la foto', 'alerta');
      }
    });

    btnRemover?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedPhotoBlob = null;
      fotoInput.value = '';
      document.getElementById('preview-foto-modal-wrap')?.classList.add('hidden');
      document.getElementById('placeholder-foto-modal')?.classList.remove('hidden');
    });

    audioInput?.addEventListener('change', () => {
      const file = audioInput.files?.[0];
      if (!file) return;
      this.selectedAudioFile = file;

      const controls = document.getElementById('modal-trimmer-controls');
      const nameEl = document.getElementById('modal-trimmer-name');
      controls?.classList.remove('hidden');
      if (nameEl) nameEl.textContent = file.name;

      this.detenerPreviewAudio();
      this.previewAudio.src = URL.createObjectURL(file);

      this.previewAudio.onloadedmetadata = () => {
        this.trimmerDuration = Math.max(30, this.previewAudio.duration || 120);
        if (trimmerSlider) {
          trimmerSlider.max = String(Math.max(0, this.trimmerDuration - 30));
          trimmerSlider.value = '0';
          this.actualizarTrimmerLabels(0);
        }
      };
    });

    trimmerSlider?.addEventListener('input', () => {
      const val = Number(trimmerSlider.value);
      this.actualizarTrimmerLabels(val);
      if (!this.previewAudio.paused) {
        this.previewAudio.currentTime = val;
      }
    });

    btnPreview?.addEventListener('click', () => {
      if (!this.selectedAudioFile) return;

      if (!this.previewAudio.paused) {
        this.detenerPreviewAudio();
        return;
      }

      audioPlayer.detenerTodo();

      const start = Number(trimmerSlider.value) || 0;
      this.previewAudio.currentTime = start;
      const playhead = document.getElementById('modal-trimmer-playhead');
      const progEl = document.getElementById('modal-trimmer-prog');

      btnPreview.textContent = 'Detener';

      this.previewAudio.ontimeupdate = () => {
        const current = this.previewAudio.currentTime;
        const elapsed = Math.max(0, current - start);
        const pct = Math.min(100, Math.max(0, (elapsed / 30) * 100));

        if (playhead) playhead.style.left = `${pct}%`;
        if (progEl) progEl.textContent = `${this.formatTime(Math.min(30, elapsed))} / 0:30`;

        if (current >= start + 30 || this.previewAudio.ended) {
          this.detenerPreviewAudio();
          this.previewAudio.currentTime = start;
        }
      };

      this.previewAudio.play().catch(() => this.detenerPreviewAudio());
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.selectedPhotoBlob) {
        showToast('Debes seleccionar una foto para la Polaroid', 'alerta');
        return;
      }

      const selectCat = document.getElementById('modal-polaroid-categoria') as HTMLSelectElement;
      const categoria = selectCat.value;
      if (!categoria) {
        showToast('Debes elegir una categoría obligatoria', 'alerta');
        selectCat.focus();
        return;
      }

      const submitBtn = document.getElementById('btn-modal-submit-polaroid') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Subiendo a la nube...</span>';

      try {
        const usuario = SessionService.getUsuario();
        const autorNombre = usuario ? usuario.nombre : (document.getElementById('modal-polaroid-autor') as HTMLInputElement).value;
        const autorApodo = usuario ? usuario.apodo : (document.getElementById('modal-polaroid-apodo') as HTMLInputElement)?.value;
        const titulo = (document.getElementById('modal-polaroid-titulo') as HTMLInputElement).value;
        const fechaLugar = (document.getElementById('modal-polaroid-lugar') as HTMLInputElement).value || '29 de Octubre';
        const historia = (document.getElementById('modal-polaroid-historia') as HTMLTextAreaElement).value;

        showToast('Subiendo foto a Supabase...', 'info');
        const cloudFoto = await SupabaseService.subirFoto(this.selectedPhotoBlob, titulo);
        if (!cloudFoto) {
          showToast('Error al subir la foto a la nube. Revisa tu conexión.', 'alerta');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Publicar Polaroid</span>';
          return;
        }

        let audioClipUrl: string | undefined = undefined;
        let cancionTitulo: string | undefined = undefined;

        if (this.selectedAudioFile) {
          showToast('Subiendo fragmento de 30s...', 'info');
          const startSec = Number(trimmerSlider.value) || 0;
          const wavBlob = await recortarAudioEnCliente(this.selectedAudioFile, startSec, 30);
          cancionTitulo = this.selectedAudioFile.name.replace(/\.[^/.]+$/, '');
          const cloudAudio = await SupabaseService.subirAudioClip(wavBlob, cancionTitulo);
          if (cloudAudio) audioClipUrl = cloudAudio;
        }

        const nuevoRecuerdo: Recuerdo = {
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          usuarioId: usuario?.id,
          autorNombre,
          autorApodo,
          titulo,
          categoria,
          fechaLugar,
          historia,
          fotoUrl: cloudFoto,
          audioClipUrl,
          cancionTitulo,
          clipInicio: 0,
          clipDuracion: 30,
          reaccionesCount: 0,
          tieneMiReaccion: false,
          creadoEn: new Date().toISOString(),
        };

        const ok = await SupabaseService.guardarRecuerdo(nuevoRecuerdo);
        if (!ok) {
          showToast('Error al registrar en la base de datos', 'alerta');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Publicar Polaroid</span>';
          return;
        }

        store.agregarRecuerdo(nuevoRecuerdo);
        showToast('¡Polaroid publicada para todo el grupo!', 'exito');
        this.cerrar();
        this.onPublishSuccess();
      } catch (err) {
        console.error(err);
        showToast('Error al publicar la tarjeta', 'alerta');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Publicar Polaroid</span>';
      }
    });
  }

  private bindDedicatoriaEvents(): void {
    document.getElementById('btn-volver-selector-ded')?.addEventListener('click', () => {
      this.currentMode = 'selector';
      this.render();
    });

    const form = document.getElementById('form-modal-dedicatoria') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usuario = SessionService.getUsuario();
      const autorNombre = usuario ? usuario.nombre : (document.getElementById('modal-ded-autor') as HTMLInputElement).value;
      const autorApodo = usuario ? usuario.apodo : (document.getElementById('modal-ded-apodo') as HTMLInputElement)?.value;
      const mensaje = (document.getElementById('modal-ded-mensaje') as HTMLTextAreaElement).value.trim();

      if (!mensaje) return;

      const submitBtn = document.getElementById('btn-modal-submit-dedicatoria') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Guardando en el muro...</span>';

      const nuevaDedicatoria: Dedicatoria = {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        usuarioId: usuario?.id,
        autorNombre,
        autorApodo,
        mensaje,
        reaccionesCount: 0,
        tieneMiReaccion: false,
        creadoEn: new Date().toISOString(),
      };

      await SupabaseService.guardarDedicatoria(nuevaDedicatoria);
      store.agregarDedicatoria(nuevaDedicatoria);

      showToast('¡Dedicatoria publicada en el muro!', 'exito');
      this.cerrar();
      this.onPublishSuccess();
    });
  }

  private actualizarTrimmerLabels(start: number): void {
    const startEl = document.getElementById('modal-trimmer-start');
    const endEl = document.getElementById('modal-trimmer-end');
    const progEl = document.getElementById('modal-trimmer-prog');
    const windowBox = document.getElementById('modal-trimmer-window');
    const playhead = document.getElementById('modal-trimmer-playhead');

    if (startEl) startEl.textContent = this.formatTime(start);
    if (endEl) endEl.textContent = this.formatTime(start + 30);
    if (progEl) progEl.textContent = '0:00 / 0:30';
    if (playhead) playhead.style.left = '0%';

    if (windowBox && this.trimmerDuration > 0) {
      const leftPct = Math.max(0, Math.min(100, (start / this.trimmerDuration) * 100));
      const widthPct = Math.max(10, Math.min(100, (30 / this.trimmerDuration) * 100));
      windowBox.style.left = `${leftPct}%`;
      windowBox.style.width = `${widthPct}%`;
    }
  }

  private formatTime(seg: number): string {
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
