// =============================================
// VARIABLES GLOBALES
// =============================================

// Contador para numerar los inputs (ej: Link #1, Link #2...)
var contadorLinks = 0;

// Referencia al contenedor donde se agregan los inputs
var listaInputs = document.getElementById("lista-inputs");

// Referencia a la zona donde se muestran mensajes
var zonaEstado = document.getElementById("zona-estado");

// URL de nuestra Netlify Function (el "servidor")
// Cuando subas a Netlify, esta ruta funciona automáticamente
var URL_SERVIDOR = "/.netlify/functions/descargar";


// =============================================
// INICIALIZAR: Crear el primer input al cargar
// =============================================
window.onload = function () {
  agregarInput();
};


// =============================================
// FUNCIÓN: Agregar un nuevo input de link
// =============================================
function agregarInput() {
  contadorLinks = contadorLinks + 1;
  var numeroActual = contadorLinks;

  var fila = document.createElement("div");
  fila.classList.add("fila-input");
  fila.id = "fila-" + numeroActual;

  var etiqueta = document.createElement("span");
  etiqueta.classList.add("etiqueta-input");
  etiqueta.textContent = "#" + numeroActual;

  var input = document.createElement("input");
  input.type = "text";
  input.classList.add("input-link");
  input.placeholder = "https://music.youtube.com/watch?v=...";
  input.id = "link-" + numeroActual;

  var btnEliminar = document.createElement("button");
  btnEliminar.classList.add("btn-eliminar");
  btnEliminar.title = "Eliminar este link";
  btnEliminar.textContent = "✕";

  btnEliminar.onclick = function () {
    eliminarFila(fila);
  };

  fila.appendChild(etiqueta);
  fila.appendChild(input);
  fila.appendChild(btnEliminar);
  listaInputs.appendChild(fila);
  input.focus();
  limpiarMensajes();
}


// =============================================
// FUNCIÓN: Eliminar una fila específica
// =============================================
function eliminarFila(fila) {
  var todasLasFilas = listaInputs.querySelectorAll(".fila-input");

  if (todasLasFilas.length === 1) {
    var inputDentro = fila.querySelector(".input-link");
    inputDentro.value = "";
    mostrarMensaje("ℹ️ No puedes eliminar el último campo, pero se ha limpiado.", "info");
    return;
  }

  fila.style.transition = "opacity 0.2s, transform 0.2s";
  fila.style.opacity = "0";
  fila.style.transform = "translateX(10px)";

  setTimeout(function () {
    fila.remove();
  }, 200);

  limpiarMensajes();
}


// =============================================
// FUNCIÓN: Limpiar todos los links (vaciar inputs)
// =============================================
function limpiarTodo() {
  var todosLosInputs = listaInputs.querySelectorAll(".input-link");

  var hayAlgo = false;
  todosLosInputs.forEach(function (input) {
    if (input.value.trim() !== "") {
      hayAlgo = true;
    }
  });

  if (!hayAlgo) {
    mostrarMensaje("ℹ️ Los campos ya están vacíos.", "info");
    return;
  }

  todosLosInputs.forEach(function (input) {
    input.value = "";
    input.style.transition = "background 0.2s";
    input.style.background = "rgba(108, 99, 255, 0.15)";
    setTimeout(function () {
      input.style.background = "";
    }, 300);
  });

  mostrarMensaje("🧹 ¡Todos los campos han sido limpiados!", "ok");
}


// =============================================
// FUNCIÓN: Descargar todos los MP3
// Llama a nuestra Netlify Function (el servidor)
// =============================================
async function descargarTodo() {
  limpiarMensajes();

  var todosLosInputs = listaInputs.querySelectorAll(".input-link");
  var linksValidos = [];
  var linksVacios = 0;

  todosLosInputs.forEach(function (input) {
    var link = input.value.trim();
    if (link === "") {
      linksVacios = linksVacios + 1;
    } else {
      linksValidos.push(link);
    }
  });

  if (linksValidos.length === 0) {
    mostrarMensaje("⚠️ No hay ningún link ingresado. Agrega al menos uno.", "error");
    return;
  }

  mostrarMensaje("⏳ Procesando " + linksValidos.length + " canción(es), espera...", "info");

  // Deshabilitamos el botón mientras se procesa
  var btnDescargar = document.getElementById("btn-descargar");
  btnDescargar.disabled = true;
  btnDescargar.textContent = "⏳ Procesando...";

  // Procesamos cada link uno por uno
  for (var i = 0; i < linksValidos.length; i++) {
    var link = linksValidos[i];
    var numero = i + 1;

    mostrarMensaje("🔍 Buscando canción #" + numero + "...", "info");
    await procesarYDescargar(link, numero);

    // Pausa entre descargas para no saturar
    if (i < linksValidos.length - 1) {
      await esperar(1500);
    }
  }

  // Volvemos a habilitar el botón
  btnDescargar.disabled = false;
  btnDescargar.textContent = "⬇️ Descargar todo";

  if (linksVacios > 0) {
    mostrarMensaje("ℹ️ Se ignoraron " + linksVacios + " campo(s) vacío(s).", "info");
  }
}


// =============================================
// FUNCIÓN: Llamar al servidor y descargar un MP3
// =============================================
async function procesarYDescargar(url, numero) {
  try {

    // Le mandamos el link a nuestra Netlify Function
    var respuesta = await fetch(URL_SERVIDOR, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: url })
    });

    var data = await respuesta.json();

    // Si el servidor devolvió un error
    if (!respuesta.ok || data.error) {
      mostrarMensaje("❌ Error en canción #" + numero + ": " + (data.error || "error desconocido"), "error");
      return;
    }

    // Descargamos el archivo con el link que nos devolvió el servidor
    var linkDescarga = data.linkDescarga;
    var nombreArchivo = data.nombreArchivo || ("cancion-" + numero + ".mp3");

    var enlace = document.createElement("a");
    enlace.href = linkDescarga;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    mostrarMensaje("✅ Descargando: " + nombreArchivo, "ok");

  } catch (error) {
    mostrarMensaje("❌ No se pudo conectar al servidor. ¿Está el proyecto en Netlify?", "error");
  }
}


// =============================================
// FUNCIÓN AUXILIAR: Esperar X milisegundos
// =============================================
function esperar(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}


// =============================================
// FUNCIÓN: Mostrar un mensaje en la zona de estado
// =============================================
function mostrarMensaje(texto, tipo) {
  var mensaje = document.createElement("div");
  mensaje.classList.add("mensaje", tipo);
  mensaje.textContent = texto;
  zonaEstado.appendChild(mensaje);

  setTimeout(function () {
    mensaje.style.transition = "opacity 0.4s";
    mensaje.style.opacity = "0";
    setTimeout(function () {
      mensaje.remove();
    }, 400);
  }, 5000);
}


// =============================================
// FUNCIÓN: Limpiar todos los mensajes
// =============================================
function limpiarMensajes() {
  zonaEstado.innerHTML = "";
}