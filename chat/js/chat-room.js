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
   BLOC 1 : SESSION UTILISATEUR
   Rôle :
   - Récupérer l'utilisateur connecté
   - Sécuriser l'accès à la room
   Utilité scientifique :
   - Toute la logique dépend d'une identité locale stable
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
   BLOC 2 : PARAMÈTRES DE ROUTE
   Rôle :
   - Identifier le correspondant via l'URL
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

if (!friendId) {
  alert("Aucun utilisateur sélectionné.");
  window.location.href = "list.html";
}

/* ============================================================
   BLOC 3 : DOM
   Rôle :
   - Centraliser toutes les références HTML
============================================================ */
const backBtn = document.getElementById("backBtn");
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

/* ============================================================
   BLOC 4 : NAVIGATION LOCALE
   Rôle :
   - Retour conversations
   - Retour menu chat
============================================================ */
backBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

chatHomeBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

/* ============================================================
   BLOC 5 : CHAT ID STABLE
   Rôle :
   - Générer un identifiant unique pour la conversation
   Utilité scientifique :
   - Empêche les doublons de room entre deux mêmes utilisateurs
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
   Rôle :
   - Variables runtime de contrôle
============================================================ */
let sending = false;
let typingTimer = null;
let typingState = false;
let isNearBottom = true;
let unreadVisualCount = 0;

/* ============================================================
   BLOC 7 : INITIALISATION
   Rôle :
   - Orchestration de tous les sous-systèmes de la room
============================================================ */
initRoom().catch((error) => {
  console.error("Erreur initRoom :", error);
  alert("Erreur room : " + (error?.message || error));
  window.location.href = "list.html";
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
   BLOC 8 : FRIENDS-ONLY
   Rôle :
   - Restreindre la room aux amis uniquement
============================================================ */
async function guardFriendship() {
  const edge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!edge.exists()) {
    alert("Cette conversation est réservée aux amis.");
    window.location.href = "index.html";
  }
}

/* ============================================================
   BLOC 9 : CRÉATION DU DOC CHAT
   Rôle :
   - Garantir une structure minimale si le chat n'existe pas encore
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
   BLOC 10 : PROFIL + AVATAR + PRÉSENCE
   Rôle :
   - Afficher nom, avatar, online / vu à ...
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
   BLOC 11 : TYPING (lecture)
   Rôle :
   - Afficher "… écrit"
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
   BLOC 12 : TYPING (émission)
   Rôle :
   - Envoyer mon état de frappe
   Utilité scientifique :
   - Debounce pour limiter les écritures Firestore
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
   BLOC 13 : ÉCOUTE TEMPS RÉEL DES MESSAGES
   Rôle :
   - Rendu live
   - Scroll intelligent
   - Mise à jour ticks / unread
============================================================ */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, async (snap) => {
    const previousScrollHeight = messagesWrapper?.scrollHeight || 0;

    messagesEl.innerHTML = "";

    if (snap.empty) {
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");

    let hasIncomingNewMessage = false;

    snap.forEach((docSnap) => {
      const m = docSnap.data();
      const isMine = m.senderId === myId;
      messagesEl.appendChild(renderBubble(m, isMine));

      if (!isMine) {
        hasIncomingNewMessage = true;
      }
    });

    /* ============================================================
       BLOC 13A : SCROLL INTELLIGENT
       Rôle :
       - Si utilisateur est en bas -> auto-scroll
       - Sinon -> on garde sa position et on affiche le bouton
    ============================================================ */
    if (isNearBottom) {
      scrollToBottom();
      hideScrollButton();
    } else {
      // garder une impression de stabilité
      const newScrollHeight = messagesWrapper?.scrollHeight || 0;
      const delta = newScrollHeight - previousScrollHeight;
      if (messagesWrapper && delta > 0) {
        messagesWrapper.scrollTop += delta;
      }

      if (hasIncomingNewMessage) {
        unreadVisualCount += 1;
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
   BLOC 14 : TRACKING DU SCROLL
   Rôle :
   - Savoir si l'utilisateur est près du bas
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
      hideScrollButton();
    }
  });
}

/* ============================================================
   BLOC 15 : BOUTON "NOUVEAUX MESSAGES"
   Rôle :
   - Permettre de revenir en bas proprement
============================================================ */
function bindScrollButton() {
  scrollToBottomBtn?.addEventListener("click", () => {
    scrollToBottom();
    unreadVisualCount = 0;
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

function scrollToBottom() {
  if (!messagesWrapper) return;
  messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}

/* ============================================================
   BLOC 16 : INPUT + ENVOI
   Rôle :
   - Bouton envoyer
   - Touche Enter
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
   BLOC 17 : ENVOI DE MESSAGE
   Rôle :
   - Ajouter le message
   - Mettre à jour lastMessage et unreadCount
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
   BLOC 18 : DÉLIVRÉ / LU + RESET UNREAD
   Rôle :
   - Marquer les messages reçus comme délivrés/lus
   - Remettre mes non-lus à zéro
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
   BLOC 19 : RENDU DES BULLES
   Rôle :
   - Texte du message
   - Heure d’envoi
   - Ticks envoyé / délivré / lu
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

  /* ----------------------------
     Texte du message
  ----------------------------- */
  const textEl = document.createElement("div");
  textEl.textContent = message.text || "";
  bubble.appendChild(textEl);

  /* ----------------------------
     Ligne méta : heure + ticks
  ----------------------------- */
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
   BLOC 20 : FORMATAGE DE L’HEURE
   Rôle :
   - Afficher l’heure d’envoi d’un message
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
