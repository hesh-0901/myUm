// chat/js/chat-room.js

import { db } from "../../mains.js/firebase-config.js";
import {
  doc, getDoc, setDoc, addDoc, collection, query, orderBy, limit,
  onSnapshot, serverTimestamp, updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   CHAT ROOM (PRIVATE DISCUSSION)
   Utilité:
   - Messages realtime
   - Statuts ✓ / ✓✓ / lu
   - Typing indicator
   - UnreadCount badges
   Index:
   - messages: orderBy(createdAt) (simple)
============================================================ */

/* =========================
   SESSION
========================= */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}
const me = getCurrentUser();
const myId = me?.id;

if (!myId) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* =========================
   PARAMS (room.html?uid=...)
========================= */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");
if (!friendId) {
  alert("Aucun utilisateur sélectionné.");
  window.location.href = "index.html";
}

/* =========================
   DOM
========================= */
const backBtn = document.getElementById("backBtn");
const dashBtn = document.getElementById("dashBtn");

const roomAvatar = document.getElementById("roomAvatar");
const roomTitle = document.getElementById("roomTitle");
const roomSub = document.getElementById("roomSub");
const typingIndicator = document.getElementById("typingIndicator");

const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

backBtn?.addEventListener("click", () => (window.location.href = "list.html"));
dashBtn?.addEventListener("click", () => (window.location.href = "index.html"));

/* =========================
   CHAT ID STABLE
========================= */
function buildChatId(a, b) {
  const [x, y] = [a, b].sort();
  return `chat_${x}_${y}`;
}
const chatId = buildChatId(myId, friendId);
const chatRef = doc(db, "chats", chatId);
const messagesRef = collection(db, "chats", chatId, "messages");

/* =========================
   INIT
========================= */
init().catch((e) => {
  console.error("room init:", e);
  alert("Erreur room: " + (e?.message || e));
  window.location.href = "index.html";
});

async function init() {
  await guardFriendship();
  await ensureChatDoc();

  listenFriendPresenceAndAvatar();
  listenTyping();
  listenMessages();

  bindTypingEmitter();
  bindSend();

  await markDeliveredReadAndResetUnread();
  await updateChatReadMeta();
}

/* =========================
   FRIENDS ONLY
========================= */
async function guardFriendship() {
  const edge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!edge.exists()) {
    alert("Chat disponible uniquement entre amis.");
    window.location.href = "index.html";
  }
}

/* =========================
   ENSURE CHAT DOC
========================= */
async function ensureChatDoc() {
  const snap = await getDoc(chatRef);
  if (snap.exists()) return;

  await setDoc(chatRef, {
    participants: [myId, friendId],
    lastMessage: "",
    lastSenderId: "",
    lastMessageAt: serverTimestamp(),
    lastReadBy: {},
    unreadCount: { [myId]: 0, [friendId]: 0 },
    typing: {},
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

/* =========================
   FRIEND PRESENCE + AVATAR
========================= */
function listenFriendPresenceAndAvatar() {
  onSnapshot(doc(db, "users", friendId), (snap) => {
    const u = snap.exists() ? snap.data() : {};

    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const username = u.username || "";
    const photoURL = u.photoURL || null;

    const display =
      (`${firstName} ${lastName}`).trim() ||
      username ||
      friendId;

    roomTitle.textContent = display;

    // Avatar fallback
    const initials =
      `${(firstName?.[0] || "")}${(lastName?.[0] || "")}`.toUpperCase() ||
      (username?.[0] || "").toUpperCase() ||
      "—";

    if (roomAvatar) {
      roomAvatar.innerHTML = "";
      roomAvatar.textContent = initials;

      if (photoURL && typeof photoURL === "string") {
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
    }

    // Online = lastSeen récent
    const lastSeenDate = u.lastSeen?.toDate ? u.lastSeen.toDate() : null;
    const online = lastSeenDate ? (Date.now() - lastSeenDate.getTime() < 45000) : false;

    if (online) {
      roomSub.textContent = "En ligne";
    } else if (lastSeenDate) {
      roomSub.textContent = `Vu à ${String(lastSeenDate.getHours()).padStart(2,"0")}:${String(lastSeenDate.getMinutes()).padStart(2,"0")}`;
    } else {
      roomSub.textContent = "—";
    }
  });
}

/* =========================
   TYPING LISTENER
========================= */
function listenTyping() {
  onSnapshot(chatRef, (snap) => {
    if (!snap.exists() || !typingIndicator) return;
    const typing = snap.data().typing || {};
    const friendTyping = typing[friendId] === true;

    if (friendTyping) typingIndicator.classList.remove("hidden");
    else typingIndicator.classList.add("hidden");
  });
}

/* =========================
   TYPING EMITTER (DEBOUNCE)
========================= */
let typingTimer = null;
let typingState = false;

function bindTypingEmitter() {
  if (!messageInput) return;

  messageInput.addEventListener("input", () => {
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), 1500);
  });

  window.addEventListener("beforeunload", () => setTyping(false));
}

async function setTyping(v) {
  if (typingState === v) return;
  typingState = v;
  try {
    await updateDoc(chatRef, { [`typing.${myId}`]: v });
  } catch {}
}

/* =========================
   MESSAGES REALTIME
========================= */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, async (snap) => {
    messagesEl.innerHTML = "";

    if (snap.empty) {
      emptyState?.classList.remove("hidden");
      return;
    }
    emptyState?.classList.add("hidden");

    snap.forEach((d) => {
      const m = d.data();
      const isMine = m.senderId === myId;
      messagesEl.appendChild(renderBubble(m, isMine));
    });

    // scroll simple
    messagesEl.scrollTop = messagesEl.scrollHeight;

    await markDeliveredReadAndResetUnread();
    await updateChatReadMeta();
  });
}

/* =========================
   SEND MESSAGE (updates chat meta + unreadCount)
========================= */
let sending = false;

function bindSend() {
  sendBtn?.addEventListener("click", sendMessage);
  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
  });
}

async function sendMessage() {
  if (sending) return;
  const text = (messageInput?.value || "").trim();
  if (!text) return;

  sending = true;
  sendBtn?.setAttribute("disabled","true");
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
    const chat = chatSnap.exists() ? chatSnap.data() : {};
    const unread = chat.unreadCount || {};
    const nextFriendUnread = (unread[friendId] || 0) + 1;

    await updateDoc(chatRef, {
      lastMessage: text.slice(0, 250),
      lastSenderId: myId,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${friendId}`]: nextFriendUnread
    });

    messageInput.value = "";
    messageInput.focus();
  } catch (e) {
    console.error("sendMessage:", e);
    alert("Erreur envoi: " + (e?.message || e));
  } finally {
    sending = false;
    sendBtn?.removeAttribute("disabled");
    sendBtn?.classList.remove("opacity-60");
  }
}

/* =========================
   DELIVERED/READ + RESET UNREAD
========================= */
async function markDeliveredReadAndResetUnread() {
  await updateDoc(chatRef, { [`unreadCount.${myId}`]: 0 }).catch(() => {});

  const mod = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const { getDocs } = mod;

  const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q).catch(() => null);
  if (!snap) return;

  const batch = writeBatch(db);
  let changed = 0;

  snap.forEach((d) => {
    const m = d.data();
    if (m.senderId === myId) return;

    const deliveredTo = m.deliveredTo || {};
    const readBy = m.readBy || {};
    const needsDelivered = deliveredTo[myId] !== true;
    const needsRead = readBy[myId] !== true;

    if (needsDelivered || needsRead) {
      batch.update(d.ref, {
        [`deliveredTo.${myId}`]: true,
        [`readBy.${myId}`]: true
      });
      changed++;
    }
  });

  if (changed > 0) await batch.commit();
}

async function updateChatReadMeta() {
  await updateDoc(chatRef, { [`lastReadBy.${myId}`]: serverTimestamp() }).catch(() => {});
}

/* =========================
   UI: BUBBLE + TICKS
========================= */
function renderBubble(m, isMine) {
  const wrap = document.createElement("div");
  wrap.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className =
    `max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
      isMine ? "bg-primary text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"
    }`;

  const textEl = document.createElement("div");
  textEl.textContent = m.text || "";
  bubble.appendChild(textEl);

  if (isMine) {
    const delivered = (m.deliveredTo && m.deliveredTo[friendId]) === true;
    const read = (m.readBy && m.readBy[friendId]) === true;

    const status = document.createElement("div");
    status.className = "mt-1 text-[11px] opacity-90 flex justify-end";

    const tick = document.createElement("span");
    tick.textContent = read ? "✓✓" : delivered ? "✓✓" : "✓";
    tick.className = read ? "text-sky-200 font-bold" : "text-white/80";

    status.appendChild(tick);
    bubble.appendChild(status);
  }

  wrap.appendChild(bubble);
  return wrap;
}