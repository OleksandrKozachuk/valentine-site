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
  sessionStorage.setItem("unlocked", "0");
  window.location.href = "confirm.html";
}

yesBtn.addEventListener("click", goConfirm);

let attempts = 0;
let converted = false;
let revertTimer = null;

function rand(min, max) { return Math.random() * (max - min) + min; }

function moveNoButton() {
  const areaRect = btnArea.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();
  noBtn.style.position = "absolute";

  const padding = 10;
  const maxLeft = Math.max(padding, areaRect.width - btnRect.width - padding);
  const maxTop  = Math.max(padding, areaRect.height - btnRect.height - padding);

  noBtn.style.left = `${rand(padding, maxLeft)}px`;
  noBtn.style.top  = `${rand(padding, maxTop)}px`;
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

  // revert after 1 minute back to Yes+No
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
  moveNoButton();

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
    // pointerdown already handled; prevent weird click behavior
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  goConfirm();
});
