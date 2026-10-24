export type CategoriaRecuerdo = 'todas' | 'rumba' | 'grupo' | 'brindis';

export interface Usuario {
  id: string;
  nombre: string;
  apodo?: string;
  pin?: string;
  esAdmin: boolean;
  creadoEn?: string;
}

export interface Recuerdo {
  id: string;
  usuarioId?: string;
  autorNombre: string;
  autorApodo?: string;
  titulo: string;
  fechaLugar?: string;
  categoria: 'rumba' | 'grupo' | 'brindis';
  historia?: string;
  fotoUrl: string;
  audioClipUrl?: string;
  cancionTitulo?: string;
  clipInicio?: number;
  clipDuracion?: number;
  reaccionesCount?: number;
  tieneMiReaccion?: boolean;
  creadoEn: string;
}

export interface Dedicatoria {
  id: string;
  usuarioId?: string;
  autorNombre: string;
  autorApodo?: string;
  mensaje: string;
  reaccionesCount?: number;
  tieneMiReaccion?: boolean;
  creadoEn: string;
}

export interface Comentario {
  id: string;
  usuarioId?: string;
  autorNombre: string;
  autorApodo?: string;
  tipoObjetivo: 'recuerdo' | 'dedicatoria';
  objetivoId: string;
  texto: string;
  creadoEn: string;
}

export interface TrackMusical {
  id: string;
  titulo: string;
  artista: string;
  audioUrl: string;
  duracion?: number;
}
