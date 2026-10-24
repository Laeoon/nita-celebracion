import type { Recuerdo, Dedicatoria, Comentario, TrackMusical } from '../../types';
import { PLAYLIST_OFICIAL } from '../../constants/playlist';

interface AppState {
  recuerdos: Recuerdo[];
  dedicatorias: Dedicatoria[];
  comentarios: Comentario[];
  tracks: TrackMusical[];
  filtroCategoria: 'todas' | 'rumba' | 'grupo' | 'brindis';
}

const STORAGE_KEY_DATA = 'nita_app_data_v1';

class AppStore {
  private state: AppState = {
    recuerdos: [],
    dedicatorias: [],
    comentarios: [],
    tracks: [],
    filtroCategoria: 'todas',
  };

  private listeners: Array<() => void> = [];

  constructor() {
    this.cargarDeStorage();
  }

  private cargarDeStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY_DATA);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      } catch {
        console.error('Error parseando datos de localStorage');
      }
    }
    // Si la lista de tracks está vacía, cargar de fábrica si hay pistas oficiales
    if (!this.state.tracks.length && PLAYLIST_OFICIAL.length) {
      this.state.tracks = [...PLAYLIST_OFICIAL];
    }
  }

  private guardarEnStorage(): void {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(this.state));
    this.notificar();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notificar(): void {
    this.listeners.forEach((listener) => listener());
  }

  // --- GETTERS ---
  getState(): AppState {
    return this.state;
  }

  getRecuerdosFiltrados(): Recuerdo[] {
    if (this.state.filtroCategoria === 'todas') {
      return this.state.recuerdos;
    }
    return this.state.recuerdos.filter((r) => r.categoria === this.state.filtroCategoria);
  }

  getDedicatorias(): Dedicatoria[] {
    return this.state.dedicatorias;
  }

  getComentarios(tipo: 'recuerdo' | 'dedicatoria', objetivoId: string): Comentario[] {
    return this.state.comentarios.filter(
      (c) => c.tipoObjetivo === tipo && c.objetivoId === objetivoId
    );
  }

  getTracks(): TrackMusical[] {
    return this.state.tracks;
  }

  // --- ACTIONS ---
  setFiltro(categoria: 'todas' | 'rumba' | 'grupo' | 'brindis'): void {
    this.state.filtroCategoria = categoria;
    this.notificar();
  }

  agregarRecuerdo(recuerdo: Recuerdo): void {
    this.state.recuerdos.unshift(recuerdo);
    this.guardarEnStorage();
  }

  eliminarRecuerdo(id: string): void {
    this.state.recuerdos = this.state.recuerdos.filter((r) => r.id !== id);
    this.state.comentarios = this.state.comentarios.filter(
      (c) => !(c.tipoObjetivo === 'recuerdo' && c.objetivoId === id)
    );
    this.guardarEnStorage();
  }

  agregarDedicatoria(dedicatoria: Dedicatoria): void {
    this.state.dedicatorias.unshift(dedicatoria);
    this.guardarEnStorage();
  }

  eliminarDedicatoria(id: string): void {
    this.state.dedicatorias = this.state.dedicatorias.filter((d) => d.id !== id);
    this.state.comentarios = this.state.comentarios.filter(
      (c) => !(c.tipoObjetivo === 'dedicatoria' && c.objetivoId === id)
    );
    this.guardarEnStorage();
  }

  agregarComentario(comentario: Comentario): void {
    this.state.comentarios.push(comentario);
    this.guardarEnStorage();
  }

  eliminarComentario(id: string): void {
    this.state.comentarios = this.state.comentarios.filter((c) => c.id !== id);
    this.guardarEnStorage();
  }

  toggleReaccion(tipo: 'recuerdo' | 'dedicatoria', id: string): void {
    if (tipo === 'recuerdo') {
      const item = this.state.recuerdos.find((r) => r.id === id);
      if (item) {
        item.tieneMiReaccion = !item.tieneMiReaccion;
        item.reaccionesCount = (item.reaccionesCount || 0) + (item.tieneMiReaccion ? 1 : -1);
        this.guardarEnStorage();
      }
    } else {
      const item = this.state.dedicatorias.find((d) => d.id === id);
      if (item) {
        item.tieneMiReaccion = !item.tieneMiReaccion;
        item.reaccionesCount = (item.reaccionesCount || 0) + (item.tieneMiReaccion ? 1 : -1);
        this.guardarEnStorage();
      }
    }
  }

  // --- TRACKS ---
  agregarTrack(track: TrackMusical): void {
    this.state.tracks.push(track);
    this.guardarEnStorage();
  }

  eliminarTrack(id: string): void {
    this.state.tracks = this.state.tracks.filter((t) => t.id !== id);
    this.guardarEnStorage();
  }

  vaciarTodo(): void {
    this.state.recuerdos = [];
    this.state.dedicatorias = [];
    this.state.comentarios = [];
    this.state.tracks = [];
    this.guardarEnStorage();
  }
}

export const store = new AppStore();
