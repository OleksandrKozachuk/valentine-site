const toast = document.getElementById("toast");
const gate = document.getElementById("gate");
const content = document.getElementById("content");

const qIndexEl = document.getElementById("qIndex");
const qTotalEl = document.getElementById("qTotal");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("nextBtn");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 900);
}

// Gate: must finish heart + sudoku first
const heartDone = sessionStorage.getItem("heartDone") === "1";
const sudokuDone = sessionStorage.getItem("sudokuDone") === "1";

if (!heartDone) {
  gate.hidden = false;
  content.style.display = "none";
  gate.innerHTML = `
    This page is locked 💗<br>
    Please complete the constellation first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sky.html" style="display:inline-block; text-decoration:none;">Go to the sky</a>
    </div>
  `;
} else if (!sudokuDone) {
  gate.hidden = false;
  content.style.display = "none";
  gate.innerHTML = `
    This page is locked 💗<br>
    Please solve the Sudoku first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sudoku.html" style="display:inline-block; text-decoration:none;">Go to Sudoku</a>
    </div>
  `;
} else {
  gate.hidden = true;
  content.style.display = "block";
}

const questions = [
  {
    q: "What is my name?",
    a: ["Igor", "Yehor", "Illya", "Oleksandr"],
    correct: 3
  },
  {
    q: "What is my favorite color?",
    a: ["White", "Black", "Pink", "Blue"],
    correct: 1
  },
  {
    q: "My cat name",
    a: ["Oleksandr", "Oleksandra", "Semen", "Semena"],
    correct: 2
  },
  {
    q: "Am i need you?",
    a: ["Yes", "No"],
    correct: 0
  },
  {
    q: "Do you need me?",
    a: ["Yes", "No"],
    correct: 0
  },
];

qTotalEl.textContent = String(questions.length);

let current = 0;
let selectedIndex = null;

function render() {
  const item = questions[current];
  qIndexEl.textContent = String(current + 1);
  questionText.textContent = item.q;

  optionsEl.innerHTML = "";
  selectedIndex = null;
  nextBtn.disabled = true;

  item.a.forEach((text, idx) => {
    const label = document.createElement("label");
    label.className = "quiz-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quiz";
    input.value = String(idx);

    input.addEventListener("change", () => {
      selectedIndex = idx;
      nextBtn.disabled = false;
    });

    const span = document.createElement("span");
    span.textContent = text;

    label.appendChild(input);
    label.appendChild(span);
    optionsEl.appendChild(label);
  });

  nextBtn.textContent = (current === questions.length - 1) ? "Finish 💖" : "Next";
}

function handleNext() {
  const item = questions[current];

  if (selectedIndex === null) return;

  if (selectedIndex !== item.correct) {
    showToast("Choose another");
    return;
  }

  // correct
  if (current === questions.length - 1) {
    sessionStorage.setItem("quizDone", "1");
    showToast("Unlocked 💗");
    setTimeout(() => (window.location.href = "video.html"), 450);
    return;
  }

  current += 1;
  render();
}

nextBtn.addEventListener("click", handleNext);

// Start quiz only if unlocked
if (heartDone && sudokuDone) render();
