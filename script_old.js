// =============================================
// VARIABLES GLOBALES
// =============================================

// Contador para numerar los inputs (ej: Link #1, Link #2...)
var contadorLinks = 0;

// Referencia al contenedor donde se agregan los inputs
var listaInputs = document.getElementById("lista-inputs");

// Referencia a la zona donde se muestran mensajes
var zonaEstado = document.getElementById("zona-estado");


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
  // Subimos el contador
  contadorLinks = contadorLinks + 1;

  // Creamos el número de este input
  var numeroActual = contadorLinks;

  // Creamos la fila completa (div que contiene etiqueta + input + botón eliminar)
  var fila = document.createElement("div");
  fila.classList.add("fila-input");
  fila.id = "fila-" + numeroActual;

  // Creamos la etiqueta con el número
  var etiqueta = document.createElement("span");
  etiqueta.classList.add("etiqueta-input");
  etiqueta.textContent = "#" + numeroActual;

  // Creamos el input de texto para el link
  var input = document.createElement("input");
  input.type = "text";
  input.classList.add("input-link");
  input.placeholder = "https://ejemplo.com/cancion.mp3";
  input.id = "link-" + numeroActual;

  // Creamos el botón de eliminar para esta fila
  var btnEliminar = document.createElement("button");
  btnEliminar.classList.add("btn-eliminar");
  btnEliminar.title = "Eliminar este link";
  btnEliminar.textContent = "✕";

  // Al hacer clic en eliminar, borramos esta fila
  btnEliminar.onclick = function () {
    eliminarFila(fila);
  };

  // Juntamos todo dentro de la fila
  fila.appendChild(etiqueta);
  fila.appendChild(input);
  fila.appendChild(btnEliminar);

  // Agregamos la fila al contenedor
  listaInputs.appendChild(fila);

  // Enfocamos el nuevo input para que el usuario pueda escribir de inmediato
  input.focus();

  // Limpiamos mensajes anteriores cuando se agrega un input
  limpiarMensajes();
}


// =============================================
// FUNCIÓN: Eliminar una fila específica
// =============================================
function eliminarFila(fila) {
  // Verificamos que no sea la única fila que queda
  var todasLasFilas = listaInputs.querySelectorAll(".fila-input");

  if (todasLasFilas.length === 1) {
    // Si solo queda una, en vez de borrarla, solo limpiamos el input
    var inputDentro = fila.querySelector(".input-link");
    inputDentro.value = "";
    mostrarMensaje("ℹ️ No puedes eliminar el último campo, pero se ha limpiado.", "info");
    return;
  }

  // Animación de salida: hacemos que desaparezca suavemente
  fila.style.transition = "opacity 0.2s, transform 0.2s";
  fila.style.opacity = "0";
  fila.style.transform = "translateX(10px)";

  // Después de la animación, eliminamos el elemento del DOM
  setTimeout(function () {
    fila.remove();
  }, 200);

  limpiarMensajes();
}


// =============================================
// FUNCIÓN: Limpiar todos los links (vaciar inputs)
// =============================================
function limpiarTodo() {
  // Buscamos todos los inputs de link
  var todosLosInputs = listaInputs.querySelectorAll(".input-link");

  // Si ya están todos vacíos, avisamos
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

  // Vaciamos el valor de cada input
  todosLosInputs.forEach(function (input) {
    input.value = "";

    // Pequeña animación de parpadeo para indicar que se limpió
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
// =============================================
function descargarTodo() {
  // Limpiamos mensajes anteriores
  limpiarMensajes();

  // Obtenemos todos los inputs
  var todosLosInputs = listaInputs.querySelectorAll(".input-link");

  // Guardamos los links válidos en un arreglo
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

  // Si no hay ningún link ingresado
  if (linksValidos.length === 0) {
    mostrarMensaje("⚠️ No hay ningún link ingresado. Agrega al menos uno.", "error");
    return;
  }

  // Informamos cuántos links se procesarán
  mostrarMensaje("⬇️ Iniciando descarga de " + linksValidos.length + " archivo(s)...", "info");

  // Descargamos cada link con un pequeño retraso entre uno y otro
  linksValidos.forEach(function (link, indice) {
    // Usamos setTimeout para no lanzar todas las descargas al mismo tiempo
    setTimeout(function () {
      descargarArchivo(link, indice + 1);
    }, indice * 800); // 800ms de espera entre cada descarga
  });

  // Si había campos vacíos, lo informamos también
  if (linksVacios > 0) {
    setTimeout(function () {
      mostrarMensaje("ℹ️ Se ignoraron " + linksVacios + " campo(s) vacío(s).", "info");
    }, linksValidos.length * 800 + 200);
  }
}


// =============================================
// FUNCIÓN: Descargar un archivo individual
// =============================================
function descargarArchivo(url, numero) {
  // Intentamos obtener el nombre del archivo desde el URL
  var nombreArchivo = obtenerNombreArchivo(url, numero);

  // Creamos un enlace invisible y hacemos clic en él para descargar
  var enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.target = "_blank"; // por si el navegador lo abre en vez de descargarlo

  // Lo añadimos brevemente al documento, hacemos clic y lo quitamos
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  // Mostramos mensaje de éxito
  mostrarMensaje("✅ Descarga iniciada: " + nombreArchivo, "ok");
}


// =============================================
// FUNCIÓN: Obtener el nombre del archivo desde el URL
// =============================================
function obtenerNombreArchivo(url, numero) {
  // Intentamos extraer el nombre del archivo del URL
  var partes = url.split("/");
  var ultimaParte = partes[partes.length - 1];

  // Quitamos posibles parámetros del URL (lo que va después del ?)
  ultimaParte = ultimaParte.split("?")[0];

  // Si encontramos un nombre de archivo con extensión, lo usamos
  if (ultimaParte && ultimaParte.includes(".")) {
    return ultimaParte;
  }

  // Si no se pudo extraer, usamos un nombre genérico
  return "cancion-" + numero + ".mp3";
}


// =============================================
// FUNCIÓN: Mostrar un mensaje en la zona de estado
// =============================================
function mostrarMensaje(texto, tipo) {
  // Creamos el elemento del mensaje
  var mensaje = document.createElement("div");
  mensaje.classList.add("mensaje", tipo);
  mensaje.textContent = texto;

  // Lo agregamos a la zona de estado
  zonaEstado.appendChild(mensaje);

  // El mensaje desaparece automáticamente después de 4 segundos
  setTimeout(function () {
    mensaje.style.transition = "opacity 0.4s";
    mensaje.style.opacity = "0";
    setTimeout(function () {
      mensaje.remove();
    }, 400);
  }, 4000);
}


// =============================================
// FUNCIÓN: Limpiar todos los mensajes
// =============================================
function limpiarMensajes() {
  zonaEstado.innerHTML = "";
}