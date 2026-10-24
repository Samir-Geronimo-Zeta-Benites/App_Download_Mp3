import type { Handler } from "@netlify/functions";
import { COBALT_API, COBALT_OPCIONES, Http, MENSAJES } from "./constants";

interface RespuestaCobalt {
  status?: string;
  url?: string;
  filename?: string;
  error?: { code?: string };
}

const json = (statusCode: Http, data: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(Http.MethodNotAllowed, { error: MENSAJES.metodo });

  let url: string | undefined;
  try {
    url = JSON.parse(event.body ?? "{}").url;
  } catch {
    return json(Http.BadRequest, { error: MENSAJES.peticion });
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return json(Http.BadRequest, { error: MENSAJES.linkInvalido });
  }

  try {
    const res = await fetch(COBALT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url, ...COBALT_OPCIONES }),
    });
    const data = (await res.json()) as RespuestaCobalt;

    if (!res.ok || data.status === "error" || !data.url) {
      return json(Http.BadGateway, {
        error: MENSAJES.noProcesado(data.error?.code ?? MENSAJES.desconocido),
      });
    }
    return json(Http.Ok, {
      linkDescarga: data.url,
      nombreArchivo: data.filename || MENSAJES.nombreDefecto,
    });
  } catch (e) {
    return json(Http.ServerError, { error: MENSAJES.conexion((e as Error).message) });
  }
};
