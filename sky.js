const C = window.APP_CONFIG;

const wrap = document.getElementById("canvasWrap");
const canvas = document.getElementById("skyCanvas");
const ctx = canvas.getContext("2d");
const progress = document.getElementById("progress");
const toast = document.getElementById("toast");

let cssW = 0, cssH = 0, dpr = 1;
let bgStars = [];
let heartStars = [];
let seq = [];
let pos = 0;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 900);
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resizeCanvas() {
  const r = wrap.getBoundingClientRect();
  cssW = r.width;
  cssH = r.height;
  if (cssW < 40 || cssH < 40) return false;

  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function buildSky() {
  const seedFn = xmur3(C.skySeed);
  const rng = mulberry32(seedFn());

  const bgCount = Math.max(140, Math.floor((cssW * cssH) / 9000));
  bgStars = Array.from({ length: bgCount }, () => ({
    x: rng() * cssW,
    y: rng() * cssH,
    r: 0.6 + rng() * 1.8,
    a: 0.08 + rng() * 0.35,
    tw: rng() * 1000
  }));

  const n = Math.max(8, C.heartStarCount);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    pts.push({ x, y });
  }

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const norm = pts.map(p => ({
    x: (p.x - minX) / (maxX - minX),
    y: (p.y - minY) / (maxY - minY),
  }));

  const margin = Math.min(cssW, cssH) * 0.12;
  const w = cssW - margin * 2;
  const h = cssH - margin * 2;

  heartStars = norm.map(p => ({
    x: margin + p.x * w + (rng() - 0.5) * 10,
    y: margin + (1 - p.y) * h + (rng() - 0.5) * 10,
  }));

  seq = Array.from({ length: n }, (_, i) => i);
  seq.push(0); // close heart

  pos = 0;
  updateProgress();
}

function updateProgress() {
  const total = seq.length;
  const step = Math.min(total, pos + 1);
  progress.textContent = `Tap the glowing star (${step}/${total})`;
}

function draw() {
  if (!seq.length) return;

  ctx.clearRect(0, 0, cssW, cssH);
  const now = performance.now();

  const bg = ctx.createRadialGradient(cssW * 0.2, cssH * 0.15, 10, cssW * 0.5, cssH * 0.6, Math.max(cssW, cssH));
  bg.addColorStop(0, "rgba(255,255,255,0.10)");
  bg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  for (const s of bgStars) {
    const tw = 0.6 + 0.4 * Math.sin((now + s.tw) / 700);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${s.a * tw})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // lines
  if (pos > 1) {
    ctx.save();
    ctx.lineWidth = Math.max(2, Math.min(4, cssW / 240));
    ctx.strokeStyle = "rgba(255, 200, 220, 0.78)";
    ctx.shadowColor = "rgba(255, 120, 170, 0.45)";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(heartStars[seq[0]].x, heartStars[seq[0]].y);
    for (let k = 1; k < pos; k++) {
      const idx = seq[k];
      ctx.lineTo(heartStars[idx].x, heartStars[idx].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // stars
  const nextIdx = seq[Math.min(pos, seq.length - 1)];
  const pulse = 0.6 + 0.4 * Math.sin(now / 220);

  for (let i = 0; i < heartStars.length; i++) {
    const s = heartStars[i];
    const isNext = (i === nextIdx) && (pos < seq.length);

    const coreR = Math.max(5, Math.min(8, cssW / 140));
    const haloR = isNext ? coreR * 3.2 : coreR * 2.6;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${isNext ? 0.90 : 0.45})`;
    ctx.shadowColor = "rgba(255, 90, 140, 0.65)";
    ctx.shadowBlur = isNext ? 26 : 12;
    ctx.arc(s.x, s.y, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = isNext ? `rgba(255,150,200,${0.45 + 0.35 * pulse})` : "rgba(255,150,200,0.20)";
    ctx.lineWidth = isNext ? 2 : 1;
    ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function nearestStar(x, y, radius) {
  let best = { idx: -1, d2: Infinity };
  for (let i = 0; i < heartStars.length; i++) {
    const s = heartStars[i];
    const dx = x - s.x;
    const dy = y - s.y;
    const d2 = dx*dx + dy*dy;
    if (d2 < best.d2) best = { idx: i, d2 };
  }
  return (best.idx !== -1 && best.d2 <= radius*radius) ? best.idx : -1;
}

function complete() {
  sessionStorage.setItem("heartDone", "1");
  sessionStorage.setItem("sudokuDone", "0");
  showToast("Heart completed 💗");
  setTimeout(() => (window.location.href = "sudoku.html"), 350);
}

canvas.addEventListener("pointerdown", (evt) => {
  evt.preventDefault();
  if (!seq.length) return;

  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;

  const target = seq[pos];
  const hit = nearestStar(x, y, C.tapAssistRadius); // always forgiving

  if (hit !== target) {
    showToast("Tap the glowing star ✨");
    return;
  }

  pos++;
  updateProgress();
  if (pos >= seq.length) complete();
  else showToast("✨");
}, { passive: false });

function init() {
  const attempt = () => {
    if (!resizeCanvas()) return requestAnimationFrame(attempt);
    buildSky();
  };
  requestAnimationFrame(() => requestAnimationFrame(attempt));
}
init();

new ResizeObserver(() => {
  if (!resizeCanvas()) return;
  buildSky();
}).observe(wrap);

(function loop(){
  draw();
  requestAnimationFrame(loop);
})();
