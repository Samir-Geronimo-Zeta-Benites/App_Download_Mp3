import { API_DESCARGAR, REVOCAR_BLOB_MS, TEXTO } from "./constants";
import type { RespuestaApi } from "./types";

export const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function disparar(href: string, nombre: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = nombre;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Descarga como blob para guardar directo; si el origen bloquea CORS, abre el enlace. */
export async function guardarArchivo(url: string, nombre: string): Promise<void> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const blobUrl = URL.createObjectURL(await r.blob());
    disparar(blobUrl, nombre);
    setTimeout(() => URL.revokeObjectURL(blobUrl), REVOCAR_BLOB_MS);
  } catch {
    disparar(url, nombre);
  }
}

/** Pide al servidor el enlace directo del MP3 y lo guarda. Devuelve el nombre del archivo. */
export async function descargarCancion(url: string, n: number): Promise<string> {
  const res = await fetch(API_DESCARGAR, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = (await res.json()) as RespuestaApi;
  if (!res.ok || !data.linkDescarga) throw new Error(data.error ?? TEXTO.errorDesconocido);
  const nombre = data.nombreArchivo ?? TEXTO.nombreDefecto(n);
  await guardarArchivo(data.linkDescarga, nombre);
  return nombre;
}
