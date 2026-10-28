import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Recuerdo, Dedicatoria, TrackMusical, Usuario } from '../../types';

const DEFAULT_URL = 'https://shctuollgoczbhtgcopn.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoY3R1b2xsZ29jemJodGdjb3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMjY1MzQsImV4cCI6MjEwODYwMjUzNH0.3s2Hs9tIte6ocnGTdeiC_mEZ6ZiPAp3zJWcrVOWCsDY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  /**
   * Sube una foto comprimida al bucket 'fotos-polaroid'
   */
  static async subirFoto(blob: Blob, _nombreArchivo?: string): Promise<string | null> {
    try {
      const ext = blob.type.includes('png') ? 'png' : 'webp';
      const safeId = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const path = `polaroids/${safeId}.${ext}`;
      const { data, error } = await supabase.storage.from('fotos-polaroid').upload(path, blob, {
        contentType: blob.type || 'image/webp',
        upsert: true,
      });
      if (error) {
        console.error('Error subiendo foto a Supabase Storage:', error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('fotos-polaroid').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Excepción al subir foto a Supabase:', err);
      return null;
    }
  }

  /**
   * Sube un fragmento de audio de 30s al bucket 'clips-30s'
   */
  static async subirAudioClip(blob: Blob, _nombreArchivo?: string): Promise<string | null> {
    try {
      const safeId = 'clip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const path = `clips/${safeId}.wav`;
      const { data, error } = await supabase.storage.from('clips-30s').upload(path, blob, {
        contentType: 'audio/wav',
        upsert: true,
      });
      if (error) {
        console.error('Error subiendo audio a Supabase Storage:', error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('clips-30s').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Excepción al subir audio a Supabase:', err);
      return null;
    }
  }

  /**
   * Cargar recuerdos desde Supabase
   */
  static async fetchRecuerdos(): Promise<Recuerdo[] | null> {
    try {
      const { data, error } = await supabase
        .from('recuerdos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.warn('Error obteniendo recuerdos de Supabase:', error);
        return null;
      }

      return (data || []).map((row) => ({
        id: row.id,
        usuarioId: row.usuario_id,
        autorNombre: row.autor_nombre,
        autorApodo: row.autor_apodo,
        titulo: row.titulo,
        fechaLugar: row.fecha_lugar,
        categoria: row.categoria,
        historia: row.historia,
        fotoUrl: row.foto_url,
        audioClipUrl: row.audio_clip_url,
        cancionTitulo: row.cancion_titulo,
        clipInicio: row.clip_inicio,
        clipDuracion: row.clip_duracion,
        reaccionesCount: row.reacciones_count || 0,
        creadoEn: row.creado_en,
      }));
    } catch (err) {
      console.warn('Excepción al consultar recuerdos:', err);
      return null;
    }
  }

  /**
   * Guardar nuevo recuerdo en Supabase
   */
  static async guardarRecuerdo(recuerdo: Recuerdo): Promise<boolean> {
    try {
      const { error } = await supabase.from('recuerdos').insert({
        id: recuerdo.id,
        usuario_id: recuerdo.usuarioId || null,
        autor_nombre: recuerdo.autorNombre,
        autor_apodo: recuerdo.autorApodo || null,
        titulo: recuerdo.titulo,
        fecha_lugar: recuerdo.fechaLugar,
        categoria: recuerdo.categoria,
        historia: recuerdo.historia,
        foto_url: recuerdo.fotoUrl,
        audio_clip_url: recuerdo.audioClipUrl || null,
        cancion_titulo: recuerdo.cancionTitulo || null,
        clip_inicio: recuerdo.clipInicio || 0,
        clip_duracion: recuerdo.clipDuracion || 30,
        reacciones_count: recuerdo.reaccionesCount || 0,
      });
      if (error) {
        console.error('Error insertando recuerdo en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Excepción al guardar recuerdo:', err);
      return false;
    }
  }

  /**
   * Eliminar recuerdo de Supabase
   */
  static async eliminarRecuerdo(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('recuerdos').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Cargar dedicatorias desde Supabase
   */
  static async fetchDedicatorias(): Promise<Dedicatoria[] | null> {
    try {
      const { data, error } = await supabase
        .from('dedicatorias')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.warn('Error obteniendo dedicatorias:', error);
        return null;
      }

      return (data || []).map((row) => ({
        id: row.id,
        usuarioId: row.usuario_id,
        autorNombre: row.autor_nombre,
        autorApodo: row.autor_apodo,
        mensaje: row.mensaje,
        audioUrl: row.audio_url || undefined,
        reaccionesCount: row.reacciones_count || 0,
        creadoEn: row.creado_en,
      }));
    } catch (err) {
      console.warn('Excepción al consultar dedicatorias:', err);
      return null;
    }
  }

  /**
   * Guardar dedicatoria en Supabase
   */
  static async guardarDedicatoria(dedicatoria: Dedicatoria): Promise<boolean> {
    try {
      const { error } = await supabase.from('dedicatorias').insert({
        id: dedicatoria.id,
        usuario_id: dedicatoria.usuarioId || null,
        autor_nombre: dedicatoria.autorNombre,
        autor_apodo: dedicatoria.autorApodo || null,
        mensaje: dedicatoria.mensaje,
        audio_url: dedicatoria.audioUrl || null,
        reacciones_count: dedicatoria.reaccionesCount || 0,
      });
      if (error) {
        console.error('Error insertando dedicatoria en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Excepción al guardar dedicatoria:', err);
      return false;
    }
  }

  /**
   * Actualizar contador de reacciones de un recuerdo
   */
  static async actualizarReaccionesRecuerdo(id: string, count: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recuerdos')
        .update({ reacciones_count: count })
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Actualizar contador de reacciones de una dedicatoria
   */
  static async actualizarReaccionesDedicatoria(id: string, count: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('dedicatorias')
        .update({ reacciones_count: count })
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Sube una nota de voz grabada desde el móvil al bucket 'clips-30s'
   */
  static async subirNotaVoz(blob: Blob): Promise<string | null> {
    try {
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const safeId = 'voice_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const path = `voces/${safeId}.${ext}`;
      const { data, error } = await supabase.storage.from('clips-30s').upload(path, blob, {
        contentType: blob.type || 'audio/webm',
        upsert: true,
      });
      if (error) {
        console.error('Error subiendo nota de voz a Supabase Storage:', error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('clips-30s').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Excepción al subir nota de voz a Supabase:', err);
      return null;
    }
  }

  /**
   * Sube un archivo MP3 completo al bucket 'clips-30s' (carpeta canciones) con reporte de progreso
   */
  static async subirCancion(
    blob: Blob,
    _nombreArchivo?: string,
    onProgress?: (porcentaje: number, cargadoMB: string, totalMB: string) => void
  ): Promise<string | null> {
    const safeId = 'song_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const path = `canciones/${safeId}.mp3`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/clips-30s/${path}`;

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader('Content-Type', blob.type || 'audio/mpeg');
      xhr.setRequestHeader('x-upsert', 'true');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.round((e.loaded / e.total) * 100);
            const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (e.total / (1024 * 1024)).toFixed(1);
            onProgress(pct, loadedMB, totalMB);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: publicUrlData } = supabase.storage.from('clips-30s').getPublicUrl(path);
          resolve(publicUrlData.publicUrl);
        } else {
          console.error('Error XHR subiendo canción a Supabase:', xhr.status, xhr.responseText);
          resolve(null);
        }
      };

      xhr.onerror = () => {
        console.error('Error de red al subir canción a Supabase');
        resolve(null);
      };

      xhr.send(blob);
    });
  }

  /**
   * Cargar lista de canciones de la fiesta desde Supabase
   */
  static async fetchCanciones(): Promise<TrackMusical[] | null> {
    try {
      const { data, error } = await supabase
        .from('canciones')
        .select('*')
        .order('creado_en', { ascending: true });

      if (error) {
        console.warn('Error obteniendo canciones de Supabase:', error);
        return null;
      }

      return (data || [])
        .filter((row) => {
          if (!row.audio_url || typeof row.audio_url !== 'string') return false;
          const trimmed = row.audio_url.trim();
          if (trimmed === '' || trimmed.startsWith('blob:')) return false;
          return trimmed.startsWith('http://') || trimmed.startsWith('https://');
        })
        .map((row) => ({
          id: row.id,
          titulo: row.titulo,
          artista: row.artista || 'Mariana “Nita” • Fiesta',
          audioUrl: row.audio_url.trim(),
        }));
    } catch (err) {
      console.warn('Excepción al consultar canciones:', err);
      return null;
    }
  }

  /**
   * Guardar canción en la base de datos de Supabase
   */
  static async guardarCancion(track: TrackMusical): Promise<boolean> {
    if (
      !track.audioUrl ||
      typeof track.audioUrl !== 'string' ||
      track.audioUrl.trim().startsWith('blob:') ||
      (!track.audioUrl.trim().startsWith('http://') && !track.audioUrl.trim().startsWith('https://'))
    ) {
      console.warn('URL de audio inválida para Supabase (solo se permiten URLs http/https):', track.audioUrl);
      return false;
    }

    try {
      const { error } = await supabase.from('canciones').insert({
        id: track.id,
        titulo: track.titulo,
        artista: track.artista,
        audio_url: track.audioUrl.trim(),
      });
      if (error) {
        console.error('Error insertando canción en Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Excepción al guardar canción:', err);
      return false;
    }
  }

  /**
   * Eliminar canción de la lista en Supabase
   */
  static async eliminarCancion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('canciones').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Guardar nuevo usuario en Supabase
   */
  static async guardarUsuario(usuario: Usuario): Promise<boolean> {
    try {
      const { error } = await supabase.from('usuarios').upsert({
        id: usuario.id,
        nombre: usuario.nombre,
        apodo: usuario.apodo || null,
        pin: usuario.pin || null,
        es_admin: usuario.esAdmin || false,
        deshabilitado: usuario.deshabilitado || false,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Obtener lista de todos los amigos registrados
   */
  static async fetchUsuarios(): Promise<Usuario[]> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) return [];

      return (data || []).map((row) => ({
        id: row.id,
        nombre: row.nombre,
        apodo: row.apodo || undefined,
        pin: row.pin || undefined,
        esAdmin: row.es_admin || false,
        deshabilitado: row.deshabilitado || false,
        creadoEn: row.creado_en,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Deshabilitar o habilitar una cuenta de invitado
   */
  static async deshabilitarUsuario(id: string, deshabilitado: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ deshabilitado })
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Eliminar cuenta de invitado
   */
  static async eliminarUsuario(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Eliminar dedicatoria de Supabase
   */
  static async eliminarDedicatoria(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('dedicatorias').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }
}
