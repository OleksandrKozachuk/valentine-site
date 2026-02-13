const C = window.APP_CONFIG;

const heartDone = sessionStorage.getItem("heartDone") === "1";
const sudokuDone = sessionStorage.getItem("sudokuDone") === "1";
const quizDone = sessionStorage.getItem("quizDone") === "1";
const revealDone = sessionStorage.getItem("revealDone") === "1";

const gate = document.getElementById("gate");
const content = document.getElementById("content");
const sweetMsg = document.getElementById("sweetMsg");

const video = document.getElementById("video");
const videoSrc = document.getElementById("videoSrc");
const errBox = document.getElementById("videoError");

sweetMsg.textContent = C.sweetMessage;

function showGate(html) {
  gate.hidden = false;
  content.style.display = "none";
  gate.innerHTML = html;
}

if (!heartDone) {
  showGate(`
    This page is locked 💗
  `);
} else if (!sudokuDone) {
  showGate(`
    One more step 💗<br>
    Solve the mini Sudoku.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sudoku.html" style="display:inline-block; text-decoration:none;">Go to Sudoku</a>
    </div>
  `);
} else if (!quizDone) {
  showGate(`
    One more step 💗<br>
    Complete the quiz.
    <div style="margin-top:10px;">
      <a class="btn yes" href="quiz.html" style="display:inline-block; text-decoration:none;">Go to Quiz</a>
    </div>
  `);
} else if (!revealDone) {
  showGate(`
    One more step 💗<br>
    Go through the last page first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="reveal.html" style="display:inline-block; text-decoration:none;">Go to Next</a>
    </div>
  `);
} else {
  gate.hidden = true;
  content.style.display = "flex";

  videoSrc.src = C.videoSrc;
  try { video.load(); } catch {}

  video.addEventListener("error", () => {
    errBox.hidden = false;
    errBox.innerHTML =
      `⚠️ Video can’t play.<br><br>
       <b>Codec:</b> MP4 should be H.264 + AAC (iPhone HEVC/H.265 often breaks).<br><br>
       <b>Fix with ffmpeg:</b><br>
       <code>ffmpeg -i input.mp4 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart assets/valentine.mp4</code>`;
  });

  const p = video.play?.();
  if (p && p.catch) p.catch(() => {});
}
