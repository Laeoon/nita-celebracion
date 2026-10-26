import { SessionService } from '../services/auth/session';
import { showToast } from './toast';
import type { Usuario } from '../types';

export class AuthModalComponent {
  private overlay: HTMLElement;
  private onLoginSuccess: () => void;

  constructor(onLoginSuccess: () => void) {
    this.onLoginSuccess = onLoginSuccess;
    this.overlay = document.createElement('div');
    this.overlay.id = 'auth-modal-overlay';
    document.body.appendChild(this.overlay);

    this.evaluarAcceso();
  }

  evaluarAcceso(): void {
    const tienePase = SessionService.tieneAcceso();
    const usuario = SessionService.getUsuario();

    if (!tienePase) {
      // Pantalla de bloqueo elegante para quien entra sin token de invitación
      this.renderPantallaBloqueo();
    } else if (!usuario) {
      // Tiene el pase QR pero aún no ha configurado su nombre/PIN
      this.renderModalRegistroInvitado();
    } else {
      // Todo en orden
      this.overlay.innerHTML = '';
      this.overlay.className = 'hidden';
    }
  }

  private renderPantallaBloqueo(): void {
    this.overlay.className = 'fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4';
    this.overlay.innerHTML = `
      <div class="glass-panel-elevated rounded-3xl p-6 sm:p-8 max-w-md w-full border border-champagne-400/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <!-- Glow ambiental -->
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-champagne-400/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="w-12 h-12 rounded-2xl bg-champagne-400/10 border border-champagne-400/40 flex items-center justify-center mx-auto text-xl font-serif font-bold text-champagne-300">
          N
        </div>

        <div class="space-y-1.5">
          <h3 class="text-2xl font-serif font-bold text-white tracking-tight">Acceso Exclusivo</h3>
          <p class="text-xs text-neutral-400 font-light">
            Celebración de Mariana (“Nita”) • 29 de Octubre
          </p>
        </div>

        <p class="text-xs text-neutral-300 leading-relaxed">
          Este sitio es privado para el grupo de amigos. Para ingresar, escanea el código QR de la invitación o introduce el código del evento.
        </p>

        <form id="form-token-acceso" class="space-y-3">
          <input 
            type="text" 
            id="input-token-acceso" 
            required 
            placeholder="Código de acceso (ej. nita29oct)" 
            class="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-center text-sm font-mono tracking-wider text-champagne-300 placeholder-neutral-500 focus:outline-none focus:border-champagne-400"
          />

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-champagne-glow"
          >
            Ingresar a la Celebración
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById('form-token-acceso') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-token-acceso') as HTMLInputElement;
      const val = input.value.trim().toLowerCase();

      if (SessionService.guardarToken(val)) {
        showToast('¡Bienvenido al grupo!', 'exito');
        this.evaluarAcceso();
        this.onLoginSuccess();
      } else {
        showToast('Código incorrecto. Solicítalo al organizador.', 'alerta');
      }
    });
  }

  private renderModalRegistroInvitado(): void {
    this.overlay.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4';
    this.overlay.innerHTML = `
      <div class="glass-panel-elevated rounded-3xl p-6 sm:p-8 max-w-md w-full border border-champagne-400/30 space-y-5 shadow-2xl relative">
        <div class="text-center space-y-1">
          <span class="text-[10px] uppercase font-mono tracking-widest text-champagne-300">Pase Confirmado</span>
          <h3 class="text-xl font-serif font-bold text-white">¿Quién eres en el grupo?</h3>
          <p class="text-xs text-neutral-400">Personaliza tu perfil para firmar tus fotos y dedicatorias</p>
        </div>

        <form id="form-registro-invitado" class="space-y-3.5">
          <div>
            <label class="block text-xs font-medium text-neutral-300 mb-1">Nombre</label>
            <input 
              type="text" 
              id="reg-nombre" 
              required 
              placeholder="Ej. Wilmer" 
              class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-champagne-400"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-neutral-300 mb-1">Apodo o Chiste interno (Opcional)</label>
            <input 
              type="text" 
              id="reg-apodo" 
              placeholder="Ej. Lawi" 
              class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-champagne-400"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-neutral-300">PIN de 4 dígitos</label>
              <span class="text-[10px] text-neutral-500 font-mono">Para recuperar tu sesión</span>
            </div>
            <input 
              type="password" 
              id="reg-pin" 
              required 
              maxlength="4" 
              pattern="[0-9]{4}" 
              inputmode="numeric" 
              placeholder="••••" 
              class="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-[0.5em] text-champagne-300 placeholder-neutral-600 focus:outline-none focus:border-champagne-400"
            />
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl btn-primary text-xs uppercase tracking-wider font-semibold shadow-subtle mt-2"
          >
            Comenzar a Celebrar
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById('form-registro-invitado') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = (document.getElementById('reg-nombre') as HTMLInputElement).value.trim();
      const apodo = (document.getElementById('reg-apodo') as HTMLInputElement).value.trim();
      const pin = (document.getElementById('reg-pin') as HTMLInputElement).value.trim();

      if (!nombre || pin.length !== 4) {
        showToast('Por favor completa tu nombre y el PIN de 4 dígitos', 'alerta');
        return;
      }

      const nuevoUsuario: Usuario = {
        id: 'usr-' + Date.now(),
        nombre,
        apodo: apodo || undefined,
        pin,
        esAdmin: false,
        creadoEn: new Date().toISOString(),
      };

      SessionService.guardarUsuario(nuevoUsuario);
      showToast(`¡Bienvenid@, ${nombre}!`, 'exito');

      this.overlay.innerHTML = '';
      this.overlay.className = 'hidden';
      this.onLoginSuccess();
    });
  }
}
