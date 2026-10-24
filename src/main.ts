import "./styles.css";
import {
  DURACION_QUITAR_FILA_MS,
  DURACION_SALIDA_MS,
  DURACION_TOAST_MS,
  ESCALONADO_LIMPIAR_MS,
  EstadoFila,
  PEGADO_MS,
  RIPPLE_MS,
  PAUSA_ENTRE_DESCARGAS_MS,
  PALABRAS_ROTATIVAS,
  ROTACION_MS,
  TEXTO,
  TipoToast,
} from "./constants";
import { iniciarEscena } from "./escena";
import { descargarCancion, esperar } from "./services";
import type { Pendiente } from "./types";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const lista = $<HTMLUListElement>("lista");
const estado = $<HTMLDivElement>("estado");
const contador = $<HTMLSpanElement>("contador");
const btnDescargar = $<HTMLButtonElement>("btn-descargar");

const filas = () =>
  Array.from(lista.querySelectorAll<HTMLLIElement>(`.item:not(.${EstadoFila.Quitando})`));
const inputDe = (fila: HTMLElement) => fila.querySelector<HTMLInputElement>(".link")!;
const resetEstado = (fila: HTMLElement) =>
  fila.classList.remove(EstadoFila.Ok, EstadoFila.Error, EstadoFila.Ocupado);

/** Numeración y contador continuos: se recalculan tras cada cambio. */
function actualizar(animar = false): void {
  const todas = filas();
  todas.forEach((f, i) => (f.querySelector(".num")!.textContent = String(i + 1)));
  const llenas = todas.filter((f) => inputDe(f).value.trim() !== "").length;
  const texto = TEXTO.contador(llenas, todas.length);
  if (contador.textContent !== texto || animar) {
    contador.innerHTML = `<span class="roll">${texto}</span>`;
  }
}

function agregarInput(enfocar = true): void {
  const li = document.createElement("li");
  li.className = "item";
  li.innerHTML = `
    <div class="item-inner"><div class="item-row">
      <span class="num"></span>
      <input class="link" type="url" inputmode="url" autocomplete="off" autocapitalize="off"
             spellcheck="false" placeholder="https://music.youtube.com/watch?v=…" aria-label="Enlace" />
      <button class="remove" type="button" aria-label="Quitar enlace">−</button>
    </div></div>`;
  inputDe(li).addEventListener("input", () => actualizar());
  inputDe(li).addEventListener("paste", () => {
    li.classList.add("pegado");
    setTimeout(() => li.classList.remove("pegado"), PEGADO_MS);
  });
  li.querySelector(".remove")!.addEventListener("click", () => quitarFila(li));
  lista.appendChild(li);
  actualizar(true);
  if (enfocar) {
    li.classList.add("nueva");
    setTimeout(() => li.classList.remove("nueva"), PEGADO_MS);
    li.scrollIntoView({ behavior: "smooth", block: "nearest" });
    inputDe(li).focus({ preventScroll: true });
  }
}

function quitarFila(fila: HTMLLIElement): void {
  if (filas().length === 1) {
    inputDe(fila).value = "";
    resetEstado(fila);
    actualizar(true);
    return;
  }
  fila.classList.add(EstadoFila.Quitando);
  actualizar(true); // la fila ya no cuenta: numeración y contador se corrigen al instante
  setTimeout(() => fila.remove(), DURACION_QUITAR_FILA_MS);
}

function limpiarTodo(): void {
  const todas = filas();
  todas[0].classList.add("destello");
  setTimeout(() => todas[0].classList.remove("destello"), PEGADO_MS);
  inputDe(todas[0]).value = "";
  resetEstado(todas[0]);
  todas.slice(1).forEach((f, i) => setTimeout(() => quitarFila(f), i * ESCALONADO_LIMPIAR_MS));
  actualizar(true);
}

function toast(texto: string, tipo: TipoToast = TipoToast.Info): void {
  const el = document.createElement("div");
  el.className = tipo === TipoToast.Info ? "toast" : `toast ${tipo}`;
  el.textContent = texto;
  el.style.setProperty("--dur", `${DURACION_TOAST_MS}ms`);
  estado.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), DURACION_SALIDA_MS);
  }, DURACION_TOAST_MS);
}

async function descargarFila({ fila, n, url }: Pendiente): Promise<boolean> {
  resetEstado(fila);
  fila.classList.add(EstadoFila.Ocupado);
  try {
    const nombre = await descargarCancion(url, n);
    fila.classList.add(EstadoFila.Ok);
    toast(TEXTO.descargado(nombre), TipoToast.Ok);
    return true;
  } catch (e) {
    fila.classList.add(EstadoFila.Error);
    toast(TEXTO.errorEnlace(n, (e as Error).message), TipoToast.Error);
    return false;
  } finally {
    fila.classList.remove(EstadoFila.Ocupado);
  }
}

async function descargarTodo(): Promise<void> {
  const pendientes: Pendiente[] = filas()
    .map((fila, i) => ({ fila, n: i + 1, url: inputDe(fila).value.trim() }))
    .filter((p) => p.url !== "");

  if (pendientes.length === 0) {
    toast(TEXTO.sinEnlaces, TipoToast.Error);
    return;
  }

  btnDescargar.disabled = true;
  let ok = 0;
  for (const [i, p] of pendientes.entries()) {
    btnDescargar.textContent = TEXTO.progreso(i + 1, pendientes.length);
    btnDescargar.style.setProperty("--p", `${(i / pendientes.length) * 100}%`);
    if (await descargarFila(p)) ok++;
    btnDescargar.style.setProperty("--p", `${((i + 1) / pendientes.length) * 100}%`);
    if (i < pendientes.length - 1) await esperar(PAUSA_ENTRE_DESCARGAS_MS);
  }
  await esperar(500);
  btnDescargar.disabled = false;
  btnDescargar.textContent = TEXTO.descargarTodo;
  btnDescargar.style.setProperty("--p", "0%");
  toast(TEXTO.resumen(ok, pendientes.length), ok === pendientes.length ? TipoToast.Ok : TipoToast.Info);
}

$("btn-agregar").addEventListener("click", () => agregarInput());
$("btn-limpiar").addEventListener("click", limpiarTodo);
btnDescargar.addEventListener("click", descargarTodo);

/** Ripple táctil en botones. */
document.addEventListener("pointerdown", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLElement>(".btn, .row-button");
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const o = document.createElement("span");
  o.className = "ripple";
  o.style.cssText = `width:${size}px;height:${size}px;left:${ev.clientX - r.left - size / 2}px;top:${ev.clientY - r.top - size / 2}px`;
  btn.appendChild(o);
  setTimeout(() => o.remove(), RIPPLE_MS);
});

/** Títulos palabra por palabra. */
document.querySelectorAll<HTMLElement>(".split").forEach((el) => {
  const palabras = (el.textContent ?? "").trim().split(/\s+/);
  el.innerHTML = palabras.map((p, i) => `<span class="w" style="--i:${i}">${p}</span>`).join(" ");
});

/** Palabra que rota bajo el título. */
const palabraEl = $<HTMLSpanElement>("palabra");
let idxPalabra = 0;
setInterval(() => {
  palabraEl.className = "palabra sale";
  setTimeout(() => {
    idxPalabra = (idxPalabra + 1) % PALABRAS_ROTATIVAS.length;
    palabraEl.textContent = PALABRAS_ROTATIVAS[idxPalabra];
    palabraEl.className = "palabra entra";
  }, 350);
}, ROTACION_MS);

iniciarEscena();
agregarInput(false);
