const C = window.APP_CONFIG;

const heartDone = sessionStorage.getItem("heartDone") === "1";
const sudokuDone = sessionStorage.getItem("sudokuDone") === "1";

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
    This page is locked 💗<br>
    Please complete the constellation first.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sky.html" style="display:inline-block; text-decoration:none;">Go to the sky</a>
    </div>
  `);
} else if (!sudokuDone) {
  showGate(`
    One more step 💗<br>
    Solve the mini Sudoku to unlock the video.
    <div style="margin-top:10px;">
      <a class="btn yes" href="sudoku.html" style="display:inline-block; text-decoration:none;">Go to Sudoku</a>
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

  // autoplay attempt (may be blocked)
  const p = video.play?.();
  if (p && p.catch) p.catch(() => {});
}
