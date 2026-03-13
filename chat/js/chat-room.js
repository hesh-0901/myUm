// chat/js/chat-room.js

import { db, storage } from "../../mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  deleteField
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

/* ============================================================
   BLOC 1 : SESSION
============================================================ */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const myId = currentUser?.id;

if (!myId) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* ============================================================
   BLOC 2 : PARAMS
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

if (!friendId) {
  alert("Aucun utilisateur sélectionné.");
  window.location.href = "index.html";
}

/* ============================================================
   BLOC 3 : DOM
============================================================ */
const backBtn = document.getElementById("backBtn");
const voiceCallBtn = document.getElementById("voiceCallBtn");
const chatHomeBtn = document.getElementById("chatHomeBtn");

const roomAvatar = document.getElementById("roomAvatar");
const roomTitle = document.getElementById("roomTitle");
const roomSub = document.getElementById("roomSub");
const typingIndicator = document.getElementById("typingIndicator");

const pinnedBanner = document.getElementById("pinnedBanner");
const pinnedPreview = document.getElementById("pinnedPreview");
const unpinBtn = document.getElementById("unpinBtn");

const messagesWrapper = document.getElementById("messagesWrapper");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");

const recordBtn = document.getElementById("recordBtn");
const recordingStatus = document.getElementById("recordingStatus");

const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
const scrollUnreadBadge = document.getElementById("scrollUnreadBadge");

const replyPreview = document.getElementById("replyPreview");
const replyPreviewText = document.getElementById("replyPreviewText");
const cancelReplyBtn = document.getElementById("cancelReplyBtn");

const messageMenuOverlay = document.getElementById("messageMenuOverlay");
const reactionBtns = Array.from(document.querySelectorAll(".reactionBtn"));
const replyActionBtn = document.getElementById("replyActionBtn");
const pinActionBtn = document.getElementById("pinActionBtn");
const forwardActionBtn = document.getElementById("forwardActionBtn");
const downloadActionBtn = document.getElementById("downloadActionBtn");
const deleteMineActionBtn = document.getElementById("deleteMineActionBtn");
const deleteAllActionBtn = document.getElementById("deleteAllActionBtn");
const closeMessageMenuBtn = document.getElementById("closeMessageMenuBtn");

/* ============================================================
   BLOC 4 : NAVIGATION
============================================================ */
backBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

chatHomeBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

voiceCallBtn?.addEventListener("click", () => {
  window.location.href = `call-voice.html?uid=${encodeURIComponent(friendId)}&mode=caller`;
});

/* ============================================================
   BLOC 5 : CHAT ID
============================================================ */
function buildChatId(a, b) {
  const [x, y] = [a, b].sort();
  return `chat_${x}_${y}`;
}

const chatId = buildChatId(myId, friendId);
const chatRef = doc(db, "chats", chatId);
const messagesRef = collection(db, "chats", chatId, "messages");

/* ============================================================
   BLOC 6 : ÉTAT LOCAL
============================================================ */
let sending = false;
let typingTimer = null;
let typingState = false;
let isNearBottom = true;
let unreadVisualCount = 0;
let lastRenderedMessageCount = 0;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

let selectedMessageForMenu = null;
let replyTarget = null;

/* ============================================================
   BLOC 7 : INIT
============================================================ */
initRoom().catch((error) => {
  console.error("Erreur initRoom :", error);
  alert("Erreur room : " + (error?.message || error));
  window.location.href = "index.html";
});

async function initRoom() {
  await guardFriendship();
  await ensureChatDocument();

  bindComposerEvents();
  bindScrollTracking();
  bindScrollButton();
  bindAttachments();
  bindVoiceRecorder();
  bindMessageMenu();
  bindReplyUi();

  listenChatMeta();
  listenFriendProfileAndPresence();
  listenTypingState();
  listenMessages();

  await markDeliveredReadAndResetUnread();
  await updateChatReadMeta();
}

/* ============================================================
   BLOC 8 : FRIENDS ONLY
============================================================ */
async function guardFriendship() {
  const edge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!edge.exists()) {
    alert("Cette conversation est réservée aux amis.");
    window.location.href = "index.html";
  }
}

/* ============================================================
   BLOC 9 : ENSURE CHAT DOC
============================================================ */
async function ensureChatDocument() {
  const snap = await getDoc(chatRef);
  if (snap.exists()) return;

  await setDoc(chatRef, {
    participants: [myId, friendId],
    lastMessage: "",
    lastSenderId: "",
    lastMessageAt: serverTimestamp(),
    lastReadBy: {},
    unreadCount: {
      [myId]: 0,
      [friendId]: 0
    },
    typing: {},
    pinnedMessage: null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

/* ============================================================
   BLOC 10 : META CHAT
   Rôle :
   - Message épinglé
============================================================ */
function listenChatMeta() {
  onSnapshot(chatRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();
    const pinned = data.pinnedMessage || null;

    if (!pinned) {
      pinnedBanner?.classList.add("hidden");
      return;
    }

    pinnedPreview.textContent = pinned.preview || "Message épinglé";
    pinnedBanner?.classList.remove("hidden");
  });

  unpinBtn?.addEventListener("click", async () => {
    try {
      await updateDoc(chatRef, {
        pinnedMessage: null
      });
    } catch (error) {
      console.error("unpin error:", error);
    }
  });
}

/* ============================================================
   BLOC 11 : PROFIL / AVATAR / PRÉSENCE
============================================================ */
function listenFriendProfileAndPresence() {
  onSnapshot(doc(db, "users", friendId), (snap) => {
    const u = snap.exists() ? snap.data() : {};

    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const username = u.username || "";
    const photoURL = u.photoURL || "";

    const displayName =
      `${firstName} ${lastName}`.trim() ||
      username ||
      friendId;

    roomTitle.textContent = displayName;

    const initials =
      `${(firstName?.[0] || "")}${(lastName?.[0] || "")}`.toUpperCase() ||
      (username?.[0] || "").toUpperCase() ||
      "—";

    renderRoomAvatar(photoURL, initials);

    const lastSeenDate = u.lastSeen?.toDate ? u.lastSeen.toDate() : null;
    const isOnline = lastSeenDate
      ? (Date.now() - lastSeenDate.getTime() < 45000)
      : false;

    if (isOnline) {
      roomSub.textContent = "En ligne";
    } else if (lastSeenDate) {
      const hh = String(lastSeenDate.getHours()).padStart(2, "0");
      const mm = String(lastSeenDate.getMinutes()).padStart(2, "0");
      roomSub.textContent = `Vu à ${hh}:${mm}`;
    } else {
      roomSub.textContent = "—";
    }
  });
}

function renderRoomAvatar(photoURL, initials) {
  if (!roomAvatar) return;

  roomAvatar.innerHTML = "";
  roomAvatar.textContent = initials;

  if (!photoURL || typeof photoURL !== "string") return;

  const img = new Image();
  img.src = photoURL;
  img.className = "w-full h-full object-cover";

  img.onerror = () => {
    roomAvatar.innerHTML = "";
    roomAvatar.textContent = initials;
  };

  img.onload = () => {
    roomAvatar.innerHTML = "";
    roomAvatar.appendChild(img);
  };
}

/* ============================================================
   BLOC 12 : TYPING
============================================================ */
function listenTypingState() {
  onSnapshot(chatRef, (snap) => {
    if (!snap.exists() || !typingIndicator) return;

    const chat = snap.data();
    const typingMap = chat.typing || {};
    const friendTyping = typingMap[friendId] === true;

    if (friendTyping) typingIndicator.classList.remove("hidden");
    else typingIndicator.classList.add("hidden");
  });
}

function bindTypingEmitter() {
  if (!messageInput) return;

  messageInput.addEventListener("input", () => {
    setTyping(true);

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      setTyping(false);
    }, 1500);
  });

  window.addEventListener("beforeunload", () => {
    setTyping(false);
  });
}

async function setTyping(value) {
  if (typingState === value) return;
  typingState = value;

  try {
    await updateDoc(chatRef, {
      [`typing.${myId}`]: value
    });
  } catch {}
}

/* ============================================================
   BLOC 13 : LISTEN MESSAGES
============================================================ */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, async (snap) => {
    const previousCount = lastRenderedMessageCount;
    lastRenderedMessageCount = snap.size;

    messagesEl.innerHTML = "";

    if (snap.empty) {
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");

    let previousDateKey = null;
    let incomingAdded = 0;

    snap.docs.forEach((docSnap, index) => {
      const message = { id: docSnap.id, ...docSnap.data() };

      if (isMessageHiddenForMe(message.id)) return;

      const isMine = message.senderId === myId;
      const currentDateKey = getMessageDateKey(message.createdAt);

      if (currentDateKey !== previousDateKey) {
        messagesEl.appendChild(renderDateSeparator(message.createdAt));
        previousDateKey = currentDateKey;
      }

      messagesEl.appendChild(renderMessage(message, isMine));

      if (!isMine && index >= previousCount) {
        incomingAdded += 1;
      }
    });

    if (isNearBottom) {
      scrollToBottom();
      unreadVisualCount = 0;
      hideScrollButton();
    } else if (incomingAdded > 0) {
      unreadVisualCount += incomingAdded;
      updateUnreadBadge();
      showScrollButton();
    }

    await markDeliveredReadAndResetUnread();
    await updateChatReadMeta();
  }, (error) => {
    console.error("Erreur onSnapshot messages :", error);
  });
}

/* ============================================================
   BLOC 14 : COMPOSER TEXTE
============================================================ */
function bindComposerEvents() {
  bindTypingEmitter();

  sendBtn?.addEventListener("click", sendTextMessage);

  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendTextMessage();
    }
  });
}

async function sendTextMessage() {
  if (sending) return;

  const text = (messageInput?.value || "").trim();
  if (!text) return;

  sending = true;
  sendBtn?.setAttribute("disabled", "true");
  sendBtn?.classList.add("opacity-60");

  try {
    await setTyping(false);

    await createMessageDoc({
      type: "text",
      text,
      replyTo: replyTarget
    });

    clearReplyTarget();
    messageInput.value = "";
    messageInput.focus();
    scrollToBottom();
  } catch (error) {
    console.error("Erreur sendTextMessage :", error);
    alert("Envoi impossible : " + (error?.message || error));
  } finally {
    sending = false;
    sendBtn?.removeAttribute("disabled");
    sendBtn?.classList.remove("opacity-60");
  }
}

/* ============================================================
   BLOC 15 : PIÈCES JOINTES
============================================================ */
function bindAttachments() {
  attachBtn?.addEventListener("click", () => {
    fileInput?.click();
  });

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await sendFileMessage(file);
      fileInput.value = "";
    } catch (error) {
      console.error("Erreur sendFileMessage:", error);
      alert("Impossible d'envoyer ce fichier.");
    }
  });
}

async function sendFileMessage(file) {
  const uploaded = await uploadChatFile(file);
  const kind = getFileKind(file);

  await createMessageDoc({
    type: kind,
    text: "",
    fileUrl: uploaded.url,
    filePath: uploaded.path,
    fileName: file.name,
    mimeType: file.type || "",
    size: file.size || 0,
    duration: null,
    replyTo: replyTarget
  });

  clearReplyTarget();
}

function getFileKind(file) {
  const type = file.type || "";

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

async function uploadChatFile(file) {
  if (!storage) {
    throw new Error("storage non disponible dans firebase-config.js");
  }

  const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const path = `chat_uploads/${chatId}/${myId}/${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path };
}

/* ============================================================
   BLOC 16 : NOTES VOCALES
============================================================ */
function bindVoiceRecorder() {
  recordBtn?.addEventListener("click", async () => {
    if (!isRecording) {
      await startVoiceRecording();
    } else {
      await stopVoiceRecording();
    }
  });
}

async function startVoiceRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });

      try {
        const uploaded = await uploadChatFile(file);

        await createMessageDoc({
          type: "audio",
          text: "",
          fileUrl: uploaded.url,
          filePath: uploaded.path,
          fileName: file.name,
          mimeType: file.type || "audio/webm",
          size: file.size || 0,
          duration: null,
          replyTo: replyTarget
        });

        clearReplyTarget();
        scrollToBottom();
      } catch (error) {
        console.error("Erreur voice note:", error);
        alert("Impossible d'envoyer la note vocale.");
      }

      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    recordingStatus?.classList.remove("hidden");
    recordBtn.innerHTML = `<i class="bi bi-stop-fill text-lg"></i>`;
    recordBtn.classList.remove("bg-gray-100", "text-gray-700");
    recordBtn.classList.add("bg-danger", "text-white");
  } catch (error) {
    console.error("Erreur startVoiceRecording:", error);
    alert("Impossible d'accéder au micro.");
  }
}

async function stopVoiceRecording() {
  if (!mediaRecorder || !isRecording) return;

  mediaRecorder.stop();
  isRecording = false;
  recordingStatus?.classList.add("hidden");
  recordBtn.innerHTML = `<i class="bi bi-mic-fill text-lg"></i>`;
  recordBtn.classList.remove("bg-danger", "text-white");
  recordBtn.classList.add("bg-gray-100", "text-gray-700");
}

/* ============================================================
   BLOC 17 : CRÉATION DOC MESSAGE
============================================================ */
async function createMessageDoc(payload) {
  const base = {
    senderId: myId,
    type: payload.type || "text",
    text: payload.text || "",
    fileUrl: payload.fileUrl || null,
    filePath: payload.filePath || null,
    fileName: payload.fileName || null,
    mimeType: payload.mimeType || null,
    size: payload.size || null,
    duration: payload.duration || null,
    replyTo: payload.replyTo || null,
    forwardedFrom: payload.forwardedFrom || null,
    reactions: {},
    isDeleted: false,
    deletedForEveryone: false,
    createdAt: serverTimestamp(),
    deliveredTo: { [myId]: true },
    readBy: { [myId]: true }
  };

  await addDoc(messagesRef, base);

  const preview =
    payload.type === "text" ? payload.text :
    payload.type === "image" ? "📷 Image" :
    payload.type === "video" ? "🎬 Vidéo" :
    payload.type === "audio" ? "🎤 Note vocale" :
    "📎 Fichier";

  const chatSnap = await getDoc(chatRef);
  const chatData = chatSnap.exists() ? chatSnap.data() : {};
  const unreadMap = chatData.unreadCount || {};
  const nextFriendUnread = (unreadMap[friendId] || 0) + 1;

  await updateDoc(chatRef, {
    lastMessage: preview,
    lastSenderId: myId,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`unreadCount.${friendId}`]: nextFriendUnread
  });
}

/* ============================================================
   BLOC 18 : RENDER MESSAGE
============================================================ */
function renderMessage(message, isMine) {
  const wrap = document.createElement("div");
  wrap.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className =
    `max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
      isMine ? "bg-primary text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"
    }`;

  bubble.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openMessageMenu(message);
  });

  let longPressTimer = null;
  bubble.addEventListener("touchstart", () => {
    longPressTimer = setTimeout(() => openMessageMenu(message), 500);
  }, { passive: true });

  bubble.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
  });

  bubble.addEventListener("touchmove", () => {
    clearTimeout(longPressTimer);
  });

  if (message.forwardedFrom) {
    const forwarded = document.createElement("div");
    forwarded.className = `mb-2 text-[11px] font-semibold ${isMine ? "text-white/80" : "text-gray-500"}`;
    forwarded.innerHTML = `<i class="bi bi-forward-fill mr-1"></i>Transféré`;
    bubble.appendChild(forwarded);
  }

  if (message.replyTo) {
    const replyBox = document.createElement("div");
    replyBox.className =
      `mb-2 px-3 py-2 rounded-xl border text-xs ${
        isMine ? "bg-white/10 border-white/20 text-white/90" : "bg-gray-50 border-gray-200 text-gray-600"
      }`;

    const sender = document.createElement("div");
    sender.className = "font-semibold mb-1";
    sender.textContent = message.replyTo.senderName || "Réponse";
    replyBox.appendChild(sender);

    const text = document.createElement("div");
    text.className = "truncate";
    text.textContent = buildReplyPreviewText(message.replyTo);
    replyBox.appendChild(text);

    bubble.appendChild(replyBox);
  }

  if (message.deletedForEveryone) {
    const deletedText = document.createElement("div");
    deletedText.className = "italic opacity-80";
    deletedText.textContent = "Ce message a été supprimé";
    bubble.appendChild(deletedText);
  } else {
    const type = message.type || "text";

    if (type === "text") {
      const textEl = document.createElement("div");
      textEl.textContent = message.text || "";
      bubble.appendChild(textEl);
    }

    if (type === "image" && message.fileUrl) {
      const img = document.createElement("img");
      img.src = message.fileUrl;
      img.className = "rounded-xl max-h-64 w-full object-cover";
      bubble.appendChild(img);
    }

    if (type === "video" && message.fileUrl) {
      const video = document.createElement("video");
      video.src = message.fileUrl;
      video.controls = true;
      video.className = "rounded-xl max-h-64 w-full";
      bubble.appendChild(video);
    }

    if (type === "audio" && message.fileUrl) {
      bubble.appendChild(renderAudioCard(message.fileUrl, isMine, message));
    }

    if (type === "file" && message.fileUrl) {
      const fileLink = document.createElement("a");
      fileLink.href = message.fileUrl;
      fileLink.target = "_blank";
      fileLink.rel = "noopener noreferrer";
      fileLink.className = isMine ? "underline text-white font-medium" : "underline text-primary font-medium";
      fileLink.textContent = message.fileName || "Ouvrir le fichier";
      bubble.appendChild(fileLink);
    }
  }

  const reactionsRow = renderReactions(message);
  if (reactionsRow) {
    bubble.appendChild(reactionsRow);
  }

  const metaRow = document.createElement("div");
  metaRow.className = "mt-1 text-[11px] opacity-90 flex items-center justify-end gap-1";

  const timeEl = document.createElement("span");
  timeEl.textContent = formatMessageTime(message.createdAt);
  timeEl.className = isMine ? "text-white/80" : "text-gray-400";
  metaRow.appendChild(timeEl);

  if (isMine) {
    const delivered = (message.deliveredTo && message.deliveredTo[friendId]) === true;
    const read = (message.readBy && message.readBy[friendId]) === true;

    const tick = document.createElement("span");
    tick.textContent = read ? "✓✓" : delivered ? "✓✓" : "✓";
    tick.className = read ? "text-green-300 font-bold" : "text-white/80";

    metaRow.appendChild(tick);
  }

  bubble.appendChild(metaRow);
  wrap.appendChild(bubble);
  return wrap;
}

/* ============================================================
   BLOC 19 : AUDIO PLAYER MOBILE
============================================================ */
function renderAudioCard(url, isMine, message) {
  const box = document.createElement("div");
  box.className = "w-full";

  const audio = document.createElement("audio");
  audio.src = url;
  audio.preload = "metadata";
  audio.className = "hidden";

  const row = document.createElement("div");
  row.className =
    `p-3 rounded-2xl ${
      isMine ? "bg-white/10" : "bg-gray-50 border border-gray-100"
    }`;

  const top = document.createElement("div");
  top.className = "flex items-center gap-3";

  const playBtn = document.createElement("button");
  playBtn.className =
    `w-10 h-10 rounded-full flex items-center justify-center ${
      isMine ? "bg-white/15 text-white" : "bg-primary text-white"
    }`;
  playBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;

  const label = document.createElement("div");
  label.className = isMine ? "text-white/90 text-xs font-medium" : "text-gray-600 text-xs font-medium";
  label.textContent = "Note vocale";

  const speedBtn = document.createElement("button");
  speedBtn.className =
    `ml-auto px-2 py-1 rounded-lg text-[11px] ${
      isMine ? "bg-white/10 text-white" : "bg-gray-200 text-gray-700"
    }`;
  speedBtn.textContent = "1x";

  top.appendChild(playBtn);
  top.appendChild(label);
  top.appendChild(speedBtn);

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "100";
  range.value = "0";
  range.className = "mt-3 w-full";

  row.appendChild(top);
  row.appendChild(range);
  box.appendChild(row);
  box.appendChild(audio);

  let isPlaying = false;
  const speeds = [1, 1.5, 2];
  let speedIndex = 0;

  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play().catch(() => {});
      isPlaying = true;
      playBtn.innerHTML = `<i class="bi bi-pause-fill"></i>`;
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
    }
  });

  speedBtn.addEventListener("click", () => {
    speedIndex = (speedIndex + 1) % speeds.length;
    audio.playbackRate = speeds[speedIndex];
    speedBtn.textContent = `${speeds[speedIndex]}x`;
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    range.value = String((audio.currentTime / audio.duration) * 100);
  });

  range.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(range.value) / 100) * audio.duration;
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    playBtn.innerHTML = `<i class="bi bi-play-fill"></i>`;
    range.value = "0";
  });

  row.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openMessageMenu(message);
  });

  return box;
}

/* ============================================================
   BLOC 20 : RÉACTIONS
============================================================ */
function renderReactions(message) {
  const reactions = message.reactions || {};
  const values = Object.values(reactions);

  if (!values.length) return null;

  const grouped = {};
  values.forEach((emoji) => {
    grouped[emoji] = (grouped[emoji] || 0) + 1;
  });

  const row = document.createElement("div");
  row.className = "mt-2 flex flex-wrap gap-1";

  Object.entries(grouped).forEach(([emoji, count]) => {
    const chip = document.createElement("div");
    chip.className = "px-2 py-1 rounded-full bg-black/5 text-[11px] flex items-center gap-1";
    chip.textContent = `${emoji} ${count}`;
    row.appendChild(chip);
  });

  return row;
}

async function toggleReaction(messageId, emoji) {
  const refMessage = doc(db, "chats", chatId, "messages", messageId);
  const snap = await getDoc(refMessage);
  if (!snap.exists()) return;

  const data = snap.data();
  const current = data.reactions?.[myId] || null;

  if (current === emoji) {
    await updateDoc(refMessage, {
      [`reactions.${myId}`]: deleteField()
    });
  } else {
    await updateDoc(refMessage, {
      [`reactions.${myId}`]: emoji
    });
  }
}

/* ============================================================
   BLOC 21 : MENU MESSAGE
============================================================ */
function bindMessageMenu() {
  closeMessageMenuBtn?.addEventListener("click", closeMessageMenu);
  messageMenuOverlay?.addEventListener("click", (e) => {
    if (e.target === messageMenuOverlay) closeMessageMenu();
  });

  reactionBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!selectedMessageForMenu?.id) return;
      await toggleReaction(selectedMessageForMenu.id, btn.dataset.reaction);
      closeMessageMenu();
    });
  });

  replyActionBtn?.addEventListener("click", () => {
    if (!selectedMessageForMenu) return;
    setReplyTarget(selectedMessageForMenu);
    closeMessageMenu();
    messageInput?.focus();
  });

  pinActionBtn?.addEventListener("click", async () => {
    if (!selectedMessageForMenu) return;

    try {
      await updateDoc(chatRef, {
        pinnedMessage: {
          messageId: selectedMessageForMenu.id,
          preview: buildPreviewFromMessage(selectedMessageForMenu),
          pinnedBy: myId,
          pinnedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("pin error:", error);
    }

    closeMessageMenu();
  });

  forwardActionBtn?.addEventListener("click", () => {
    if (!selectedMessageForMenu) return;

    localStorage.setItem("myum_forward_payload", JSON.stringify({
      sourceChatId: chatId,
      message: {
        type: selectedMessageForMenu.type || "text",
        text: selectedMessageForMenu.text || "",
        fileUrl: selectedMessageForMenu.fileUrl || null,
        fileName: selectedMessageForMenu.fileName || null,
        mimeType: selectedMessageForMenu.mimeType || null
      }
    }));

    closeMessageMenu();
    window.location.href = "friends.html";
  });

  downloadActionBtn?.addEventListener("click", () => {
    if (!selectedMessageForMenu?.fileUrl) return;

    const a = document.createElement("a");
    a.href = selectedMessageForMenu.fileUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = selectedMessageForMenu.fileName || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();

    closeMessageMenu();
  });

  deleteMineActionBtn?.addEventListener("click", () => {
    if (!selectedMessageForMenu?.id) return;
    hideMessageForMe(selectedMessageForMenu.id);
    closeMessageMenu();
    listenMessages();
  });

  deleteAllActionBtn?.addEventListener("click", async () => {
    if (!selectedMessageForMenu?.id) return;

    try {
      await updateDoc(doc(db, "chats", chatId, "messages", selectedMessageForMenu.id), {
        deletedForEveryone: true,
        text: "",
        fileUrl: null,
        filePath: null,
        fileName: null,
        mimeType: null,
        size: null,
        duration: null,
        replyTo: null
      });
    } catch (error) {
      console.error("delete all error:", error);
    }

    closeMessageMenu();
  });
}

function openMessageMenu(message) {
  selectedMessageForMenu = message;
  messageMenuOverlay?.classList.remove("hidden");

  if (downloadActionBtn) {
    if (message?.fileUrl) downloadActionBtn.classList.remove("hidden");
    else downloadActionBtn.classList.add("hidden");
  }

  if (deleteAllActionBtn) {
    if (message?.senderId === myId) deleteAllActionBtn.classList.remove("hidden");
    else deleteAllActionBtn.classList.add("hidden");
  }
}

function closeMessageMenu() {
  messageMenuOverlay?.classList.add("hidden");
}

/* ============================================================
   BLOC 22 : RÉPONSE
============================================================ */
function bindReplyUi() {
  cancelReplyBtn?.addEventListener("click", clearReplyTarget);
}

function setReplyTarget(message) {
  replyTarget = {
    id: message.id || null,
    senderId: message.senderId || null,
    senderName: message.senderId === myId ? "Vous" : (roomTitle?.textContent || "Contact"),
    type: message.type || "text",
    text: message.text || "",
    fileName: message.fileName || null
  };

  replyPreviewText.textContent = buildReplyPreviewText(replyTarget);
  replyPreview?.classList.remove("hidden");
}

function clearReplyTarget() {
  replyTarget = null;
  replyPreview?.classList.add("hidden");
}

function buildReplyPreviewText(reply) {
  if (!reply) return "—";
  if (reply.type === "text") return reply.text || "Message";
  if (reply.type === "image") return "📷 Image";
  if (reply.type === "video") return "🎬 Vidéo";
  if (reply.type === "audio") return "🎤 Note vocale";
  return reply.fileName || "📎 Fichier";
}

/* ============================================================
   BLOC 23 : DELETE POUR MOI
   Rôle :
   - Suppression locale dans localStorage
============================================================ */
function getHiddenMessagesKey() {
  return `myum_hidden_messages_${chatId}_${myId}`;
}

function getHiddenMessagesSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(getHiddenMessagesKey()) || "[]"));
  } catch {
    return new Set();
  }
}

function hideMessageForMe(messageId) {
  const set = getHiddenMessagesSet();
  set.add(messageId);
  localStorage.setItem(getHiddenMessagesKey(), JSON.stringify(Array.from(set)));
}

function isMessageHiddenForMe(messageId) {
  return getHiddenMessagesSet().has(messageId);
}

/* ============================================================
   BLOC 24 : TRACKING SCROLL
============================================================ */
function bindScrollTracking() {
  messagesWrapper?.addEventListener("scroll", () => {
    const threshold = 100;
    const distanceFromBottom =
      messagesWrapper.scrollHeight -
      messagesWrapper.scrollTop -
      messagesWrapper.clientHeight;

    isNearBottom = distanceFromBottom < threshold;

    if (isNearBottom) {
      unreadVisualCount = 0;
      updateUnreadBadge();
      hideScrollButton();
    }
  });
}

/* ============================================================
   BLOC 25 : BOUTON NOUVEAUX MESSAGES
============================================================ */
function bindScrollButton() {
  scrollToBottomBtn?.addEventListener("click", () => {
    scrollToBottom();
    unreadVisualCount = 0;
    updateUnreadBadge();
    hideScrollButton();
  });
}

function showScrollButton() {
  if (!scrollToBottomBtn) return;
  scrollToBottomBtn.classList.remove("hidden");
}

function hideScrollButton() {
  if (!scrollToBottomBtn) return;
  scrollToBottomBtn.classList.add("hidden");
}

function updateUnreadBadge() {
  if (!scrollUnreadBadge) return;
  scrollUnreadBadge.textContent = String(unreadVisualCount);
}

function scrollToBottom() {
  if (!messagesWrapper) return;
  messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}

/* ============================================================
   BLOC 26 : DELIVERED / READ / RESET UNREAD
============================================================ */
async function markDeliveredReadAndResetUnread() {
  await updateDoc(chatRef, {
    [`unreadCount.${myId}`]: 0
  }).catch(() => {});

  const mod = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const { getDocs } = mod;

  const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q).catch(() => null);
  if (!snap) return;

  const batch = writeBatch(db);
  let changed = 0;

  snap.forEach((docSnap) => {
    const m = docSnap.data();

    if (m.senderId === myId) return;

    const deliveredTo = m.deliveredTo || {};
    const readBy = m.readBy || {};

    const needsDelivered = deliveredTo[myId] !== true;
    const needsRead = readBy[myId] !== true;

    if (needsDelivered || needsRead) {
      batch.update(docSnap.ref, {
        [`deliveredTo.${myId}`]: true,
        [`readBy.${myId}`]: true
      });
      changed++;
    }
  });

  if (changed > 0) await batch.commit();
}

async function updateChatReadMeta() {
  await updateDoc(chatRef, {
    [`lastReadBy.${myId}`]: serverTimestamp()
  }).catch(() => {});
}

/* ============================================================
   BLOC 27 : HELPERS PREVIEW / DATES / TIME
============================================================ */
function buildPreviewFromMessage(message) {
  if (!message) return "Message";
  if (message.type === "text") return message.text || "Message";
  if (message.type === "image") return "📷 Image";
  if (message.type === "video") return "🎬 Vidéo";
  if (message.type === "audio") return "🎤 Note vocale";
  return message.fileName || "📎 Fichier";
}

function formatMessageTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function getMessageDateKey(ts) {
  if (!ts || !ts.toDate) return "unknown";
  const d = ts.toDate();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function renderDateSeparator(ts) {
  const wrap = document.createElement("div");
  wrap.className = "flex justify-center my-3";

  const label = document.createElement("div");
  label.className = "px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[11px] font-medium shadow-sm";
  label.textContent = formatDateSeparator(ts);

  wrap.appendChild(label);
  return wrap;
}

function formatDateSeparator(ts) {
  if (!ts || !ts.toDate) return "Date inconnue";

  const d = ts.toDate();
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = startOfToday - startOfMessageDay;
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}