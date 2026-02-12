// ========= Customize these =========
const CONFIG = {
  herName: "my love",
  sweetMessage: "Happy Valentine’s Day ❤️\nYou’re my favorite person.\n\nPress play 😘",
  revertAfterMs: 60000,

  skySeed: "our-valentine-2026",
  heartStarCount: 10,

  tapAssistDefault: true,
  tapAssistRadius: 36,
};
// ==================================

const el = {
  name: document.getElementById("herName"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  btnArea: document.getElementById("btnArea"),
  toast: document.getElementById("toast"),

  overlay: document.getElementById("overlay"),
  confirmScreen: document.getElementById("confirmScreen"),
  skyScreen: document.getElementById("skyScreen"),
  videoScreen: document.getElementById("videoScreen"),

  confirmImg: document.getElementById("confirmImg"),

  closeOverlay: document.getElementById("closeOverlay"),
  confirmYes: document.getElementById("confirmYes"),
  confirmNo: document.getElementById("confirmNo"),

  closeSky: document.getElementById("closeSky"),
  closeVideo: document.getElementById("closeVideo"),
  restart: document.getElementById("restart"),

  progress: document.getElementById("progress"),
  canvasWrap: document.getElementById("canvasWrap"),
  canvas: document.getElementById("skyCanvas"),
  resetSky: document.getElementById("resetSky"),
  hintSky: document.getElementById("hintSky"),
  tapAssistBtn: document.getElementById("tapAssistBtn"),

  sweetMsg: document.getElementById("sweetMsg"),
  video: document.getElementById("valentineVideo"),
  videoErrorBox: document.getElementById("videoErrorBox"),
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

// ---------- Overlay + screen switching ----------
function overlayOn() {
  el.overlay.classList.add("show");
  el.overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function overlayOff() {
  el.overlay.classList.remove("show");
  el.overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showScreen(which) {
  el.confirmScreen.hidden = which !== "confirm";
  el.skyScreen.hidden = which !== "sky";
  el.videoScreen.hidden = which !== "video";
}

// ---------- Confirm image: auto-try common extensions ----------
function setupConfirmImageFallback() {
  const candidates = [
    "assets/confirm.jpeg",
    "assets/confirm.jpg",
    "assets/confirm.png",
    "assets/confirm.webp",
  ];
  let i = 0;

  const tryNext = () => {
    if (i >= candidates.length) {
      // If nothing found, make it obvious why
      el.confirmImg.alt = "Image missing. Put confirm.jpg (or .jpeg/.png) in assets/";
      showToast("Add your image: assets/confirm.jpg (or .jpeg/.png)");
      return;
    }
    el.confirmImg.src = candidates[i++];
  };

  el.confirmImg.onerror = tryNext;
  // start attempt
  tryNext();
}
setupConfirmImageFallback();

// ---------- Video helpers ----------
function clearVideoError() {
  el.videoErrorBox.hidden = true;
  el.videoErrorBox.textContent = "";
}
function showVideoError(html) {
  el.videoErrorBox.hidden = false;
  el.videoErrorBox.innerHTML = html;
}
function stopVideo() {
  if (!el.video) return;
  try { el.video.pause(); } catch {}
  try { el.video.currentTime = 0; } catch {}
}
function loadVideo() {
  clearVideoError();
  try { el.video.load(); } catch {}
}
function tryPlayVideo() {
  const p = el.video?.play?.();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

if (el.video) {
  el.video.addEventListener("error", () => {
    showVideoError(
      `⚠️ Video can’t play.<br><br>
       <b>Check path:</b> <code>assets/valentine.mp4</code> (case-sensitive on GitHub).<br>
       <b>Codec:</b> MP4 must be H.264 + AAC (many iPhone videos are HEVC/H.265).<br><br>
       <b>Fix with ffmpeg:</b><br>
       <code>ffmpeg -i input.mp4 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart assets/valentine.mp4</code>`
    );
  });
}

// ---------- Close all ----------
function closeAll() {
  overlayOff();
  showScreen("confirm");
  stopVideo();
  clearVideoError();
  resetSkyState();
}

// ---------- No button dodge logic ----------
let noAttempts = 0;
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

  const padding = 10;
  const maxLeft = Math.max(padding, areaRect.width - btnRect.width - padding);
  const maxTop = Math.max(padding, areaRect.height - btnRect.height - padding);

  el.noBtn.style.left = `${rand(padding, maxLeft)}px`;
  el.noBtn.style.top = `${rand(padding, maxTop)}px`;
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

// dodge on intent (tap/click)
el.noBtn.addEventListener("pointerdown", handleNoAttempt, { passive: false });

// if it became YES, clicking it starts YES flow
el.noBtn.addEventListener("click", (e) => {
  if (!noIsConverted) {
    // pointerdown already handled; prevent noisy click behavior
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  startConfirmFlow();
});

// ---------- YES flow: Confirm -> Sky -> Video (ONLY after heart complete) ----------
function startConfirmFlow() {
  stopVideo();
  clearVideoError();
  resetSkyState();

  overlayOn();
  showScreen("confirm");
  showToast("One more question… 😌");
}

el.yesBtn.addEventListener("click", startConfirmFlow);

el.confirmNo.addEventListener("click", () => {
  showToast("Okay 🙂");
  closeAll();
});

el.confirmYes.addEventListener("click", () => {
  showScreen("sky");
  // Ensure canvas is sized AFTER it becomes visible
  startSky();
  showToast("Tap the glowing star ✨");
});

el.closeOverlay.addEventListener("click", closeAll);
el.closeSky.addEventListener("click", closeAll);
el.closeVideo.addEventListener("click", closeAll);

el.restart.addEventListener("click", () => {
  stopVideo();
  clearVideoError();
  showScreen("sky");
  startSky(true);
  showToast("Let’s do it again ✨");
});

// ---------- Sky (Canvas) ----------
const ctx = el.canvas.getContext("2d");

let cssW = 0, cssH = 0, dpr = 1;
let bgStars = [];
let heartStars = [];
let seq = [];
let clickedSeqPos = 0;
let hintPulse = 0;
let tapAssistOn = CONFIG.tapAssistDefault;
let skyReady = false;

el.tapAssistBtn.textContent = `Tap Assist: ${tapAssistOn ? "ON" : "OFF"}`;

function resetSkyState() {
  bgStars = [];
  heartStars = [];
  seq = [];
  clickedSeqPos = 0;
  hintPulse = 0;
  skyReady = false;
  updateProgressText();
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
  const rect = el.canvasWrap.getBoundingClientRect();
  cssW = rect.width;
  cssH = rect.height;

  // If wrapper is not sized yet, don’t build
  if (cssW < 40 || cssH < 40) return false;

  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  el.canvas.width = Math.floor(cssW * dpr);
  el.canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}

function buildSky() {
  const seedFn = xmur3(CONFIG.skySeed);
  const rng = mulberry32(seedFn());

  const bgCount = Math.max(120, Math.floor((cssW * cssH) / 9000));
  bgStars = Array.from({ length: bgCount }, () => ({
    x: rng() * cssW,
    y: rng() * cssH,
    r: 0.6 + rng() * 1.8,
    a: 0.08 + rng() * 0.35,
    tw: rng() * 1000
  }));

  const n = Math.max(8, CONFIG.heartStarCount);

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

  heartStars = norm.map((p) => ({
    x: margin + p.x * w + (rng() - 0.5) * 10,
    y: margin + (1 - p.y) * h + (rng() - 0.5) * 10,
  }));

  seq = Array.from({ length: n }, (_, i) => i);
  seq.push(0); // close the heart

  clickedSeqPos = 0;
  hintPulse = 0;
  updateProgressText();
  skyReady = true;
}

function updateProgressText() {
  const total = seq.length || 1;
  const step = Math.min(total, clickedSeqPos + 1);
  el.progress.textContent = `Tap the glowing star (${step}/${total})`;
}

function startSky(forceRebuild = false) {
  resetSkyState();

  // Wait for layout & try repeatedly until wrapper has size
  const attempt = () => {
    if (el.skyScreen.hidden) return;

    if (!resizeCanvas()) {
      requestAnimationFrame(attempt);
      return;
    }

    if (forceRebuild || !skyReady) buildSky();
    drawSky();
  };

  // Two frames helps on iOS/Android
  requestAnimationFrame(() => requestAnimationFrame(attempt));
}

function drawSky() {
  if (!skyReady) return;

  ctx.clearRect(0, 0, cssW, cssH);
  const now = performance.now();

  // glow background
  const bg = ctx.createRadialGradient(cssW * 0.2, cssH * 0.15, 10, cssW * 0.5, cssH * 0.6, Math.max(cssW, cssH));
  bg.addColorStop(0, "rgba(255,255,255,0.10)");
  bg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // bg stars
  for (const s of bgStars) {
    const tw = 0.6 + 0.4 * Math.sin((now + s.tw) / 700);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${s.a * tw})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // lines
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

  const nextIdx = seq[Math.min(clickedSeqPos, seq.length - 1)];
  const pulse = 0.6 + 0.4 * Math.sin(now / 220);

  for (let i = 0; i < heartStars.length; i++) {
    const s = heartStars[i];

    let visited = false;
    for (let k = 0; k < clickedSeqPos; k++) {
      if (seq[k] === i) { visited = true; break; }
    }

    const isNext = (i === nextIdx) && (clickedSeqPos < seq.length);
    const coreR = Math.max(5, Math.min(8, cssW / 140));
    const haloR = isNext ? coreR * 3.2 : coreR * 2.6;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = visited ? "rgba(255,255,255,0.95)" : `rgba(255,255,255,${isNext ? 0.90 : 0.45})`;
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

function completeHeart() {
  showToast("Heart completed 💗");
  showScreen("video");
  loadVideo();
  tryPlayVideo();
}

function onCanvasPointerDown(evt) {
  evt.preventDefault();
  if (!skyReady) return;
  if (clickedSeqPos >= seq.length) return;

  const rect = el.canvas.getBoundingClientRect();
  const x = (evt.clientX - rect.left);
  const y = (evt.clientY - rect.top);

  const nextIdx = seq[clickedSeqPos];
  const radius = tapAssistOn ? CONFIG.tapAssistRadius : 18;
  const hit = findNearestStar(x, y, radius);

  if (hit === -1) { showToast("Tap near the glowing star ✨"); hintPulse = 1; return; }
  if (hit !== nextIdx) { showToast("Not that one 😉"); hintPulse = 1; return; }

  clickedSeqPos++;
  updateProgressText();

  if (clickedSeqPos >= seq.length) setTimeout(completeHeart, 250);
  else showToast("✨");
}

function animate() {
  if (!el.skyScreen.hidden && skyReady) {
    if (hintPulse > 0) hintPulse = Math.max(0, hintPulse - 0.03);
    drawSky();
  }
  requestAnimationFrame(animate);
}

// Buttons
el.resetSky.addEventListener("click", () => { startSky(true); showToast("Reset ✨"); });
el.hintSky.addEventListener("click", () => { hintPulse = 1; showToast("Look for the glow ✨"); });
el.tapAssistBtn.addEventListener("click", () => {
  tapAssistOn = !tapAssistOn;
  el.tapAssistBtn.textContent = `Tap Assist: ${tapAssistOn ? "ON" : "OFF"}`;
  showToast(tapAssistOn ? "Tap Assist enabled ✅" : "Tap Assist disabled");
});

el.canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: false });

// ResizeObserver = reliable sizing on phone + PC
const ro = new ResizeObserver(() => {
  if (el.skyScreen.hidden) return;
  if (!el.overlay.classList.contains("show")) return;
  startSky(false);
});
ro.observe(el.canvasWrap);

// Keep "No" sane after resize
window.addEventListener("resize", () => {
  if (!noIsConverted) {
    el.noBtn.style.position = "relative";
    el.noBtn.style.left = "auto";
    el.noBtn.style.top = "auto";
  }
});

// Start loop
requestAnimationFrame(animate);
