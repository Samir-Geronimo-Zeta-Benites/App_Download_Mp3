export const COBALT_API = "https://api.cobalt.tools/";

export const COBALT_OPCIONES = {
  downloadMode: "audio",
  audioFormat: "mp3",
  audioBitrate: "320",
} as const;

export enum Http {
  Ok = 200,
  BadRequest = 400,
  MethodNotAllowed = 405,
  ServerError = 500,
  BadGateway = 502,
}

export const MENSAJES = {
  metodo: "Método no permitido. Usa POST.",
  peticion: "Petición inválida.",
  linkInvalido: "El link no es válido.",
  desconocido: "error desconocido",
  nombreDefecto: "cancion.mp3",
  noProcesado: (codigo: string) => `No se pudo procesar el link: ${codigo}`,
  conexion: (msg: string) => `Error al conectar: ${msg}`,
} as const;
