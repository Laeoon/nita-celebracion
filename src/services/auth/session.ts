import type { Usuario } from '../../types';

const STORAGE_KEY_USER = 'nita_usuario_sesion';
const STORAGE_KEY_TOKEN = 'nita_invitacion_token';
export const TOKEN_OFICIAL = 'nita29oct';

export class SessionService {
  private static currentUser: Usuario | null = null;

  static init(): void {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) {
      try {
        this.currentUser = JSON.parse(raw);
      } catch {
        this.currentUser = null;
      }
    }

    // Verificar token en URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('invitacion');
    if (tokenParam) {
      this.guardarToken(tokenParam);
      // Limpiar URL sin recargar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  static getUsuario(): Usuario | null {
    if (!this.currentUser) {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (raw) {
        try {
          this.currentUser = JSON.parse(raw);
        } catch {
          this.currentUser = null;
        }
      }
    }
    return this.currentUser;
  }

  static guardarUsuario(usuario: Usuario): void {
    this.currentUser = usuario;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(usuario));
  }

  static cerrarSesion(): void {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  static tieneAcceso(): boolean {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    return token === TOKEN_OFICIAL;
  }

  static guardarToken(token: string): boolean {
    if (token.trim().toLowerCase() === TOKEN_OFICIAL) {
      localStorage.setItem(STORAGE_KEY_TOKEN, TOKEN_OFICIAL);
      return true;
    }
    return false;
  }

  static esAdmin(): boolean {
    return this.currentUser?.esAdmin === true;
  }

  static setAdmin(esAdmin: boolean): void {
    if (this.currentUser) {
      this.currentUser.esAdmin = esAdmin;
      this.guardarUsuario(this.currentUser);
    } else {
      const adminUser: Usuario = {
        id: 'admin-' + Date.now(),
        nombre: 'Organizador',
        apodo: 'Admin',
        esAdmin: true,
      };
      this.guardarUsuario(adminUser);
    }
  }
}
