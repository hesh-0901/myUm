// chat/js/chat-room.js

import { db } from "../../mains.js/firebase-config.js";
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
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BLOC 1 : SESSION
   Rôle :
   - Identifier l'utilisateur connecté
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
   BLOC 2 : PARAMÈTRES URL
   Rôle :
   - Lire le correspondant depuis room.html?uid=...
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

if (!friendId) {
  alert("Aucun utilisateur sélectionné.");
  window.location.href = "index.html";
}

/* ============================================================
   BLOC 3 : DOM
   Rôle :
   - Récupérer tous les éléments HTML utilisés
============================================================ */
const backBtn = document.getElementById("backBtn");
const voiceCallBtn = document.getElementById("voiceCallBtn");
const chatHomeBtn = document.getElementById("chatHomeBtn");

const roomAvatar = document.getElementById("roomAvatar");
const roomTitle = document.getElementById("roomTitle");
const roomSub = document.getElementById("roomSub");
const typingIndicator = document.getElementById("typingIndicator");

const messagesWrapper = document.getElementById("messagesWrapper");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
const scrollUnreadBadge = document.getElementById("scrollUnreadBadge");

/* ============================================================
   BLOC 4 : NAVIGATION / ACTIONS HEADER
   Rôle :
   - Retour index
   - Ouvrir appel vocal
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
   BLOC 5 : CHAT ID STABLE
   Rôle :
   - Éviter les doublons de conversation
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
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

/* ============================================================
   BLOC 10 : PROFIL / AVATAR / PRÉSENCE
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
   BLOC 11 : TYPING LISTENER
============================================================ */
function listenTypingState() {
  onSnapshot(chatRef, (snap) => {
    if (!snap.exists() || !typingIndicator) return;

    const chat = snap.data();
    const typingMap = chat.typing || {};
    const friendTyping = typingMap[friendId] === true;

    if (friendTyping) {
      typingIndicator.classList.remove("hidden");
    } else {
      typingIndicator.classList.add("hidden");
    }
  });
}

/* ============================================================
   BLOC 12 : TYPING EMITTER
============================================================ */
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
  } catch {
    // best effort
  }
}

/* ============================================================
   BLOC 13 : LISTEN MESSAGES
   Rôle :
   - Rendu temps réel
   - Date separators
   - Scroll intelligent
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
      const message = docSnap.data();
      const isMine = message.senderId === myId;

      const currentDateKey = getMessageDateKey(message.createdAt);
      if (currentDateKey !== previousDateKey) {
        messagesEl.appendChild(renderDateSeparator(message.createdAt));
        previousDateKey = currentDateKey;
      }

      messagesEl.appendChild(renderBubble(message, isMine));

      if (!isMine && index >= previousCount) {
        incomingAdded += 1;
      }
    });

    if (isNearBottom) {
      scrollToBottom();
      unreadVisualCount = 0;
      hideScrollButton();
    } else {
      if (incomingAdded > 0) {
        unreadVisualCount += incomingAdded;
        updateUnreadBadge();
        showScrollButton();
      }
    }

    await markDeliveredReadAndResetUnread();
    await updateChatReadMeta();
  }, (error) => {
    console.error("Erreur onSnapshot messages :", error);
  });
}

/* ============================================================
   BLOC 14 : TRACKING SCROLL
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
   BLOC 15 : BOUTON NOUVEAUX MESSAGES
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
   BLOC 16 : COMPOSER EVENTS
============================================================ */
function bindComposerEvents() {
  bindTypingEmitter();

  sendBtn?.addEventListener("click", sendMessage);

  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

/* ============================================================
   BLOC 17 : ENVOI MESSAGE
============================================================ */
async function sendMessage() {
  if (sending) return;

  const text = (messageInput?.value || "").trim();
  if (!text) return;

  sending = true;
  sendBtn?.setAttribute("disabled", "true");
  sendBtn?.classList.add("opacity-60");

  try {
    await setTyping(false);

    await addDoc(messagesRef, {
      senderId: myId,
      text,
      createdAt: serverTimestamp(),
      deliveredTo: { [myId]: true },
      readBy: { [myId]: true }
    });

    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.exists() ? chatSnap.data() : {};
    const unreadMap = chatData.unreadCount || {};
    const nextFriendUnread = (unreadMap[friendId] || 0) + 1;

    await updateDoc(chatRef, {
      lastMessage: text.slice(0, 250),
      lastSenderId: myId,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${friendId}`]: nextFriendUnread
    });

    messageInput.value = "";
    messageInput.focus();
    scrollToBottom();
  } catch (error) {
    console.error("Erreur sendMessage :", error);
    alert("Envoi impossible : " + (error?.message || error));
  } finally {
    sending = false;
    sendBtn?.removeAttribute("disabled");
    sendBtn?.classList.remove("opacity-60");
  }
}

/* ============================================================
   BLOC 18 : DELIVERED / READ / RESET UNREAD
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

  if (changed > 0) {
    await batch.commit();
  }
}

async function updateChatReadMeta() {
  await updateDoc(chatRef, {
    [`lastReadBy.${myId}`]: serverTimestamp()
  }).catch(() => {});
}

/* ============================================================
   BLOC 19 : RENDER BULLE
============================================================ */
function renderBubble(message, isMine) {
  const wrap = document.createElement("div");
  wrap.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className =
    `max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
      isMine
        ? "bg-primary text-white rounded-br-md"
        : "bg-white text-gray-800 rounded-bl-md"
    }`;

  const textEl = document.createElement("div");
  textEl.textContent = message.text || "";
  bubble.appendChild(textEl);

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
    tick.className = read ? "text-sky-200 font-bold" : "text-white/80";

    metaRow.appendChild(tick);
  }

  bubble.appendChild(metaRow);
  wrap.appendChild(bubble);
  return wrap;
}

/* ============================================================
   BLOC 20 : FORMAT HEURE MESSAGE
============================================================ */
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

/* ============================================================
   BLOC 21 : DATE SEPARATORS
============================================================ */
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