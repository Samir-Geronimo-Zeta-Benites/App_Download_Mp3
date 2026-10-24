export interface RespuestaApi {
  linkDescarga?: string;
  nombreArchivo?: string;
  error?: string;
}

export interface Pendiente {
  fila: HTMLLIElement;
  n: number;
  url: string;
}
