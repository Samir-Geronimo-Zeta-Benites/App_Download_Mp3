import { ESCENA } from "./constants";

/**
 * Visualizador de audio simulado (espectro circular espejado, en versión propia):
 * barras, pulso de bombo, ondas de choque y chispas.
 * No analiza audio real: la señal se genera con funciones del tiempo.
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** Azul → violeta → naranja según la posición (0..1). */
const color = (p: number, alfa: number) => {
  const q = clamp(p);
  const h = q < 0.5 ? lerp(208, 278, q * 2) : lerp(278, 388, (q - 0.5) * 2);
  return `hsla(${h % 360},95%,${62 + 8 * Math.sin(q * Math.PI)}%,${alfa})`;
};

export function iniciarEscena(): void {
  const canvas = document.getElementById("escena") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  let W = 0;
  let H = 0;
  let visible = true;
  const inicio = performance.now();
  let objX = 0;
  let objY = 0;
  let px = 0;
  let py = 0;

  function ajustar(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function dibujar(entrada: number, t: number): void {
    const ent = easeOut(entrada);
    px = lerp(px, objX, 0.06);
    py = lerp(py, objY, 0.06);

    // Pulso de bombo: decae rápido tras cada tiempo del compás
    const beats = (t * ESCENA.BPM) / 60;
    const beatIdx = Math.floor(beats);
    const fase = beats - beatIdx;
    const kick = Math.exp(-fase * 5.5) * ent;

    const R = Math.min(W * 0.2, H * 0.2) * (0.6 + 0.4 * ent);
    const cx = W / 2 + px * 18;
    const cy = H * 0.5 + py * 12;

    ctx.clearRect(0, 0, W, H);

    // Polvo de luz de fondo
    for (let i = 0; i < ESCENA.PARTICULAS; i++) {
      const a = hash(i);
      const b = hash(i + 91);
      const vel = 0.012 + b * 0.03;
      const y = H - (((t * vel + a) % 1) * (H + 40) - 20);
      const x = a * W + Math.sin(t * 0.6 + i) * 14 - px * 8 * (1 + vel * 20);
      ctx.fillStyle = `rgba(160,205,255,${(0.15 + 0.35 * Math.abs(Math.sin(t * 0.9 + i))) * ent})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + b * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Resplandor que respira con el bombo
    const halo = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * (3.2 + kick));
    halo.addColorStop(0, `rgba(41,151,255,${(0.18 + 0.3 * kick) * ent})`);
    halo.addColorStop(0.5, `rgba(120,70,255,${0.07 * ent})`);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // Ondas de choque: una por tiempo, expandiéndose
    for (let k = 0; k < ESCENA.ONDAS; k++) {
      if (beatIdx - k < 0) continue;
      const q = (fase + k) / ESCENA.ONDAS;
      ctx.strokeStyle = color(((beatIdx - k) * 0.17) % 1, (1 - q) * 0.35 * ent);
      ctx.lineWidth = 2 * (1 - q) + 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1.15 + q * 2.4), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Chispas: salen disparadas en cada tiempo
    for (let k = 0; k < 2; k++) {
      const bi = beatIdx - k;
      if (bi < 0) continue;
      const edad = fase + k;
      for (let i = 0; i < ESCENA.CHISPAS; i++) {
        const ang = hash(bi * 13 + i) * Math.PI * 2;
        const vel = 0.9 + hash(bi * 7 + i * 3) * 1.8;
        const rr = R * (1.25 + edad * vel);
        ctx.fillStyle = color(hash(bi + i * 5), clamp(1 - edad / 2) * 0.8 * ent);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 1.2 + hash(i + bi) * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Espectro circular espejado (eje vertical), con graves abajo
    const n = ESCENA.BARRAS;
    const mitad = n / 2;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, (R * 2 * Math.PI) / n / 2.2);
    for (let i = 0; i < n; i++) {
      const j = i < mitad ? i : n - 1 - i;
      const f = j / mitad; // 0 = graves, 1 = agudos
      const ruido = Math.abs(Math.sin(j * 0.52 + t * 3.1) * Math.cos(j * 0.17 - t * 1.7));
      const brillo = 0.18 + 0.82 * Math.pow(ruido, 1.1);
      const energia = brillo * (0.45 + 0.55 * kick * (1 - f * 0.7)) + 0.06;
      const largo = R * (0.08 + 1.05 * energia) * ent;
      const ang = Math.PI / 2 + ((i + 0.5) / n) * Math.PI * 2;
      const r0 = R * 1.12;
      ctx.strokeStyle = color(f, 0.45 + 0.55 * clamp(energia));
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      ctx.lineTo(cx + Math.cos(ang) * (r0 + largo), cy + Math.sin(ang) * (r0 + largo));
      ctx.stroke();
    }

    // Núcleo de cristal con la nota
    const rc = R * (1 + 0.07 * kick);
    const cuerpo = ctx.createRadialGradient(cx - rc * 0.3, cy - rc * 0.35, rc * 0.1, cx, cy, rc);
    cuerpo.addColorStop(0, "#5ec4ff");
    cuerpo.addColorStop(0.55, "#1d6dff");
    cuerpo.addColorStop(1, "#3a1fa8");
    ctx.save();
    ctx.shadowColor = "rgba(41,151,255,0.8)";
    ctx.shadowBlur = 30 + 40 * kick;
    ctx.fillStyle = cuerpo;
    ctx.beginPath();
    ctx.arc(cx, cy, rc, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const brilloG = ctx.createLinearGradient(cx, cy - rc, cx, cy);
    brilloG.addColorStop(0, "rgba(255,255,255,0.45)");
    brilloG.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = brilloG;
    ctx.beginPath();
    ctx.ellipse(cx, cy - rc * 0.45, rc * 0.7, rc * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `600 ${rc * 1.05}px -apple-system, "Segoe UI Symbol", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♪", cx, cy + rc * 0.04);
  }

  function bucle(ahora: number): void {
    requestAnimationFrame(bucle);
    if (!visible) return;
    const entrada = clamp((ahora - inicio) / ESCENA.ENTRADA_MS);
    try {
      dibujar(entrada, (ahora - inicio) / 1000);
    } catch (err) {
      console.error(err);
    }
  }

  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  window.addEventListener("pointermove", (ev) => {
    objX = (ev.clientX / window.innerWidth - 0.5) * 2;
    objY = (ev.clientY / window.innerHeight - 0.5) * 2;
  });
  new ResizeObserver(ajustar).observe(canvas);
  ajustar();
  requestAnimationFrame(bucle);
}
