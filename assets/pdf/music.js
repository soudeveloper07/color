/* soudev.in background music: self-contained (button + CSS + fade-in logic) */
(() => {
  const SRC = "assets/pdf/ambient.mp3", TARGET = 0.35, FADE_MS = 3000;

  const css = document.createElement("style");
  css.textContent = `
  .music-btn{position:fixed;left:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:1000;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#00E1FF;background:rgba(8,16,46,.7);border:1px solid rgba(0,225,255,.5);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:box-shadow .4s,transform .4s}
  .music-btn:hover{box-shadow:0 0 24px rgba(0,225,255,.45);transform:scale(1.06)}
  .music-btn .eq{display:none;gap:3px;align-items:flex-end;height:18px}
  .music-btn .eq i{width:3px;height:100%;border-radius:2px;background:#00E1FF;box-shadow:0 0 8px #00E1FF;transform-origin:bottom;animation:eq 1s ease-in-out infinite}
  .music-btn .eq i:nth-child(2){animation-delay:.2s}.music-btn .eq i:nth-child(3){animation-delay:.4s}.music-btn .eq i:nth-child(4){animation-delay:.1s}
  @keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
  .music-btn.playing .eq{display:flex}.music-btn.playing .off{display:none}
  @media (max-width:900px){.music-btn{bottom:calc(98px + env(safe-area-inset-bottom,0px));left:14px;width:46px;height:46px}}`;
  document.head.appendChild(css);

  const audio = new Audio(SRC); audio.loop = true; audio.preload = "none";
  const btn = document.createElement("button");
  btn.className = "music-btn"; btn.type = "button";
  btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Play background music");
  btn.innerHTML = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><i class="fa-solid fa-volume-xmark off" aria-hidden="true"></i>';
  document.body.appendChild(btn);

  let fadeTimer, userMuted = false;
  try { userMuted = localStorage.getItem("bgm-muted") === "1"; } catch (e) {}

  function fadeTo(vol, ms, done) {
    clearInterval(fadeTimer);
    const from = audio.volume, steps = 30; let i = 0;
    fadeTimer = setInterval(() => {
      i++; audio.volume = Math.min(1, Math.max(0, from + (vol - from) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); done && done(); }
    }, ms / steps);
  }
  function setUI(on) {
    btn.classList.toggle("playing", on);
    btn.setAttribute("aria-pressed", on);
    btn.setAttribute("aria-label", on ? "Mute background music" : "Play background music");
  }
  async function start() {
    audio.volume = 0;
    try { await audio.play(); setUI(true); fadeTo(TARGET, FADE_MS); return true; }
    catch (e) { return false; }
  }
  function stop() { fadeTo(0, 800, () => audio.pause()); setUI(false); }

  const events = ["pointerdown", "keydown", "touchend", "click"];
  function onFirstGesture(e) {
    if (btn.contains(e.target)) return;
    events.forEach(ev => removeEventListener(ev, onFirstGesture, true));
    if (!userMuted) start();
  }
  btn.addEventListener("click", () => {
    events.forEach(ev => removeEventListener(ev, onFirstGesture, true));
    if (audio.paused) { userMuted = false; try { localStorage.removeItem("bgm-muted"); } catch (e) {} start(); }
    else { userMuted = true; try { localStorage.setItem("bgm-muted", "1"); } catch (e) {} stop(); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (!audio.paused) audio.pause(); }
    else if (btn.classList.contains("playing")) audio.play().catch(() => {});
  });
  if (!userMuted) start().then(ok => {
    if (!ok) events.forEach(ev => addEventListener(ev, onFirstGesture, { capture: true, passive: true }));
  });
})();
