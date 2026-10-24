import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Recuerdo, Dedicatoria } from '../../types';

// Variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export class SupabaseService {
  /**
   * Sube una foto comprimida al bucket 'fotos-polaroid'
   */
  static async subirFoto(blob: Blob, nombreArchivo: string): Promise<string | null> {
    if (!supabase) return null;
    const path = `polaroids/${Date.now()}_${nombreArchivo}`;
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
  }

  /**
   * Sube un fragmento de audio de 30s al bucket 'clips-30s'
   */
  static async subirAudioClip(blob: Blob, nombreArchivo: string): Promise<string | null> {
    if (!supabase) return null;
    const path = `clips/${Date.now()}_${nombreArchivo}.wav`;
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
  }

  /**
   * Cargar recuerdos desde Supabase
   */
  static async fetchRecuerdos(): Promise<Recuerdo[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('recuerdos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error obteniendo recuerdos de Supabase:', error);
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
      creadoEn: row.creado_en,
    }));
  }

  /**
   * Guardar nuevo recuerdo en Supabase
   */
  static async guardarRecuerdo(recuerdo: Recuerdo): Promise<boolean> {
    if (!supabase) return false;
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
    });
    if (error) {
      console.error('Error insertando recuerdo en Supabase:', error);
      return false;
    }
    return true;
  }

  /**
   * Cargar dedicatorias desde Supabase
   */
  static async fetchDedicatorias(): Promise<Dedicatoria[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('dedicatorias')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error obteniendo dedicatorias:', error);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      autorNombre: row.autor_nombre,
      autorApodo: row.autor_apodo,
      mensaje: row.mensaje,
      creadoEn: row.creado_en,
    }));
  }

  /**
   * Guardar dedicatoria en Supabase
   */
  static async guardarDedicatoria(dedicatoria: Dedicatoria): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('dedicatorias').insert({
      id: dedicatoria.id,
      usuario_id: dedicatoria.usuarioId || null,
      autor_nombre: dedicatoria.autorNombre,
      autor_apodo: dedicatoria.autorApodo || null,
      mensaje: dedicatoria.mensaje,
    });
    if (error) {
      console.error('Error insertando dedicatoria en Supabase:', error);
      return false;
    }
    return true;
  }
}
