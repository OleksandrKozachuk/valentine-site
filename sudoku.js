const C = window.APP_CONFIG;

const gate = document.getElementById("gate");
const content = document.getElementById("content");
const gridEl = document.getElementById("sudokuGrid");
const toast = document.getElementById("toast");
const clearBtn = document.getElementById("clearBtn");
const unlockBtn = document.getElementById("unlockBtn");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1100);
}

// Gate: must finish heart first
const heartDone = sessionStorage.getItem("heartDone") === "1";
if (!heartDone) {
  gate.hidden = false;
  content.style.display = "none";
} else {
  gate.hidden = true;
  content.style.display = "flex";
}

// Easy 4x4 sudoku (solution)
const solution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

// Puzzle (0 = empty)
const puzzle = [
  [1, 0, 3, 0],
  [0, 4, 0, 2],
  [2, 0, 4, 0],
  [0, 3, 0, 1],
];

let cells = []; // {input, r, c, given}

function buildGrid() {
  gridEl.innerHTML = "";
  cells = [];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const box = document.createElement("div");
      box.className = "sudoku-cell";

      // thick borders for 2x2 boxes
      const top = (r === 0) ? 2 : (r === 2 ? 2 : 1);
      const left = (c === 0) ? 2 : (c === 2 ? 2 : 1);
      const bottom = (r === 3) ? 2 : (r === 1 ? 2 : 1);
      const right = (c === 3) ? 2 : (c === 1 ? 2 : 1);

      box.style.borderTopWidth = top + "px";
      box.style.borderLeftWidth = left + "px";
      box.style.borderBottomWidth = bottom + "px";
      box.style.borderRightWidth = right + "px";

      const input = document.createElement("input");
      input.className = "sudoku-input";
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("maxlength", "1");
      input.autocomplete = "off";

      const givenVal = puzzle[r][c];
      const isGiven = givenVal !== 0;

      if (isGiven) {
        input.value = String(givenVal);
        input.disabled = true;
        input.classList.add("given");
      } else {
        input.value = "";
        input.addEventListener("input", () => {
          // allow only 1-4
          const v = input.value.replace(/[^1-4]/g, "");
          input.value = v.slice(0, 1);
          updateUnlockState();
        });

        // nice on phone: go next cell on valid entry
        input.addEventListener("keyup", (e) => {
          if (input.value && /^[1-4]$/.test(input.value)) {
            focusNext(r, c);
          }
        });
      }

      box.appendChild(input);
      gridEl.appendChild(box);

      cells.push({ input, r, c, given: isGiven });
    }
  }

  updateUnlockState();
}

function focusNext(r, c) {
  // find next editable cell in reading order
  const start = r * 4 + c + 1;
  for (let i = start; i < cells.length; i++) {
    if (!cells[i].given) {
      cells[i].input.focus();
      return;
    }
  }
}

function getValue(r, c) {
  const idx = r * 4 + c;
  const v = cells[idx].input.value;
  return v ? Number(v) : 0;
}

function updateUnlockState() {
  // enable unlock if all blanks are filled
  for (const cell of cells) {
    if (!cell.given && !cell.input.value) {
      unlockBtn.disabled = true;
      return;
    }
  }
  unlockBtn.disabled = false;
}

function clearUserInputs() {
  for (const cell of cells) {
    if (!cell.given) cell.input.value = "";
  }
  updateUnlockState();
}

function checkSolved() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (getValue(r, c) !== solution[r][c]) return false;
    }
  }
  return true;
}

function markIncorrect() {
  // quick visual feedback
  for (const cell of cells) {
    if (cell.given) continue;
    const correct = Number(cell.input.value) === solution[cell.r][cell.c];
    cell.input.classList.toggle("wrong", !correct);
  }
  setTimeout(() => {
    for (const cell of cells) cell.input.classList.remove("wrong");
  }, 900);
}

clearBtn.addEventListener("click", () => {
  clearUserInputs();
  showToast("Cleared ✨");
});

unlockBtn.addEventListener("click", () => {
  if (!checkSolved()) {
    showToast("Almost… try again 😉");
    markIncorrect();
    return;
  }
  showToast("Unlocked 💗");
  sessionStorage.setItem("sudokuDone", "1");
  sessionStorage.setItem("quizDone", "0");
  setTimeout(() => (window.location.href = "quiz.html"), 450);
});


if (heartDone) buildGrid();
