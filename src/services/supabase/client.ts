import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Recuerdo, Dedicatoria, TrackMusical } from '../../types';

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
   * Sube un archivo MP3 completo al bucket 'clips-30s' (carpeta canciones)
   */
  static async subirCancion(blob: Blob, _nombreArchivo?: string): Promise<string | null> {
    try {
      const safeId = 'song_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const path = `canciones/${safeId}.mp3`;
      const { data, error } = await supabase.storage.from('clips-30s').upload(path, blob, {
        contentType: blob.type || 'audio/mpeg',
        upsert: true,
      });
      if (error) {
        console.error('Error subiendo canción a Supabase Storage:', error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from('clips-30s').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Excepción al subir canción a Supabase:', err);
      return null;
    }
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

      return (data || []).map((row) => ({
        id: row.id,
        titulo: row.titulo,
        artista: row.artista || 'Mariana “Nita” • Fiesta',
        audioUrl: row.audio_url,
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
    try {
      const { error } = await supabase.from('canciones').insert({
        id: track.id,
        titulo: track.titulo,
        artista: track.artista,
        audio_url: track.audioUrl,
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
