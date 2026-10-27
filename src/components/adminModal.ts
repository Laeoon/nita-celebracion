import QRCode from 'qrcode';
import { SessionService, TOKEN_OFICIAL } from '../services/auth/session';
import { SupabaseService } from '../services/supabase/client';
import { store } from '../services/store/appStore';
import { showToast } from './toast';

const ADMIN_MASTER_PASS = 'nita2026'; // Clave maestra del organizador

export class AdminModalComponent {
  private overlay: HTMLElement;
  private onAdminChange: () => void;

  constructor(onAdminChange: () => void) {
    this.onAdminChange = onAdminChange;
    this.overlay = document.createElement('div');
    this.overlay.id = 'admin-modal-overlay';
    this.overlay.className = 'hidden';
    document.body.appendChild(this.overlay);
  }

  abrir(): void {
    const esAdmin = SessionService.esAdmin();

    this.overlay.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
    
    if (!esAdmin) {
      this.renderLoginAdmin();
    } else {
      this.renderPanelAdmin();
    }
  }

  cerrar(): void {
    this.overlay.className = 'hidden';
    this.overlay.innerHTML = '';
  }

  private renderLoginAdmin(): void {
    this.overlay.innerHTML = `
      <div class="glass-panel-elevated rounded-3xl p-6 max-w-xs w-full border border-champagne-400/30 space-y-4 shadow-2xl relative">
        <button id="btn-cerrar-admin-modal" class="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm">✕</button>

        <h3 class="text-base font-serif font-bold text-white text-center">Sesión Admin</h3>

        <form id="form-login-admin" class="space-y-3">
          <input 
            type="password" 
            id="admin-password-input" 
            required 
            placeholder="••••••••" 
            class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-champagne-300 placeholder-neutral-600 focus:outline-none focus:border-champagne-400"
          />

          <button 
            type="submit" 
            class="w-full py-2.5 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle"
          >
            Entrar
          </button>
        </form>
      </div>
    `;

    document.getElementById('btn-cerrar-admin-modal')?.addEventListener('click', () => this.cerrar());
    const form = document.getElementById('form-login-admin') as HTMLFormElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = (document.getElementById('admin-password-input') as HTMLInputElement).value;
      if (pass === ADMIN_MASTER_PASS) {
        SessionService.setAdmin(true);
        showToast('Modo Administrador activado', 'exito');
        this.renderPanelAdmin();
        this.onAdminChange();
      } else {
        showToast('Contraseña incorrecta', 'alerta');
      }
    });
  }

  private async renderPanelAdmin(): Promise<void> {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?invitacion=${TOKEN_OFICIAL}`;
    const usuarios = await SupabaseService.fetchUsuarios();

    this.overlay.innerHTML = `
      <div class="glass-panel-elevated rounded-3xl p-6 sm:p-7 max-w-md w-full border border-champagne-400/30 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button id="btn-cerrar-admin-modal" class="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm">✕</button>

        <div class="space-y-1">
          <span class="text-[10px] uppercase font-mono tracking-widest text-emerald-400">Sesión Activa</span>
          <h3 class="text-xl font-serif font-bold text-white">Panel de Administración</h3>
          <p class="text-xs text-neutral-400">Control del evento, código QR y moderación global</p>
        </div>

        <!-- Generador de QR oficial -->
        <div class="bg-black/40 rounded-2xl p-4 border border-white/10 text-center space-y-3">
          <h4 class="text-xs font-semibold text-champagne-300">Código QR de Invitación</h4>
          <p class="text-[11px] text-neutral-400">Los invitados escanean este código para ingresar sin clave</p>

          <div class="flex justify-center py-2">
            <canvas id="qr-canvas" class="rounded-xl shadow-lg border border-white/10 p-2 bg-white"></canvas>
          </div>

          <div class="flex gap-2">
            <button id="btn-descargar-qr" class="flex-1 py-2 px-3 rounded-xl btn-primary text-xs font-semibold">
              Descargar QR (PNG)
            </button>
            <button id="btn-copiar-link" class="py-2 px-3 rounded-xl btn-secondary text-xs font-medium">
              Copiar Link
            </button>
          </div>
        </div>

        <!-- Lista de Amigos Registrados -->
        <div class="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-champagne-300">Amigos Registrados</h4>
            <span class="text-[10px] text-neutral-400 font-mono">${usuarios.length} cuentas</span>
          </div>
          ${usuarios.length ? `
            <div class="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
              ${usuarios.map((u) => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] text-xs">
                  <div>
                    <span class="font-semibold text-white">${u.nombre}</span>
                    ${u.apodo ? `<span class="text-champagne-300 text-[11px]"> (${u.apodo})</span>` : ''}
                  </div>
                  <button type="button" data-delete-user="${u.id}" class="text-neutral-500 hover:text-rose-400 text-xs px-2 py-0.5" title="Eliminar cuenta">
                    ✕
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-[11px] text-neutral-500 italic">Aún no hay amigos registrados en la base de datos.</p>
          `}
        </div>

        <!-- Gestión de Playlist -->
        <div class="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-semibold text-champagne-300">Playlist del Reproductor</h4>
            <span class="text-[10px] text-neutral-400 font-mono">${store.getTracks().length} canciones</span>
          </div>
          <p class="text-[11px] text-neutral-400">Puedes cargar archivos MP3 directamente desde este dispositivo para que suenen en la fiesta.</p>
          <label class="cursor-pointer w-full py-2.5 px-3 rounded-xl btn-primary text-xs font-semibold flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span>Seleccionar y Subir MP3s</span>
            <input type="file" id="admin-mp3-upload" accept="audio/*" multiple class="hidden" />
          </label>
        </div>

        <!-- Acciones de administración -->
        <div class="space-y-2 pt-2 border-t border-white/10">
          <button id="btn-vaciar-todo" class="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition">
            Vaciar todo (Restablecer demo)
          </button>
          <button id="btn-desactivar-admin" class="w-full py-2.5 rounded-xl btn-secondary text-xs font-medium">
            Salir del Modo Admin
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-cerrar-admin-modal')?.addEventListener('click', () => this.cerrar());

    // Generar QR en el canvas
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      QRCode.toCanvas(canvas, inviteUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0b0a0e',
          light: '#ffffff'
        }
      });
    }

    document.getElementById('btn-copiar-link')?.addEventListener('click', () => {
      navigator.clipboard.writeText(inviteUrl);
      showToast('Enlace de invitación copiado al portapapeles', 'exito');
    });

    const mp3Input = document.getElementById('admin-mp3-upload') as HTMLInputElement | null;
    mp3Input?.addEventListener('change', () => {
      const files = mp3Input.files;
      if (!files || !files.length) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const audioUrl = URL.createObjectURL(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        store.agregarTrack({
          id: 'track-' + Date.now() + '-' + i,
          titulo: cleanName,
          artista: 'Mariana “Nita” • Fiesta',
          audioUrl: audioUrl,
        });
      }

      showToast(`Se agregaron ${files.length} canciones al reproductor`, 'exito');
      this.renderPanelAdmin();
      this.onAdminChange();
    });

    this.overlay.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-user');
        if (id && confirm('¿Deseas eliminar la cuenta de este usuario?')) {
          await SupabaseService.eliminarUsuario(id);
          showToast('Cuenta eliminada', 'info');
          this.renderPanelAdmin();
        }
      });
    });

    document.getElementById('btn-descargar-qr')?.addEventListener('click', () => {
      if (!canvas) return;
      const a = document.createElement('a');
      a.download = 'invitacion-mariana-nita-29oct.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      showToast('Descarga iniciada', 'exito');
    });

    document.getElementById('btn-vaciar-todo')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas vaciar todas las fotos y dedicatorias?')) {
        store.vaciarTodo();
        showToast('Se restablecieron los datos', 'info');
        this.cerrar();
        this.onAdminChange();
      }
    });

    document.getElementById('btn-desactivar-admin')?.addEventListener('click', () => {
      SessionService.setAdmin(false);
      showToast('Modo Administrador desactivado', 'info');
      this.cerrar();
      this.onAdminChange();
    });
  }
}
