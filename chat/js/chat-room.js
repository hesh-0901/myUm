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
   - Garantit que toutes les actions sont liées à une identité locale
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
   - Identifier le correspondant à partir de l’URL
   Utilité scientifique :
   - Permet une room déterministe basée sur deux IDs
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

if (!friendId) {
  alert("Aucun utilisateur sélectionné.");
  window.location.href = "list.html";
}

/* ============================================================
   BLOC 3 : RÉFÉRENCES DOM
   Rôle :
   - Centraliser tous les éléments HTML utilisés
   Utilité scientifique :
   - Réduit les erreurs de sélection et facilite le debug
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

/* ============================================================
   BLOC 4 : NAVIGATION LOCALE
   Rôle :
   - Bouton retour vers liste
   - Bouton retour vers menu chat
============================================================ */
backBtn?.addEventListener("click", () => {
  window.location.href = "list.html";
});

chatHomeBtn?.addEventListener("click", () => {
  window.location.href = "index.html";
});

/* ============================================================
   BLOC 5 : IDENTIFIANT STABLE DU CHAT
   Rôle :
   - Construire un ID unique et non dupliqué pour la room
   Utilité scientifique :
   - Évite d’avoir plusieurs chats entre les mêmes personnes
============================================================ */
function buildChatId(a, b) {
  const [x, y] = [a, b].sort();
  return `chat_${x}_${y}`;
}

const chatId = buildChatId(myId, friendId);
const chatRef = doc(db, "chats", chatId);
const messagesRef = collection(db, "chats", chatId, "messages");

/* ============================================================
   BLOC 6 : ÉTAT LOCAL DE LA ROOM
   Rôle :
   - Variables runtime utiles pour éviter spam / incohérences
============================================================ */
let sending = false;
let typingTimer = null;
let typingState = false;
let isNearBottom = true;

/* ============================================================
   BLOC 7 : INITIALISATION GLOBALE
   Rôle :
   - Orchestration de tous les sous-systèmes
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

  listenFriendProfileAndPresence();
  listenTypingState();
  listenMessages();

  await markDeliveredReadAndResetUnread();
  await updateChatReadMeta();
}

/* ============================================================
   BLOC 8 : GARDE FRIENDS-ONLY
   Rôle :
   - Empêcher l’ouverture d’une room si les users ne sont pas amis
============================================================ */
async function guardFriendship() {
  const edge = await getDoc(doc(db, "users", myId, "friends", friendId));
  if (!edge.exists()) {
    alert("Cette conversation est réservée aux amis.");
    window.location.href = "index.html";
  }
}

/* ============================================================
   BLOC 9 : CRÉATION DU DOC CHAT SI ABSENT
   Rôle :
   - Garantir une structure minimale du chat
   Utilité scientifique :
   - Assure la cohérence du schéma avant écoute / envoi
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
   - Afficher nom, avatar et statut du correspondant
   Utilité scientifique :
   - La présence fiable dépend de lastSeen récent, pas seulement d’un booléen
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
   BLOC 11 : TYPING INDICATOR (lecture)
   Rôle :
   - Voir si l’autre est en train d’écrire
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
   BLOC 12 : TYPING INDICATOR (émission)
   Rôle :
   - Envoyer l’état "j’écris"
   Utilité scientifique :
   - Debounce pour éviter spam Firestore
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
   - Rendu live des messages
   - Mise à jour ticks / unread / scroll
============================================================ */
function listenMessages() {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, async (snap) => {
    messagesEl.innerHTML = "";

    if (snap.empty) {
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");

    snap.forEach((docSnap) => {
      const m = docSnap.data();
      const isMine = m.senderId === myId;
      messagesEl.appendChild(renderBubble(m, isMine));
    });

    if (isNearBottom) {
      scrollToBottom();
    }

    await markDeliveredReadAndResetUnread();
    await updateChatReadMeta();
  }, (error) => {
    console.error("Erreur onSnapshot messages :", error);
  });
}

/* ============================================================
   BLOC 14 : COMPORTEMENT DE SCROLL
   Rôle :
   - Détecter si l’utilisateur est en bas
   - Éviter un scroll agressif si plus tard on améliore l’UX
============================================================ */
function bindScrollTracking() {
  messagesWrapper?.addEventListener("scroll", () => {
    const threshold = 80;
    const distanceFromBottom =
      messagesWrapper.scrollHeight -
      messagesWrapper.scrollTop -
      messagesWrapper.clientHeight;

    isNearBottom = distanceFromBottom < threshold;
  });
}

function scrollToBottom() {
  if (!messagesWrapper) return;
  messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
}

/* ============================================================
   BLOC 15 : LIENS ENTRE INPUT ET ENVOI
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
   BLOC 16 : ENVOI DE MESSAGE
   Rôle :
   - Ajouter le message
   - Mettre à jour lastMessage
   - Incrémenter unreadCount du destinataire
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
   BLOC 17 : DÉLIVRÉ / LU + RESET UNREAD
   Rôle :
   - Marquer les messages reçus comme délivrés/lus
   - Remettre mes non-lus à 0
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
   BLOC 18 : RENDU DES BULLES + TICKS
   Rôle :
   - Affichage visuel des messages
   - ✓ envoyé / ✓✓ délivré / ✓✓ lu
============================================================ */
function renderBubble(message, isMine) {
  const wrap = document.createElement("div");
  wrap.className = `flex ${isMine ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className =
    `max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
      isMine
        ? "bg-primary