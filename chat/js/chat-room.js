// chat/js/chat-room.js

import { db } from "../../mains.js/firebase-config.js";
import {
  doc, getDoc, setDoc, addDoc, collection, query, orderBy, limit,
  onSnapshot, serverTimestamp, updateDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   SESSION
========================= */
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}
const currentUser = getCurrentUser();
const myId = currentUser?.id;

if (!myId) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* =========================
   PARAMS
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
const roomTitle = document.getElementById("roomTitle");
const roomSub = document.getElementById("roomSub");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

backBtn?.addEventListener("click", () => (window.location.href = "list.html"));
dashBtn?.addEventListener("click", () => (window.location.href = "index.html"));

/* =========================
   CHAT ID
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
initRoom().catch((e) => {
  console.error("initRoom:", e);
  alert("Erreur room : " + (e?.message || e));
  window.location.href = "index.html";
});

async function initRoom() {
  await guardFriendship();
  await ensureChatDoc();

  listenFriendPresence();   // ✅ online / lastSeen
  listenMessages();         // ✅ realtime messages

  bindSend();

  // open room => mark delivered/read + reset unread for me
  await markDeliveredReadAndResetUnread();
  await updateChatReadMeta();
}

/* =========================
   FRIENDS ONLY
========================= */
async function guardFriendship() {
  const friendEdge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!friendEdge.exists()) {
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
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

/* =========================
   FRIEND PRESENCE (C)
========================= */
function listenFriendPresence() {
  onSnapshot(doc(db, "users", friendId), (snap) => {
    const u = snap.exists() ? snap.data() : {};
    const name =
      (`${u.firstName || ""} ${u.lastName || ""}`).trim() ||
      u.username ||
      friendId;

    roomTitle.textContent = name;

    const online = u.online === true;
    const lastSeen = u.lastSeen?.toDate ? u.lastSeen.toDate() : null;

    if (online) {
      roomSub.textContent = "En ligne";
    } else if (lastSeen) {
      const hh = String(lastSeen.getHours()).padStart(2, "0");
      const mm = String(lastSeen.getMinutes()).padStart(2, "0");
      roomSub.textContent = `Vu à ${hh}:${mm}`;
    } else {
      roomSub.textContent = "—";
    }
  });
}

/* =========================
   REALTIME MESSAGES (A)
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

    window.scrollTo(0, document.body.scrollHeight);

    // every update => mark delivered/read + reset unread
    await markDeliveredReadAndResetUnread();
    await updateChatReadMeta();

  }, (err) => {
    console.error("onSnapshot messages:", err);
    alert("Erreur messages : " + (err?.message || err));
  });
}

/* =========================
   SEND MESSAGE (A+B)
========================= */
let sending = false;

function bindSend() {
  sendBtn?.addEventListener("click", () => sendMessage());
  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

async function sendMessage() {
  if (sending) return;

  const text = (messageInput?.value || "").trim();
  if (!text) return;

  sending = true;
  sendBtn?.setAttribute("disabled", "true");
  sendBtn?.classList.add("opacity-60");

  try {
    // message initial
    await addDoc(messagesRef, {
      senderId: myId,
      text,
      createdAt: serverTimestamp(),
      deliveredTo: { [myId]: true },
      readBy: { [myId]: true }
    });

    // update chat meta + unreadCount for friend (+1)
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.exists() ? chatSnap.data() : {};
    const unread = chatData.unreadCount || {};
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
    alert("Envoi impossible : " + (e?.message || e));
  } finally {
    sending = false;
    sendBtn?.removeAttribute("disabled");
    sendBtn?.classList.remove("opacity-60");
  }
}

/* =========================
   Delivered + Read + Reset unread (A+B)
========================= */
async function markDeliveredReadAndResetUnread() {
  // reset unread for me
  await updateDoc(chatRef, {
    [`unreadCount.${myId}`]: 0
  }).catch(() => {});

  // mark delivered/read on incoming (last 50)
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
  await updateDoc(chatRef, {
    [`lastReadBy.${myId}`]: serverTimestamp()
  }).catch(() => {});
}

/* =========================
   UI Bubble with ticks (A)
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

    const statusEl = document.createElement("div");
    statusEl.className = "mt-1 text-[11px] opacity-90 flex justify-end";

    const tick = document.createElement("span");
    tick.textContent = read ? "✓✓" : delivered ? "✓✓" : "✓";
    tick.className = read ? "text-sky-200 font-bold" : "text-white/80";

    statusEl.appendChild(tick);
    bubble.appendChild(statusEl);
  }

  wrap.appendChild(bubble);
  return wrap;
}