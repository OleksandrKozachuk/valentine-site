const C = window.APP_CONFIG;

const img = document.getElementById("confirmImg");
const toast = document.getElementById("toast");
const noBtn = document.getElementById("noBtn");
const yesBtn = document.getElementById("yesBtn");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1200);
}

// Load image with fallback extensions (silent, but toast if missing entirely)
let i = 0;
function tryNext() {
  if (i >= C.confirmCandidates.length) {
    showToast("Image not found 🙈");
    return;
  }
  img.src = C.confirmCandidates[i++];
}
img.onerror = tryNext;
tryNext();

noBtn.addEventListener("click", () => (window.location.href = "index.html"));
yesBtn.addEventListener("click", () => {
  sessionStorage.setItem("confirmed", "1");
  window.location.href = "sky.html";
});
