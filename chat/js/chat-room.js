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

backBtn?.addEventListener("click", () => (window.location.href = "index.html"));
dashBtn?.addEventListener("click", () => window.goTo?.("public/dashboard.html"));

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
  console.error("initRoom error:", e);
  alert("Erreur room : " + (e?.message || e));
  window.location.href = "index.html";
});

async function initRoom() {
  await guardFriendship();
  await loadFriendHeader();
  await ensureChatDoc();
  listenMessages();
  bindSend();
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
   HEADER
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
   REALTIME MESSAGES
========================= */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(
    q,
    (snap) => {
      messagesEl.innerHTML = "";

      if (snap.empty) {
        emptyState?.classList.remove("hidden");
        return;
      }

      emptyState?.classList.add("hidden");

      snap.forEach((d) => {
        const m = d.data();
        const isMine = m.senderId === myId;
        messagesEl.appendChild(renderBubble(m.text || "", isMine));
      });

      // scroll bas
      window.scrollTo(0, document.body.scrollHeight);
    },
    (err) => {
      console.error("onSnapshot error:", err);
      alert("Erreur écoute messages : " + (err?.message || err));
    }
  );
}

/* =========================
   BIND SEND
========================= */
function bindSend() {
  sendBtn?.addEventListener("click", () => sendMessage());

  messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

/* =========================
   SEND MESSAGE (avec erreurs visibles)
========================= */
let sending = false;

async function sendMessage() {
  if (sending) return;

  const text = (messageInput?.value || "").trim();
  if (!text) return;

  sending = true;
  sendBtn?.setAttribute("disabled", "true");
  sendBtn?.classList.add("opacity-60");

  try {
    // write message
    await addDoc(messagesRef, {
      senderId: myId,
      text,
      createdAt: serverTimestamp()
    });

    // update parent chat meta
    await updateDoc(chatRef, {
      lastMessage: text.slice(0, 250),
      updatedAt: serverTimestamp()
    });

    // reset input
    messageInput.value = "";
    messageInput.focus();

  } catch (e) {
    console.error("sendMessage error:", e);
    alert("Envoi impossible : " + (e?.message || e));
  } finally {
    sending = false;
    sendBtn?.removeAttribute("disabled");
    sendBtn?.classList.remove("opacity-60");
  }
}

/* =========================
   UI
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