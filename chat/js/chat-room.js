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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   SESSION
========================= */
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

backBtn.addEventListener("click", () => (window.location.href = "index.html"));
dashBtn.addEventListener("click", () => window.goTo("public/dashboard.html"));

/* =========================
   CHAT ID (unique, no duplicates)
========================= */
function buildChatId(a, b) {
  const [x, y] = [a, b].sort();
  return `chat_${x}_${y}`;
}

const chatId = buildChatId(myId, friendId);
const chatRef = doc(db, "chats", chatId);
const messagesRef = collection(db, "chats", chatId, "messages");

/* =========================
   START
========================= */
await guardFriendship();
await loadFriendHeader();
await ensureChatDoc();
listenMessages();

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* =========================
   SECURITY: friends-only
========================= */
async function guardFriendship() {
  const friendEdge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!friendEdge.exists()) {
    alert("Chat disponible uniquement entre amis.");
    window.location.href = "index.html";
  }
}

/* =========================
   HEADER INFO
========================= */
async function loadFriendHeader() {
  const friendSnap = await getDoc(doc(db, "users", friendId)).catch(() => null);
  const u = friendSnap && friendSnap.exists() ? friendSnap.data() : {};

  const name =
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    u.username ||
    friendId;

  roomTitle.textContent = name;
  roomSub.textContent = u.username ? `@${u.username}` : "—";
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
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
}

/* =========================
   REALTIME LISTENER
========================= */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";

    if (snap.empty) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    snap.forEach((d) => {
      const m = d.data();
      const isMine = m.senderId === myId;
      messagesEl.appendChild(renderBubble(m.text || "", isMine, m.createdAt));
    });

    // Auto scroll bottom
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/* =========================
   SEND MESSAGE
========================= */
async function sendMessage() {
  const text = (messageInput.value || "").trim();
  if (!text) return;

  messageInput.value = "";
  messageInput.focus();

  await addDoc(messagesRef, {
    senderId: myId,
    text,
    createdAt: serverTimestamp()
  });

  // Update lastMessage + updatedAt on parent chat
  await updateDoc(chatRef, {
    lastMessage: text.slice(0, 250),
    updatedAt: serverTimestamp()
  }).catch(() => {});
}

/* =========================
   UI BUBBLE
========================= */
function renderBubble(text, isMine) {
  const wrap = document.createElement("div");
  wrap.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className =
    `max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
      isMine ? "bg-primary text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"
    }`;

  bubble.textContent = text;

  wrap.appendChild(bubble);
  return wrap;
}