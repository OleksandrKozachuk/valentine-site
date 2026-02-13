const C = window.APP_CONFIG;

const toast = document.getElementById("toast");
const gate = document.getElementById("gate");
const content = document.getElementById("content");
const img = document.getElementById("finalImg");
const nextBtn = document.getElementById("nextBtn");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1100);
}

// Must complete quiz first
const heartDone = sessionStorage.getItem("heartDone") === "1";
const sudokuDone = sessionStorage.getItem("sudokuDone") === "1";
const quizDone = sessionStorage.getItem("quizDone") === "1";

function showGate(html) {
  gate.hidden = false;
  content.style.display = "none";
  gate.innerHTML = html;
}

if (!heartDone) {
  showGate(`
    This page is locked 💗<br>
    Please complete the constellation first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sky.html" style="display:inline-block; text-decoration:none;">Go to the sky</a>
    </div>
  `);
} else if (!sudokuDone) {
  showGate(`
    This page is locked 💗<br>
    Please solve the Sudoku first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sudoku.html" style="display:inline-block; text-decoration:none;">Go to Sudoku</a>
    </div>
  `);
} else if (!quizDone) {
  showGate(`
    This page is locked 💗<br>
    Please finish the quiz first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="quiz.html" style="display:inline-block; text-decoration:none;">Go to Quiz</a>
    </div>
  `);
}

// Load final image with fallback:
// 1) Try assets/final.*
// 2) If missing, fallback to confirm image assets/confirm.*
if (heartDone && sudokuDone && quizDone) {
  gate.hidden = true;
  content.style.display = "flex";

  const candidates = [
    ...(C.finalImageCandidates || []),
    ...(C.confirmCandidates || [])
  ];

  let i = 0;
  function tryNext() {
    if (i >= candidates.length) {
      showToast("Image not found 🙈");
      return;
    }
    img.src = candidates[i++];
  }
  img.onerror = tryNext;
  tryNext();

  nextBtn.addEventListener("click", () => {
    sessionStorage.setItem("revealDone", "1");
    window.location.href = "video.html";
  });
}
