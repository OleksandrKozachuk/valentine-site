const C = window.APP_CONFIG;

const herName = document.getElementById("herName");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const btnArea = document.getElementById("btnArea");
const toast = document.getElementById("toast");

herName.textContent = C.herName;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1100);
}

function goConfirm() {
  sessionStorage.setItem("confirmed", "0");
  sessionStorage.setItem("heartDone", "0");
  sessionStorage.setItem("sudokuDone", "0");
  window.location.href = "confirm.html";
}


yesBtn.addEventListener("click", goConfirm);

let attempts = 0;
let converted = false;
let revertTimer = null;

function rand(min, max) { return Math.random() * (max - min) + min; }

function rectsIntersect(a, b, pad = 0) {
  return !(
    a.right + pad < b.left ||
    a.left - pad > b.right ||
    a.bottom + pad < b.top ||
    a.top - pad > b.bottom
  );
}

function moveNoButtonNoOverlap() {
  const areaRect = btnArea.getBoundingClientRect();

  // Measure current sizes
  const yesRect = yesBtn.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();

  // Make No absolute so we can move inside area
  noBtn.style.position = "absolute";

  const padding = 10;        // keep within the box edges
  const gap = 12;            // minimum distance from Yes (no overlap + small gap)

  const maxLeft = Math.max(padding, areaRect.width - noRect.width - padding);
  const maxTop  = Math.max(padding, areaRect.height - noRect.height - padding);

  // Convert Yes rect to btnArea-local coordinates
  const yesLocal = {
    left: yesRect.left - areaRect.left,
    top: yesRect.top - areaRect.top,
    right: yesRect.right - areaRect.left,
    bottom: yesRect.bottom - areaRect.top
  };

  // Try multiple random placements until one doesn't intersect Yes
  let placed = false;
  for (let i = 0; i < 40; i++) {
    const left = rand(padding, maxLeft);
    const top  = rand(padding, maxTop);

    const noLocal = {
      left,
      top,
      right: left + noRect.width,
      bottom: top + noRect.height
    };

    if (!rectsIntersect(noLocal, yesLocal, gap)) {
      noBtn.style.left = `${left}px`;
      noBtn.style.top  = `${top}px`;
      placed = true;
      break;
    }
  }

  // Fallback: if we couldn't find a safe random spot, push it away horizontally
  if (!placed) {
    const left = Math.min(maxLeft, Math.max(padding, yesLocal.right + gap));
    const top = rand(padding, maxTop);
    noBtn.style.left = `${left}px`;
    noBtn.style.top  = `${top}px`;
  }
}

function resetNo() {
  converted = false;
  attempts = 0;
  noBtn.classList.remove("yes");
  noBtn.classList.add("no");
  noBtn.textContent = "No 🙈";
  noBtn.style.position = "relative";
  noBtn.style.left = "auto";
  noBtn.style.top = "auto";
}

function convertToYes() {
  converted = true;
  noBtn.classList.remove("no");
  noBtn.classList.add("yes");
  noBtn.textContent = "Yes 💞";

  clearTimeout(revertTimer);
  revertTimer = setTimeout(() => {
    resetNo();
    showToast("Okay… No is back 🙈");
  }, C.revertAfterMs);
}

function handleNoAttempt(e) {
  if (converted) return;
  e.preventDefault();
  e.stopPropagation();

  attempts += 1;
  moveNoButtonNoOverlap();

  if (attempts % 3 === 0) {
    const idx = Math.min(C.messages.length - 1, (attempts / 3) - 1);
    showToast(C.messages[idx]);
  }

  if (attempts % 9 === 0) {
    convertToYes();
    showToast("Fine… YES 😅");
  }
}

noBtn.addEventListener("pointerdown", handleNoAttempt, { passive: false });

noBtn.addEventListener("click", (e) => {
  if (!converted) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  goConfirm();
});

// Keep No sane on resize
window.addEventListener("resize", () => {
  if (!converted) {
    noBtn.style.position = "relative";
    noBtn.style.left = "auto";
    noBtn.style.top = "auto";
  }
});
