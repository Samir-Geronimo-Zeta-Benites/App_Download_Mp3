// =============================================
// NETLIFY FUNCTION: descargar.js
// Esta función actúa como servidor intermediario.
// Tu app HTML la llama, ella llama a cobalt.tools,
// y devuelve el link directo al MP3.
// =============================================

exports.handler = async function (event) {

  // Solo aceptamos peticiones POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método no permitido. Usa POST." })
    };
  }

  // Leemos el body que mandó el script.js (viene como texto JSON)
  var body = JSON.parse(event.body);
  var urlYoutube = body.url;

  // Verificamos que venga un link
  if (!urlYoutube) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió ningún link." })
    };
  }

  // -----------------------------------------------
  // Llamamos a la API de cobalt.tools
  // Le mandamos el link de YouTube y nos devuelve
  // un link directo para descargar el audio en MP3
  // -----------------------------------------------
  try {

    var respuestaCobalt = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        url: urlYoutube,          // el link de YouTube que mandó el usuario
        downloadMode: "audio",    // solo queremos el audio, no el video
        audioFormat: "mp3",       // formato mp3
        audioBitrate: "320"       // calidad alta
      })
    });

    // Convertimos la respuesta a JSON
    var dataCobalt = await respuestaCobalt.json();

    // Si cobalt devolvió un error
    if (!respuestaCobalt.ok || dataCobalt.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Cobalt no pudo procesar el link: " + (dataCobalt.error?.code || "error desconocido")
        })
      };
    }

    // Si todo salió bien, devolvemos el link de descarga a nuestro script.js
    return {
      statusCode: 200,
      headers: {
        // Esto permite que nuestro HTML pueda recibir la respuesta sin problemas de CORS
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        linkDescarga: dataCobalt.url,   // el link directo al MP3
        nombreArchivo: dataCobalt.filename || "cancion.mp3"
      })
    };

  } catch (error) {

    // Si hubo un error de red u otro problema
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al conectar con cobalt: " + error.message })
    };

  }

};