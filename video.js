const C = window.APP_CONFIG;

const unlocked = sessionStorage.getItem("unlocked") === "1";
const gate = document.getElementById("gate");
const content = document.getElementById("content");
const sweetMsg = document.getElementById("sweetMsg");

const video = document.getElementById("video");
const videoSrc = document.getElementById("videoSrc");
const errBox = document.getElementById("videoError");

sweetMsg.textContent = C.sweetMessage;

if (!unlocked) {
  gate.hidden = false;
  content.style.display = "none";
} else {
  gate.hidden = true;
  content.style.display = "flex";

  videoSrc.src = C.videoSrc;
  try { video.load(); } catch {}

  video.addEventListener("error", () => {
    errBox.hidden = false;
    errBox.innerHTML =
      `⚠️ Video can’t play.<br><br>
       <b>Check path:</b> <code>${C.videoSrc}</code> (case-sensitive on GitHub).<br>
       <b>Codec:</b> MP4 should be H.264 + AAC (iPhone HEVC/H.265 often breaks).<br><br>
       <b>Fix with ffmpeg:</b><br>
       <code>ffmpeg -i input.mp4 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart assets/valentine.mp4</code>`;
  });

  // try autoplay (may be blocked; controls still work)
  const p = video.play?.();
  if (p && p.catch) p.catch(() => {});
}
