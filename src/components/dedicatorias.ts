import { store } from '../services/store/appStore';
import { SessionService } from '../services/auth/session';
import { showToast } from './toast';
import type { Dedicatoria } from '../types';

export class DedicatoriasComponent {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`No se encontró #${containerId}`);
    this.container = el;

    this.render();

    store.subscribe(() => this.actualizarLista());
  }

  public render(): void {
    const usuario = SessionService.getUsuario();

    this.container.innerHTML = `
      <section class="space-y-6 scroll-mt-28" id="dedicatorias">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-xl font-serif font-bold text-white tracking-wide">Muro de Dedicatorias</h3>
            <p class="text-xs text-neutral-400">Mensajes y deseos que quedan guardados para siempre</p>
          </div>
        </div>

        <!-- Formulario para dejar dedicatoria -->
        <div class="glass-panel rounded-3xl p-5 sm:p-6 shadow-glass border border-white/10" id="formulario-dedicatoria">
          <form id="form-dedicatoria" class="space-y-4">
            ${!usuario ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] text-neutral-300 mb-1">Tu Nombre</label>
                  <input id="input-dedicatoria-autor" type="text" required placeholder="Ej. Carlos" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                </div>
                <div>
                  <label class="block text-[11px] text-neutral-300 mb-1">Apodo (Opcional)</label>
                  <input id="input-dedicatoria-apodo" type="text" placeholder="Ej. El Primo" class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400" />
                </div>
              </div>
            ` : `
              <div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                <span class="text-neutral-400">Escribiendo como:</span>
                <span class="font-semibold text-champagne-300">${usuario.nombre} ${usuario.apodo ? `(${usuario.apodo})` : ''}</span>
              </div>
            `}

            <div>
              <label class="block text-[11px] text-neutral-300 mb-1">Tu Mensaje para Nita</label>
              <textarea id="input-dedicatoria-mensaje" rows="3" required placeholder="Escribe aquí tus mejores deseos, chistes internos o palabras de cariño..." class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-champagne-400"></textarea>
            </div>

            <button type="submit" id="btn-submit-dedicatoria" class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle flex items-center justify-center gap-2">
              <span>Publicar en el Muro</span>
            </button>
          </form>
        </div>

        <!-- Muro de mensajes -->
        <div id="dedicatorias-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Renderizado dinámico -->
        </div>
      </section>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const form = document.getElementById('form-dedicatoria') as HTMLFormElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      const usuarioSesion = SessionService.getUsuario();
      const autorNombre = usuarioSesion ? usuarioSesion.nombre : (document.getElementById('input-dedicatoria-autor') as HTMLInputElement).value;
      const autorApodo = usuarioSesion ? usuarioSesion.apodo : (document.getElementById('input-dedicatoria-apodo') as HTMLInputElement)?.value;
      const mensaje = (document.getElementById('input-dedicatoria-mensaje') as HTMLTextAreaElement).value;

      if (!mensaje.trim()) return;

      const nuevaDedicatoria: Dedicatoria = {
        id: 'ded-' + Date.now(),
        usuarioId: usuarioSesion?.id,
        autorNombre,
        autorApodo,
        mensaje,
        reaccionesCount: 0,
        tieneMiReaccion: false,
        creadoEn: new Date().toISOString(),
      };

      store.agregarDedicatoria(nuevaDedicatoria);
      showToast('¡Dedicatoria agregada al muro!', 'exito');

      form.reset();
    });

    this.actualizarLista();
  }

  private actualizarLista(): void {
    const grid = document.getElementById('dedicatorias-grid');
    if (!grid) return;

    const dedicatorias = store.getDedicatorias();
    const usuario = SessionService.getUsuario();
    const esAdmin = SessionService.esAdmin();

    if (!dedicatorias.length) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 glass-panel rounded-3xl border border-white/5">
          <p class="text-sm text-neutral-400 font-light">El muro está esperando sus primeras dedicatorias.</p>
          <p class="text-xs text-champagne-300/70 mt-1">¡Sé el primero en dejarle unas palabras a Nita!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = dedicatorias.map((d) => {
      const iniciales = this.obtenerMonograma(d.autorNombre);
      const puedeBorrar = esAdmin || (usuario && usuario.id === d.usuarioId);
      const comentarios = store.getComentarios('dedicatoria', d.id);

      return `
        <div class="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-champagne-400/30 transition shadow-glass space-y-3 relative group">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <!-- Monograma sobrio con iniciales -->
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400/25 to-champagne-400/5 border border-champagne-400/35 flex items-center justify-center text-sm font-serif font-bold text-champagne-300 shadow-inner flex-shrink-0">
                ${iniciales}
              </div>
              <div>
                <h4 class="text-sm font-semibold text-white leading-tight">${d.autorNombre}</h4>
                ${d.autorApodo ? `<p class="text-[11px] text-champagne-300/80 font-mono">${d.autorApodo}</p>` : ''}
              </div>
            </div>

            ${puedeBorrar ? `
              <button data-delete-ded-id="${d.id}" class="w-6 h-6 rounded-full bg-white/5 hover:bg-rose-600 text-neutral-400 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition" title="Eliminar mensaje">
                ✕
              </button>
            ` : ''}
          </div>

          <!-- Mensaje con tipografía editorial -->
          <p class="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed whitespace-pre-line">
            ${d.mensaje}
          </p>

          <!-- Barra de reacciones y comentarios -->
          <div class="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <button data-reaccionar-ded-id="${d.id}" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full ${d.tieneMiReaccion ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-white/5 hover:bg-white/10 text-neutral-300'} font-medium transition active:scale-95" title="Me gusta">
              <svg class="w-3.5 h-3.5 ${d.tieneMiReaccion ? 'fill-rose-400 text-rose-400' : 'fill-none text-neutral-400'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              <span>${d.reaccionesCount || 0}</span>
            </button>

            <span class="text-[10px] text-neutral-500 font-mono">${comentarios.length} comentarios</span>
          </div>

          <!-- Mini hilo de comentarios -->
          ${comentarios.length ? `
            <div class="space-y-1.5 pt-1">
              ${comentarios.map((c) => `
                <div class="bg-black/30 rounded-lg px-2.5 py-1.5 text-[11px] flex items-baseline justify-between gap-2">
                  <span><strong class="text-champagne-300">${c.autorNombre}:</strong> <span class="text-neutral-300">${c.texto}</span></span>
                  ${(esAdmin || usuario?.id === c.usuarioId) ? `
                    <button data-delete-com-id="${c.id}" class="text-[10px] text-neutral-500 hover:text-rose-400">✕</button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Input para agregar comentario rápido -->
          <form data-comment-form="${d.id}" class="flex items-center gap-2 pt-1">
            <input type="text" placeholder="Responder..." required class="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-champagne-400/60" />
            <button type="submit" class="px-2.5 py-1 rounded-lg btn-secondary text-xs font-medium">Enviar</button>
          </form>
        </div>
      `;
    }).join('');

    // Eventos de dedicatorias
    grid.querySelectorAll('[data-delete-ded-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-ded-id');
        if (id && confirm('¿Deseas eliminar esta dedicatoria?')) {
          store.eliminarDedicatoria(id);
          showToast('Dedicatoria eliminada', 'info');
        }
      });
    });

    grid.querySelectorAll('[data-reaccionar-ded-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-reaccionar-ded-id');
        if (id) {
          store.toggleReaccion('dedicatoria', id);
        }
      });
    });

    // Envío de comentarios
    grid.querySelectorAll('[data-comment-form]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input') as HTMLInputElement;
        const texto = input.value.trim();
        const objId = form.getAttribute('data-comment-form');
        if (!texto || !objId) return;

        const usuarioSesion = SessionService.getUsuario();
        const autorNombre = usuarioSesion ? usuarioSesion.nombre : 'Invitado';
        const autorApodo = usuarioSesion ? usuarioSesion.apodo : undefined;

        store.agregarComentario({
          id: 'com-' + Date.now(),
          usuarioId: usuarioSesion?.id,
          autorNombre,
          autorApodo,
          tipoObjetivo: 'dedicatoria',
          objetivoId: objId,
          texto,
          creadoEn: new Date().toISOString(),
        });

        input.value = '';
        showToast('Comentario publicado', 'exito');
      });
    });

    grid.querySelectorAll('[data-delete-com-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-com-id');
        if (id) {
          store.eliminarComentario(id);
        }
      });
    });
  }

  private obtenerMonograma(nombre: string): string {
    const partes = nombre.trim().split(' ').filter(Boolean);
    if (!partes.length) return 'N';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
}
