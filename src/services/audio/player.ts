import { store } from '../store/appStore';
import { supabase } from '../supabase/client';
import { SessionService } from '../auth/session';
import { showToast } from '../../components/toast';
import type { TrackMusical } from '../../types';

class AudioPlayerService {
  private audio: HTMLAudioElement = new Audio();
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private progressInterval: number | null = null;

  // Web Audio API para espectro de audio en tiempo real
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;

  // Mini reproductor de polaroid activo (para evitar solapamientos)
  private polaroidAudio: HTMLAudioElement = new Audio();
  private activePolaroidId: string | null = null;
  private previewAudioRef: HTMLAudioElement | null = null;

  private listeners: Array<() => void> = [];

  private isDjMode: boolean = false;

  constructor() {
    this.setupAudioListeners();
    this.iniciarDjSync();
  }

  private setupAudioListeners(): void {
    this.audio.addEventListener('ended', () => {
      const tracks = store.getTracks();
      if (tracks.length === 1) {
        // Si hay una sola canción, repite en bucle para que nunca muera la fiesta
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.next();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Error en reproducción de audio principal', e);
      this.isPlaying = false;
      this.notificar();
    });

    this.polaroidAudio.addEventListener('ended', () => {
      this.detenerPolaroidAudio();
    });
  }

  private iniciarDjSync(): void {
    try {
      supabase
        .channel('dj_sync')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comentarios', filter: 'id=eq.dj-global-sync' }, (payload) => {
          const nuevo = payload.new as { texto: string };
          if (nuevo && nuevo.texto) {
            try {
              const data = JSON.parse(nuevo.texto);
              if (data.activo && !SessionService.esAdmin()) {
                this.syncFromDj(data.currentIndex, data.isPlaying);
              }
            } catch {}
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Error iniciando DJ sync:', err);
    }
  }

  private syncFromDj(index: number, isPlaying: boolean): void {
    const tracks = store.getTracks();
    if (!tracks.length || index < 0 || index >= tracks.length) return;
    this.currentIndex = index;
    if (isPlaying && !this.isPlaying) {
      this.play(index);
    } else if (!isPlaying && this.isPlaying) {
      this.pause();
    }
  }

  setDjMode(activo: boolean): void {
    this.isDjMode = activo;
    this.broadcastDjState();
    this.notificar();
  }

  getIsDjMode(): boolean {
    return this.isDjMode;
  }

  broadcastDjState(): void {
    if (!SessionService.esAdmin()) return;
    supabase
      .from('comentarios')
      .update({
        texto: JSON.stringify({
          activo: this.isDjMode,
          currentIndex: this.currentIndex,
          isPlaying: this.isPlaying,
          timestamp: Date.now(),
        }),
      })
      .eq('id', 'dj-global-sync')
      .then();
  }

  private initWebAudio(): void {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // Rango óptimo para 5 a 10 barras visuales
      
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn('Web Audio Analyser no inicializado o restringido por CORS/navegador', e);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notificar(): void {
    this.listeners.forEach((l) => l());
  }

  registrarPreviewAudio(audioEl: HTMLAudioElement): void {
    this.previewAudioRef = audioEl;
  }

  detenerTodo(): void {
    this.pause();
    this.detenerPolaroidAudio();
    if (this.previewAudioRef) {
      this.previewAudioRef.pause();
      this.previewAudioRef.currentTime = 0;
    }
  }

  // --- CONTROLES PRINCIPALES ---
  play(index?: number): void {
    const tracks = store.getTracks();
    if (!tracks.length) {
      showToast('No hay pistas cargadas en el reproductor', 'alerta');
      return;
    }

    if (index !== undefined && index >= 0 && index < tracks.length) {
      this.currentIndex = index;
    } else if (this.currentIndex >= tracks.length || this.currentIndex < 0) {
      this.currentIndex = 0;
    }

    // Frenar absolutamente cualquier otro audio en curso
    this.detenerPolaroidAudio();
    if (this.previewAudioRef) {
      this.previewAudioRef.pause();
    }

    const track = tracks[this.currentIndex];
    if (!track || !track.audioUrl) {
      showToast('La pista seleccionada no tiene un enlace de audio válido', 'alerta');
      return;
    }

    const srcHaCambiado = this.audio.src !== track.audioUrl;
    if (srcHaCambiado) {
      this.audio.src = track.audioUrl;
      this.audio.load();
    }

    this.audio.muted = this.isMuted;

    this.audio.play().then(() => {
      this.isPlaying = true;
      this.iniciarProgreso();
      this.broadcastDjState();
      this.notificar();

      try {
        this.initWebAudio();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      } catch (e) {
        console.warn('Web Audio visualizer no crítico:', e);
      }
    }).catch((err) => {
      console.warn('Play rechazado o archivo no accesible:', err);
      this.isPlaying = false;
      this.detenerProgreso();
      this.notificar();
      const mensaje = err?.name === 'NotAllowedError'
        ? 'Toca la pantalla para activar el audio en tu navegador'
        : `No se pudo reproducir "${track.titulo}". Revisa el formato o conexión.`;
      showToast(mensaje, 'alerta');
    });
  }

  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
    this.detenerProgreso();
    this.broadcastDjState();
    this.notificar();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next(): void {
    const tracks = store.getTracks();
    if (!tracks.length) return;
    this.currentIndex = (this.currentIndex + 1) % tracks.length;
    this.audio.currentTime = 0;
    this.play();
  }

  prev(): void {
    const tracks = store.getTracks();
    if (!tracks.length) return;
    this.currentIndex = (this.currentIndex - 1 + tracks.length) % tracks.length;
    this.audio.currentTime = 0;
    this.play();
  }

  seek(tiempoSegundos: number): void {
    if (this.audio.duration) {
      this.audio.currentTime = Math.max(0, Math.min(tiempoSegundos, this.audio.duration));
      this.notificar();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    this.polaroidAudio.muted = this.isMuted;
    this.notificar();
    return this.isMuted;
  }

  private iniciarProgreso(): void {
    this.detenerProgreso();
    this.progressInterval = window.setInterval(() => {
      this.notificar();
    }, 250);
  }

  private detenerProgreso(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // --- REPRODUCCIÓN MINI POLAROID (30s) ---
  playPolaroid(id: string, audioUrl: string, inicioSegundos: number = 0, duracionSegundos: number = 30): void {
    // Pausar el reproductor principal y el preview del recortador
    this.pause();
    if (this.previewAudioRef) {
      this.previewAudioRef.pause();
    }

    // Si pulsó la misma tarjeta que está sonando, pausar y salir
    if (this.activePolaroidId === id && !this.polaroidAudio.paused) {
      this.detenerPolaroidAudio();
      return;
    }

    this.detenerPolaroidAudio();

    this.activePolaroidId = id;
    this.polaroidAudio.src = audioUrl;
    this.polaroidAudio.currentTime = inicioSegundos;
    this.polaroidAudio.muted = this.isMuted;

    const limite = inicioSegundos + duracionSegundos;

    // Control estricto con ontimeupdate (cero desfase o solapamiento)
    this.polaroidAudio.ontimeupdate = () => {
      if (this.polaroidAudio.currentTime >= limite || this.polaroidAudio.ended) {
        this.detenerPolaroidAudio();
      } else {
        this.notificar();
      }
    };

    this.polaroidAudio.play().then(() => {
      this.notificar();
    }).catch((e) => {
      console.warn('Error al reproducir clip polaroid:', e);
      this.detenerPolaroidAudio();
    });
  }

  detenerPolaroidAudio(): void {
    this.polaroidAudio.ontimeupdate = null;
    this.polaroidAudio.pause();
    this.polaroidAudio.currentTime = 0;
    this.activePolaroidId = null;
    this.notificar();
  }

  // --- ESTADO Y FRECUENCIAS ---
  getEstado() {
    const tracks = store.getTracks();
    if (this.currentIndex >= tracks.length && tracks.length > 0) {
      this.currentIndex = 0;
    }
    const currentTrack: TrackMusical | null = tracks[this.currentIndex] || null;

    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      currentIndex: this.currentIndex,
      currentTrack,
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || (currentTrack?.duracion || 0),
      activePolaroidId: this.activePolaroidId,
      polaroidCurrentTime: this.polaroidAudio.currentTime || 0,
      isPolaroidPlaying: !!this.activePolaroidId && !this.polaroidAudio.paused,
    };
  }

  getFrecuencias(): number[] {
    if (!this.analyser || !this.dataArray || !this.isPlaying) {
      return [4, 4, 4, 4, 4];
    }
    this.analyser.getByteFrequencyData(this.dataArray as unknown as any);
    // Tomar 5 puntos de muestra en el espectro
    const indices = [1, 3, 6, 9, 13];
    return indices.map((idx) => {
      const val = this.dataArray ? this.dataArray[idx] || 0 : 0;
      // Mapear de 0-255 a altura en px (4px a 24px)
      return Math.max(4, Math.round((val / 255) * 24));
    });
  }
}

export const audioPlayer = new AudioPlayerService();
