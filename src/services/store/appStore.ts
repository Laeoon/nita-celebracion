import type { Recuerdo, Dedicatoria, Comentario, TrackMusical, CategoriaRecuerdo } from '../../types';
import { PLAYLIST_OFICIAL } from '../../constants/playlist';
import { obtenerAudioDeIndexedDB, eliminarAudioDeIndexedDB } from '../storage/audioStorage';
import { SupabaseService, supabase } from '../supabase/client';

interface AppState {
  recuerdos: Recuerdo[];
  dedicatorias: Dedicatoria[];
  comentarios: Comentario[];
  tracks: TrackMusical[];
  filtroCategoria: CategoriaRecuerdo;
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
  private misLikes: Set<string> = new Set();

  constructor() {
    this.cargarMisLikes();
    this.cargarDeStorage();
    this.restaurarAudiosPersistentes();
    this.sincronizarConSupabase();
  }

  private cargarMisLikes(): void {
    const raw = localStorage.getItem('nita_mis_likes');
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        this.misLikes = new Set(arr);
      } catch {
        this.misLikes = new Set();
      }
    }
  }

  private guardarMisLikes(): void {
    localStorage.setItem('nita_mis_likes', JSON.stringify(Array.from(this.misLikes)));
  }

  private async sincronizarConSupabase(): Promise<void> {
    try {
      const cloudRecuerdos = await SupabaseService.fetchRecuerdos();
      if (cloudRecuerdos !== null) {
        this.state.recuerdos = cloudRecuerdos.map((r) => ({
          ...r,
          tieneMiReaccion: this.misLikes.has(r.id),
        }));
      }
      const cloudDedicatorias = await SupabaseService.fetchDedicatorias();
      if (cloudDedicatorias !== null) {
        this.state.dedicatorias = cloudDedicatorias.map((d) => ({
          ...d,
          tieneMiReaccion: this.misLikes.has(d.id),
        }));
      }
      const cloudCanciones = await SupabaseService.fetchCanciones();
      if (cloudCanciones !== null && cloudCanciones.length > 0) {
        this.state.tracks = cloudCanciones;
      }
      this.guardarEnStorage();
      this.notificar();

      // Sincronización en tiempo real
      supabase
        .channel('public_celebration_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recuerdos' }, async () => {
          const recs = await SupabaseService.fetchRecuerdos();
          if (recs) {
            this.state.recuerdos = recs.map((r) => ({
              ...r,
              tieneMiReaccion: this.misLikes.has(r.id),
            }));
            this.guardarEnStorage();
            this.notificar();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dedicatorias' }, async () => {
          const deds = await SupabaseService.fetchDedicatorias();
          if (deds) {
            this.state.dedicatorias = deds.map((d) => ({
              ...d,
              tieneMiReaccion: this.misLikes.has(d.id),
            }));
            this.guardarEnStorage();
            this.notificar();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'canciones' }, async () => {
          const songs = await SupabaseService.fetchCanciones();
          if (songs && songs.length) {
            this.state.tracks = songs;
            this.guardarEnStorage();
            this.notificar();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Error en sincronización inicial con Supabase:', err);
    }
  }

  private async restaurarAudiosPersistentes(): Promise<void> {
    let huboCambios = false;
    for (const track of this.state.tracks) {
      if (track.audioUrl.startsWith('blob:') || !track.audioUrl) {
        const blob = await obtenerAudioDeIndexedDB(track.id);
        if (blob) {
          track.audioUrl = URL.createObjectURL(blob);
          huboCambios = true;
        }
      }
    }
    if (huboCambios) {
      this.notificar();
    }
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
    return this.state.recuerdos.filter((r) => {
      if (this.state.filtroCategoria === 'tomaderas') {
        return r.categoria === 'tomaderas' || r.categoria === 'brindis';
      }
      return r.categoria === this.state.filtroCategoria;
    });
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
  setFiltro(categoria: CategoriaRecuerdo): void {
    this.state.filtroCategoria = categoria;
    this.notificar();
  }

  agregarRecuerdo(recuerdo: Recuerdo): void {
    this.state.recuerdos.unshift(recuerdo);
    this.guardarEnStorage();
    SupabaseService.guardarRecuerdo(recuerdo);
  }

  eliminarRecuerdo(id: string): void {
    this.state.recuerdos = this.state.recuerdos.filter((r) => r.id !== id);
    this.state.comentarios = this.state.comentarios.filter(
      (c) => !(c.tipoObjetivo === 'recuerdo' && c.objetivoId === id)
    );
    this.guardarEnStorage();
    SupabaseService.eliminarRecuerdo(id);
  }

  agregarDedicatoria(dedicatoria: Dedicatoria): void {
    this.state.dedicatorias.unshift(dedicatoria);
    this.guardarEnStorage();
    SupabaseService.guardarDedicatoria(dedicatoria);
  }

  eliminarDedicatoria(id: string): void {
    this.state.dedicatorias = this.state.dedicatorias.filter((d) => d.id !== id);
    this.state.comentarios = this.state.comentarios.filter(
      (c) => !(c.tipoObjetivo === 'dedicatoria' && c.objetivoId === id)
    );
    this.guardarEnStorage();
    SupabaseService.eliminarDedicatoria(id);
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
    const yaDiLike = this.misLikes.has(id);
    if (yaDiLike) {
      this.misLikes.delete(id);
    } else {
      this.misLikes.add(id);
    }
    this.guardarMisLikes();

    if (tipo === 'recuerdo') {
      const item = this.state.recuerdos.find((r) => r.id === id);
      if (item) {
        item.tieneMiReaccion = !yaDiLike;
        item.reaccionesCount = Math.max(0, (item.reaccionesCount || 0) + (yaDiLike ? -1 : 1));
        this.guardarEnStorage();
        SupabaseService.actualizarReaccionesRecuerdo(id, item.reaccionesCount);
      }
    } else {
      const item = this.state.dedicatorias.find((d) => d.id === id);
      if (item) {
        item.tieneMiReaccion = !yaDiLike;
        item.reaccionesCount = Math.max(0, (item.reaccionesCount || 0) + (yaDiLike ? -1 : 1));
        this.guardarEnStorage();
        SupabaseService.actualizarReaccionesDedicatoria(id, item.reaccionesCount);
      }
    }
  }

  // --- TRACKS ---
  agregarTrack(track: TrackMusical): boolean {
    const yaExiste = this.state.tracks.some(
      (t) => t.titulo.trim().toLowerCase() === track.titulo.trim().toLowerCase()
    );
    if (yaExiste) {
      return false;
    }
    this.state.tracks.push(track);
    this.guardarEnStorage();
    SupabaseService.guardarCancion(track);
    return true;
  }

  eliminarTrack(id: string): void {
    this.state.tracks = this.state.tracks.filter((t) => t.id !== id);
    eliminarAudioDeIndexedDB(id);
    SupabaseService.eliminarCancion(id);
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
