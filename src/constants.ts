export const API_DESCARGAR = "/.netlify/functions/descargar";

export const PAUSA_ENTRE_DESCARGAS_MS = 1200;
export const DURACION_TOAST_MS = 4500;
export const DURACION_SALIDA_MS = 300;
export const DURACION_QUITAR_FILA_MS = 320;
export const ROTACION_MS = 2600;
export const PALABRAS_ROTATIVAS = ["música", "playlists", "favoritas", "podcasts", "canciones"] as const;
export const REVOCAR_BLOB_MS = 10_000;

export const ESCENA = {
  ENTRADA_MS: 1800,
  BARRAS: 120,
  PARTICULAS: 46,
  BPM: 124,
  ONDAS: 3,
  CHISPAS: 26,
} as const;

export const RIPPLE_MS = 650;
export const PEGADO_MS = 700;
export const ESCALONADO_LIMPIAR_MS = 70;

export enum TipoToast {
  Info = "info",
  Ok = "ok",
  Error = "error",
}

export enum EstadoFila {
  Ok = "ok",
  Error = "err",
  Ocupado = "busy",
  Quitando = "removing",
}

export const TEXTO = {
  descargarTodo: "Descargar todo",
  sinEnlaces: "Agrega al menos un enlace.",
  errorDesconocido: "Error desconocido",
  nombreDefecto: (n: number) => `cancion-${n}.mp3`,
  progreso: (i: number, total: number) => `Descargando ${i} de ${total}…`,
  descargado: (nombre: string) => `Descargado: ${nombre}`,
  errorEnlace: (n: number, msg: string) => `Enlace ${n}: ${msg}`,
  resumen: (ok: number, total: number) => `${ok} de ${total} canciones descargadas.`,
  contador: (llenos: number, total: number) => `${llenos} de ${total}`,
} as const;
