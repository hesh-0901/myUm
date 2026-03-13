// chat/js/voice-message.js

function formatTime(totalSeconds = 0) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function iconPlay() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M8 5v14l11-7z"/></svg>`;
}
function iconPause() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`;
}
function iconDownload() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M5 20h14v-2H5zm7-18v10.17l3.59-3.58L17 10l-5 5-5-5 1.41-1.41L11 12.17V2z"/></svg>`;
}
function iconMic() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg>`;
}
function iconTrash() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z"/></svg>`;
}
function iconSend() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>`;
}
function iconResume() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M8 5v14l11-7z"/></svg>`;
}
function iconStop() {
  return `<svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"><path d="M6 6h12v12H6z"/></svg>`;
}

const DB_NAME = "myum_audio_cache";
const STORE_NAME = "audio_files";

function openAudioDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedAudioBlob(cacheKey) {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(cacheKey);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function setCachedAudioBlob(cacheKey, blob) {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(blob, cacheKey);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export function shouldAutoDownloadAudio() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  if (conn.saveData) return false;
  return conn.effectiveType === "4g" || conn.effectiveType === "wifi";
}

export async function downloadAudioWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Téléchargement impossible");

  const total = Number(response.headers.get("content-length")) || 0;

  if (!response.body) {
    const blob = await response.blob();
    onProgress?.(100);
    return blob;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;

    if (total > 0) {
      const pct = Math.min(100, Math.round((received / total) * 100));
      onProgress?.(pct);
    }
  }

  if (!total) onProgress?.(100);
  return new Blob(chunks);
}

function createCircularProgressButton({ isMine, initialIcon = "download" }) {
  const root = document.createElement("div");
  root.className = "relative w-11 h-11 shrink-0";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 44 44");
  svg.classList.add("absolute", "inset-0", "w-full", "h-full", "-rotate-90");

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bg.setAttribute("cx", "22");
  bg.setAttribute("cy", "22");
  bg.setAttribute("r", "19");
  bg.setAttribute("fill", "none");
  bg.setAttribute("stroke", isMine ? "rgba(255,255,255,.18)" : "#d1d5db");
  bg.setAttribute("stroke-width", "3");

  const fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  fg.setAttribute("cx", "22");
  fg.setAttribute("cy", "22");
  fg.setAttribute("r", "19");
  fg.setAttribute("fill", "none");
  fg.setAttribute("stroke", "#5ba585");
  fg.setAttribute("stroke-width", "3");
  fg.setAttribute("stroke-linecap", "round");

  const circumference = 2 * Math.PI * 19;
  fg.style.strokeDasharray = `${circumference}`;
  fg.style.strokeDashoffset = `${circumference}`;

  svg.appendChild(bg);
  svg.appendChild(fg);

  const btn = document.createElement("button");
  btn.className =
    `absolute inset-[4px] rounded-full flex items-center justify-center ${
      isMine ? "bg-white/15 text-white" : "bg-primary text-white"
    }`;

  root.appendChild(svg);
  root.appendChild(btn);

  function setProgress(percent) {
    const p = Math.max(0, Math.min(100, percent));
    const offset = circumference - (p / 100) * circumference;
    fg.style.strokeDashoffset = `${offset}`;
  }

  function setIcon(type) {
    if (type === "play") btn.innerHTML = iconPlay();
    else if (type === "pause") btn.innerHTML = iconPause();
    else if (type === "download") btn.innerHTML = iconDownload();
    else if (type === "mic") btn.innerHTML = iconMic();
    else if (type === "trash") btn.innerHTML = iconTrash();
    else if (type === "send") btn.innerHTML = iconSend();
    else if (type === "resume") btn.innerHTML = iconResume();
    else if (type === "stop") btn.innerHTML = iconStop();
  }

  setIcon(initialIcon);

  return {
    root,
    button: btn,
    setProgress,
    setIcon
  };
}

export function createAudioAvatar({ avatarImgSrc, fallbackText = "U" }) {
  const avatar = document.createElement("div");
  avatar.className =
    "w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-700";

  if (avatarImgSrc) {
    avatar.innerHTML = `<img src="${avatarImgSrc}" class="w-full h-full object-cover">`;
  } else {
    avatar.textContent = fallbackText.slice(0, 1).toUpperCase();
  }

  return avatar;
}

export async function createVoiceMessageBubble({
  url,
  cacheKey,
  duration,
  isMine,
  message,
  avatarImgSrc,
  fallbackAvatarText,
  onOpenMenu
}) {
  const WaveSurfer = window.MyUmWaveSurfer;
  if (!WaveSurfer) throw new Error("WaveSurfer non chargé");

  const box = document.createElement("div");
  box.className = "w-full";

  const wrapper = document.createElement("div");
  wrapper.className =
    `p-3 rounded-2xl ${
      isMine ? "bg-white/10" : "bg-gray-50 border border-gray-100"
    }`;

  const row = document.createElement("div");
  row.className = "flex items-center gap-3";

  const avatar = createAudioAvatar({
    avatarImgSrc,
    fallbackText: fallbackAvatarText
  });

  const circle = createCircularProgressButton({
    isMine,
    initialIcon: "download"
  });

  const middle = document.createElement("div");
  middle.className = "min-w-0 flex-1";

  const topMeta = document.createElement("div");
  topMeta.className = "flex items-center justify-between gap-2 mb-1";

  const label = document.createElement("div");
  label.className = isMine ? "text-white/90 text-xs font-medium" : "text-gray-700 text-xs font-medium";
  label.textContent = "Message vocal";

  const durationLabel = document.createElement("div");
  durationLabel.className = isMine ? "text-white/75 text-[11px]" : "text-gray-500 text-[11px]";
  durationLabel.textContent = duration ? formatTime(duration) : "0:00";

  topMeta.appendChild(label);
  topMeta.appendChild(durationLabel);

  const waveform = document.createElement("div");
  waveform.className = "w-full h-12";

  middle.appendChild(topMeta);
  middle.appendChild(waveform);

  row.appendChild(avatar);
  row.appendChild(circle.root);
  row.appendChild(middle);

  const menuBtn = document.createElement("button");
  menuBtn.className =
    `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
      isMine ? "bg-white/10 text-white" : "bg-gray-200 text-gray-700"
    }`;
  menuBtn.innerHTML = `<i class="bi bi-three-dots-vertical"></i>`;
  menuBtn.addEventListener("click", () => onOpenMenu?.(message));

  row.appendChild(menuBtn);
  wrapper.appendChild(row);
  box.appendChild(wrapper);

  let localAudioUrl = null;
  let wavesurfer = null;
  let isDownloaded = false;

  async function initWave(audioUrl) {
    if (wavesurfer) return;

    wavesurfer = WaveSurfer.create({
      container: waveform,
      url: audioUrl,
      waveColor: "#B9C1C5",
      progressColor: "#5ba585",
      cursorColor: "transparent",
      height: 40,
      normalize: true,
      interact: true,
      barWidth: 2,
      barGap: 3,
      barRadius: 4
    });

    wavesurfer.on("ready", () => {
      if (!duration) {
        durationLabel.textContent = formatTime(wavesurfer.getDuration());
      }
    });

    wavesurfer.on("play", () => circle.setIcon("pause"));
    wavesurfer.on("pause", () => circle.setIcon("play"));
    wavesurfer.on("finish", () => circle.setIcon("play"));
    wavesurfer.on("audioprocess", (current) => {
      durationLabel.textContent = formatTime(current);
    });
    wavesurfer.on("interaction", () => {
      if (!wavesurfer.isPlaying()) {
        durationLabel.textContent = formatTime(wavesurfer.getCurrentTime());
      }
    });
  }

  async function ensureDownloaded(auto = false) {
    if (isDownloaded) return;

    const cached = await getCachedAudioBlob(cacheKey).catch(() => null);
    if (cached) {
      localAudioUrl = URL.createObjectURL(cached);
      isDownloaded = true;
      circle.setProgress(100);
      circle.setIcon("play");
      await initWave(localAudioUrl);
      return;
    }

    const blob = await downloadAudioWithProgress(url, (pct) => {
      circle.setProgress(pct);
    });

    await setCachedAudioBlob(cacheKey, blob).catch(() => {});
    localAudioUrl = URL.createObjectURL(blob);
    isDownloaded = true;
    circle.setProgress(100);
    circle.setIcon("play");
    await initWave(localAudioUrl);

    if (!auto && !duration && wavesurfer?.getDuration()) {
      durationLabel.textContent = formatTime(wavesurfer.getDuration());
    }
  }

  circle.button.addEventListener("click", async () => {
    if (!isDownloaded) {
      try {
        await ensureDownloaded(false);
      } catch (error) {
        console.error("audio download error:", error);
      }
      return;
    }

    if (!wavesurfer) return;

    try {
      wavesurfer.playPause();
    } catch (error) {
      console.error("audio play error:", error);
    }
  });

  if (shouldAutoDownloadAudio()) {
    ensureDownloaded(true).catch(() => {});
  }

  return box;
}

export function createVoiceRecorderComposer({
  mount,
  onSendBlob,
  onCancel,
  theme = "light"
}) {
  const WaveSurfer = window.MyUmWaveSurfer;
  const RecordPlugin = window.MyUmRecordPlugin;

  if (!WaveSurfer || !RecordPlugin) {
    throw new Error("WaveSurfer ou RecordPlugin non chargé");
  }

  let wavesurfer = null;
  let record = null;
  let timer = null;
  let seconds = 0;
  let recordedBlob = null;
  let isPaused = false;

  const wrapper = document.createElement("div");
  wrapper.className =
    `rounded-2xl border p-3 ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`;

  const top = document.createElement("div");
  top.className = "flex items-center gap-3";

  const circle = createCircularProgressButton({
    isMine: false,
    initialIcon: "mic"
  });

  const waveMount = document.createElement("div");
  waveMount.className = "flex-1 h-12";

  const timerEl = document.createElement("div");
  timerEl.className = "text-xs text-gray-500 w-12 text-right";
  timerEl.textContent = "0:00";

  top.appendChild(circle.root);
  top.appendChild(waveMount);
  top.appendChild(timerEl);

  const actions = document.createElement("div");
  actions.className = "mt-3 flex items-center justify-end gap-2";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium";
  deleteBtn.textContent = "Supprimer";

  const pauseResumeBtn = document.createElement("button");
  pauseResumeBtn.className = "px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium";
  pauseResumeBtn.textContent = "Pause";

  const stopSendBtn = document.createElement("button");
  stopSendBtn.className = "px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium";
  stopSendBtn.textContent = "Stop";

  actions.appendChild(deleteBtn);
  actions.appendChild(pauseResumeBtn);
  actions.appendChild(stopSendBtn);

  wrapper.appendChild(top);
  wrapper.appendChild(actions);
  mount.innerHTML = "";
  mount.appendChild(wrapper);

  function updateTimer() {
    timerEl.textContent = formatTime(seconds);
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      seconds += 1;
      updateTimer();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
  }

  async function start() {
    wavesurfer = WaveSurfer.create({
      container: waveMount,
      waveColor: "#B9C1C5",
      progressColor: "#5ba585",
      cursorColor: "transparent",
      interact: false,
      height: 40,
      barWidth: 2,
      barGap: 3,
      barRadius: 4
    });

    record = wavesurfer.registerPlugin(
      RecordPlugin.create({
        renderRecordedAudio: false,
        scrollingWaveform: true,
        continuousWaveform: true,
        continuousWaveformDuration: 8
      })
    );

    record.on("record-end", async (blob) => {
      recordedBlob = blob;
      stopTimer();
      stopSendBtn.textContent = "Envoyer";
      circle.setIcon("send");
    });

    await record.startRecording();
    seconds = 0;
    updateTimer();
    startTimer();
    circle.setIcon("stop");
  }

  deleteBtn.addEventListener("click", async () => {
    try {
      stopTimer();
      if (record?.isRecording()) await record.stopRecording();
      wavesurfer?.destroy();
    } catch {}
    onCancel?.();
  });

  pauseResumeBtn.addEventListener("click", async () => {
    if (!record) return;

    try {
      if (!isPaused) {
        await record.pauseRecording();
        isPaused = true;
        stopTimer();
        pauseResumeBtn.textContent = "Continuer";
        circle.setIcon("resume");
      } else {
        await record.resumeRecording();
        isPaused = false;
        startTimer();
        pauseResumeBtn.textContent = "Pause";
        circle.setIcon("stop");
      }
    } catch (error) {
      console.error("pause/resume error:", error);
    }
  });

  stopSendBtn.addEventListener("click", async () => {
    if (!recordedBlob) {
      try {
        await record.stopRecording();
      } catch (error) {
        console.error("stop recording error:", error);
      }
      return;
    }

    onSendBlob?.(recordedBlob, seconds);
  });

  start().catch((error) => {
    console.error("micro permission error:", error);
    onCancel?.(error);
  });

  return {
    destroy() {
      stopTimer();
      try { wavesurfer?.destroy(); } catch {}
    }
  };
}

export function buildVoiceReplyPreview(reply) {
  const duration = reply?.duration ? formatTime(reply.duration) : "0:00";
  return `Vocal • ${duration}`;
}

export { formatTime };