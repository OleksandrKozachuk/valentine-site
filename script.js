// ========= Customize these =========
const CONFIG = {
  herName: "my love", // e.g. "Sofia"
  sweetMessage:
    "Happy Valentine’s Day ❤️\nYou’re my favorite person.\n\nPress play 😘",
  revertAfterMs: 60_000,

  // Makes the sky deterministic + personal:
  skySeed: "our-valentine-2026",

  // Number of unique stars around the heart (last step closes by tapping first star again)
  heartStarCount: 10,

  // Phone-friendly: helps choose nearest star even if you tap slightly off
  tapAssist: true,

  // How close a tap must be to snap (in CSS pixels)
  tapAssistRadius: 34,
};
// ==================================

const el = {
  name: document.getElementById("herName"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  btnArea: document.getElementById("btnArea"),
  toast: document.getElementById("toast"),

  overlay: document.getElementById("overlay"),
  skyScreen: document.getElementById("skyScreen"),
  videoScreen: document.getElementById("videoScreen"),
  closeOverlay: document.getElementById("closeOverlay"),
  closeVideo: document.getElementById("closeVideo"),
  backToSky: document.getElementById("backToSky"),

  progress: document.getElementById("progress"),
  canvas: document.getElementById("skyCanvas"),
  resetSky: document.getElementById("resetSky"),
  hintSky: document.getElementById("hintSky"),
  autoHelp: document.getElementById("autoHelp"),

  sweetMsg: document.getElementById("sweetMsg"),
  video: document.getElementById("valentineVideo"),
};

el.name.textContent = CONFIG.herName;
el.sweetMsg.textContent = CONFIG.sweetMessage;

// ---------- Toast ----------
function showToast(text) {
  el.toast.textContent = text;
  el.toast.classList.add("show");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => el.toast.classList.remove("show"), 1100);
}

// ---------- No Button Logic ----------
let noAttempts = 0;
let lastPointerAttemptTs = 0;
let noIsConverted = false;
let revertTimer = null;

const messages = [
  "Not today",
  "Don't even try more",
  "May be next time",
  "Stop it",
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function moveNoButton() {
  const areaRect = el.btnArea.getBoundingClientRect();
  const btnRect = el.noBtn.getBoundingClientRect();

  el.noBtn.style.position = "absolute";

  const padding = 8;
  const maxLeft = Math.max(padding, areaRect.width - btnRect.width - padding);
  const maxTop = Math.max(padding, areaRect.height - btnRect.height - padding);

  const left = rand(padding, maxLeft);
  const top = rand(padding, maxTop);

  el.noBtn.style.left = `${left}px`;
  el.noBtn.style.top = `${top}px`;
}

function setNoAsNo() {
  noIsConverted = false;
  el.noBtn.classList.remove("yes");
  el.noBtn.classList.add("no");
  el.noBtn.textContent = "No 🙈";
  el.noBtn.style.position = "relative";
  el.noBtn.style.left = "auto";
  el.noBtn.style.top = "auto";
}

function setNoAsYes() {
  noIsConverted = true;
  el.noBtn.classList.remove("no");
  el.noBtn.classList.add("yes");
  el.noBtn.textContent = "Yes 💞";
  el.noBtn.style.position = "relative";
  el.noBtn.style.left = "auto";
  el.noBtn.style.top = "auto";

  if (revertTimer) window.clearTimeout(revertTimer);
  revertTimer = window.setTimeout(() => {
    setNoAsNo();
    showToast("Okay… No is back 🙈");
  }, CONFIG.revertAfterMs);
}

function handleNoAttempt(e) {
  if (noIsConverted) return;

  e.preventDefault();
  e.stopPropagation();

  noAttempts += 1;
  lastPointerAttemptTs = performance.now();

  moveNoButton();

  if (noAttempts % 3 === 0) {
    const idx = Math.min(messages.length - 1, (noAttempts / 3) - 1);
    showToast(messages[idx]);
  }

  if (noAttempts % 9 === 0) {
    setNoAsYes();
    showToast("Fine… YES 😅");
  }
}

function handleNoHover() {
  if (noIsConverted) return;
  moveNoButton();
}

// ---------- Overlay navigation ----------
function showOverlay() {
  el.overlay.classList.add("show");
  el.overlay.setAttribute("aria-hidden", "false");
}
function hideOverlay() {
  el.overlay.classList.remove("show");
  el.overlay.setAttribute("aria-hidden", "true");
}

function showSkyScreen() {
  el.skyScreen.hidden = false;
  el.videoScreen.hidden = true;
  // stop video if coming back
  if (el.video) {
    el.video.pause();
  }
}

function showVideoScreen() {
  el.skyScreen.hidden = true;
  el.videoScreen.hidden = false;

  // attempt to play (still user-initiated flow, but controls are available anyway)
  el.video?.play().catch(() => {});
}

function openSurprise() {
  showOverlay();
  showSkyScreen();
  resetConstellation();
  showToast("Tap the glowing star ✨");
}

function closeSurprise() {
  hideOverlay();
  // reset video state
  if (el.video) {
    el.video.pause();
    el.video.currentTime = 0;
  }
}

// YES opens overlay
el.yesBtn.addEventListener("click", () => {
  showToast("YAY 💘");
  openSurprise();
});

// Converted YES (former No) also opens overlay
el.noBtn.addEventListener("click", (e) => {
  if (!noIsConverted) {
    const now = performance.now();
    if (now - lastPointerAttemptTs < 250) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleNoAttempt(e);
  } else {
    showToast("Best answer 😘");
    openSurprise();
  }
});
el.noBtn.addEventListener("pointerdown", handleNoAttempt, { passive: false });
el.noBtn.addEventListener("mouseenter", handleNoHover);

el.closeOverlay.addEventListener("click", closeSurprise);
el.closeVideo.addEventListener("click", closeSurprise);
el.backToSky.addEventListener("click", () => {
  showSkyScreen();
  showToast("Finish the heart 💗");
});

window.addEventListener("resize", () => {
  if (!noIsConverted) {
    el.noBtn.style.position = "relative";
    el.noBtn.style.left = "auto";
    el.noBtn.style.top = "auto";
  }
  resizeCanvasToCSS();
  drawSky();
});

// ---------- Constellation (Canvas) ----------
const ctx = el.canvas.getContext("2d");

let cssW = 0, cssH = 0, dpr = 1;
let bgStars = [];
let heartStars = [];     // unique stars
let seq = [];            // click order (includes 0 again at end)
let clickedSeqPos = 0;   // progress through seq
let hintPulse = 0;
let assistOn = CONFIG.tapAssist;

el.autoHelp.textContent = `Tap Assist: ${assistOn ? "ON" : "OFF"}`;

// Seeded RNG for consistent sky
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

function resizeCanvasToCSS() {
  const rect = el.canvas.getBoundingClientRect();
  cssW = Math.max(1, rect.width);
  cssH = Math.max(1, rect.height);
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  el.canvas.width = Math.floor(cssW * dpr);
  el.canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function generateSky() {
  const seedFn = xmur3(CONFIG.skySeed);
  const rng = mulberry32(seedFn());

  // background stars
  const bgCount = Math.floor((cssW * cssH) / 12000);
  bgStars = Array.from({ length: Math.max(80, bgCount) }, () => ({
    x: rng() * cssW,
    y: rng() * cssH,
    r: 0.6 + rng() * 1.8,
    a: 0.10 + rng() * 0.35,
    tw: rng() * 1000
  }));

  // heart points (unique)
  const n = Math.max(8, CONFIG.heartStarCount);
  const heartPts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    heartPts.push({ x, y });
  }

  // normalize to [0..1]
  const xs = heartPts.map(p => p.x);
  const ys = heartPts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const norm = heartPts.map(p => ({
    x: (p.x - minX) / (maxX - minX),
    y: (p.y - minY) / (maxY - minY),
  }));

  // fit to canvas with margins
  const margin = Math.min(cssW, cssH) * 0.12;
  const w = cssW - margin * 2;
  const h = cssH - margin * 2;

  heartStars = norm.map((p, i) => {
    const jx = (rng() - 0.5) * 10;
    const jy = (rng() - 0.5) * 10;
    return {
      x: margin + p.x * w + jx,
      y: margin + (1 - p.y) * h + jy,
      idx: i
    };
  });

  // CLICK SEQUENCE: 0..n-1 then 0 again to CLOSE the heart
  seq = Array.from({ length: n }, (_, i) => i);
  seq.push(0);
}

function updateProgressText() {
  const total = seq.length;
  const step = Math.min(total, clickedSeqPos + 1);
  el.progress.textContent = `Tap the glowing star (${step}/${total})`;
}

function resetConstellation() {
  resizeCanvasToCSS();
  generateSky();
  clickedSeqPos = 0;
  hintPulse = 0;
  updateProgressText();
  drawSky();
}

function drawSky() {
  // clear
  ctx.clearRect(0, 0, cssW, cssH);

  // background gradient glow
  const bg = ctx.createRadialGradient(cssW * 0.2, cssH * 0.15, 10, cssW * 0.5, cssH * 0.6, Math.max(cssW, cssH));
  bg.addColorStop(0, "rgba(255,255,255,0.10)");
  bg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  const now = performance.now();

  // bg stars (twinkle)
  for (const s of bgStars) {
    const tw = 0.6 + 0.4 * Math.sin((now + s.tw) / 700);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${s.a * tw})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw path lines following sequence clicks
  if (clickedSeqPos > 1) {
    ctx.save();
    ctx.lineWidth = Math.max(2, Math.min(4, cssW / 240));
    ctx.strokeStyle = "rgba(255, 200, 220, 0.78)";
    ctx.shadowColor = "rgba(255, 120, 170, 0.45)";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    const firstIdx = seq[0];
    ctx.moveTo(heartStars[firstIdx].x, heartStars[firstIdx].y);

    for (let k = 1; k < clickedSeqPos; k++) {
      const idx = seq[k];
      ctx.lineTo(heartStars[idx].x, heartStars[idx].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // highlight next target
  const nextIdx = seq[Math.min(clickedSeqPos, seq.length - 1)];
  const pulse = 0.6 + 0.4 * Math.sin(now / 220);

  // draw heart stars
  for (let i = 0; i < heartStars.length; i++) {
    const s = heartStars[i];

    // determine if this star has been visited at least once in sequence so far
    let visited = false;
    for (let k = 0; k < clickedSeqPos; k++) {
      if (seq[k] === i) { visited = true; break; }
    }

    const isNext = (i === nextIdx) && (clickedSeqPos < seq.length);

    const coreR = Math.max(4.6, Math.min(7.2, cssW / 140));
    const haloR = isNext ? coreR * 3.2 : coreR * 2.6;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = visited ? "rgba(255,255,255,0.95)" : `rgba(255,255,255,${isNext ? 0.85 : 0.45})`;
    ctx.shadowColor = "rgba(255, 90, 140, 0.65)";
    ctx.shadowBlur = isNext ? 26 : (visited ? 18 : 12);
    ctx.arc(s.x, s.y, visited ? coreR * 1.05 : coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = isNext
      ? `rgba(255, 150, 200, ${0.45 + 0.35 * pulse})`
      : `rgba(255, 150, 200, ${visited ? 0.50 : 0.20})`;
    ctx.lineWidth = visited ? 2 : 1;
    ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // hint sparkle near next star
  if (hintPulse > 0 && clickedSeqPos < seq.length) {
    const s = heartStars[nextIdx];
    const a = Math.min(1, hintPulse);
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
    ctx.shadowColor = "rgba(255, 180, 210, 0.9)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(s.x + 18, s.y - 18, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function findNearestStar(x, y, radius) {
  let best = { idx: -1, d2: Infinity };
  for (let i = 0; i < heartStars.length; i++) {
    const s = heartStars[i];
    const dx = x - s.x;
    const dy = y - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best.d2) best = { idx: i, d2 };
  }
  if (best.idx === -1) return -1;
  return best.d2 <= radius * radius ? best.idx : -1;
}

function onCanvasPointerDown(evt) {
  evt.preventDefault();

  if (clickedSeqPos >= seq.length) return;

  const rect = el.canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left);
  const y = (evt.clientY - rect.top);

  const nextIdx = seq[clickedSeqPos];

  let hit = -1;

  // Tap Assist makes phone taps forgiving:
  if (assistOn) {
    hit = findNearestStar(x, y, CONFIG.tapAssistRadius);
  } else {
    // stricter hit test
    hit = findNearestStar(x, y, 18);
  }

  if (hit === -1) {
    showToast("Tap near the glowing star ✨");
    hintPulse = 1;
    return;
  }

  if (hit !== nextIdx) {
    showToast("Not that one 😉");
    hintPulse = 1;
    return;
  }

  // correct
  clickedSeqPos++;
  updateProgressText();

  if (clickedSeqPos >= seq.length) {
    // COMPLETE -> go to video view
    showToast("Heart completed 💗");
    // tiny pause feels nicer
    setTimeout(() => {
      showVideoScreen();
      showOverlay();
      el.video?.play().catch(() => {});
    }, 450);
  } else {
    showToast("✨");
  }
}

function animate() {
  if (hintPulse > 0) hintPulse = Math.max(0, hintPulse - 0.03);
  drawSky();
  requestAnimationFrame(animate);
}

// Controls
el.resetSky.addEventListener("click", () => {
  resetConstellation();
  showToast("Reset ✨");
});
el.hintSky.addEventListener("click", () => {
  hintPulse = 1;
  showToast("Look for the glow ✨");
});
el.autoHelp.addEventListener("click", () => {
  assistOn = !assistOn;
  el.autoHelp.textContent = `Tap Assist: ${assistOn ? "ON" : "OFF"}`;
  showToast(assistOn ? "Tap Assist enabled ✅" : "Tap Assist disabled");
});

// Canvas events (pointer works well on phones + desktops)
el.canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: false });

// Video screen close/back
el.backToSky.addEventListener("click", () => {
  showSkyScreen();
  showToast("Finish the heart 💗");
});
el.closeVideo.addEventListener("click", closeSurprise);

// Start animation loop
resizeCanvasToCSS();
generateSky();
updateProgressText();
requestAnimationFrame(animate);

// When overlay opens, we reset properly (in openSurprise()).
