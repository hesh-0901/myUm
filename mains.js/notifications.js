// mains.js/notifications.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BLOC 1 : SESSION
   Rôle :
   - Identifier l'utilisateur courant
============================================================ */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

/* ============================================================
   BLOC 2 : BASE PATH
   Rôle :
   - Gérer correctement GitHub Pages (/repo/) ou racine (/)
============================================================ */
function getBasePath() {
  const { pathname, hostname } = window.location;
  const parts = pathname.split("/").filter(Boolean);

  if (hostname.includes("github.io") && parts.length > 0) {
    return `/${parts[0]}/`;
  }

  return "/";
}

/* ============================================================
   BLOC 3 : AUDIO
   Rôle :
   - Préparer le son de notification
   - Débloquer l'audio sur mobile après interaction user
============================================================ */
let audioEl = null;
let audioUnlocked = false;

function getAudio() {
  if (!audioEl) {
    audioEl = new Audio(`${getBasePath()}assets/sounds/notify.mp3`);
    audioEl.volume = 0.9;
  }
  return audioEl;
}

export function unlockAudioOnce() {
  if (audioUnlocked) return;

  const unlock = async () => {
    try {
      const a = getAudio();
      await a.play();
      a.pause();
      a.currentTime = 0;
      audioUnlocked = true;
    } catch {
      // best effort
    } finally {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    }
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

function playSound() {
  try {
    const a = getAudio();
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

/* ============================================================
   BLOC 4 : TOAST LOCAL
   Rôle :
   - Affichage visuel si un nouveau message arrive
============================================================ */
function showToast(message) {
  let t = document.getElementById("myum_global_toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "myum_global_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[9999]";
    document.body.appendChild(t);
  }

  t.textContent = message;
  t.style.opacity = "1";

  clearTimeout(window.__myumGlobalToastTimer);
  window.__myumGlobalToastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1800);
}

/* ============================================================
   BLOC 5 : NOTIFICATION NAVIGATEUR
   Rôle :
   - Notification système quand l'app est ouverte
   - Peut apparaître dans le téléphone si permission accordée
   Limite :
   - Sans service worker / push, pas de vrai background push garanti
============================================================ */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    return await Notification.requestPermission();
  } catch {
    return "error";
  }
}

function showBrowserNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: `${getBasePath()}assets/cover.jpg`
    });
  } catch {
    // best effort
  }
}

/* ============================================================
   BLOC 6 : BADGE GLOBAL
   Rôle :
   - Calculer le total des unreadCount
   - Diffuser un événement global dans l'app
   - Permet au dashboard/nav de réagir sans dépendre du chat directement
============================================================ */
function emitUnreadUpdate(total) {
  window.dispatchEvent(
    new CustomEvent("myum:chat-unread-update", {
      detail: { total }
    })
  );
}

/* ============================================================
   BLOC 7 : LISTENER GLOBAL DES CHATS
   Rôle :
   - Observer tous les chats où je suis participant
   - Calculer non-lus
   - Détecter nouveaux messages
============================================================ */
let unsubscribeChats = null;
const seenUnreadPerChat = new Map();

export function initNotifications() {
  const me = getCurrentUser();
  const myId = me?.id;
  if (!myId) return;

  unlockAudioOnce();
  requestNotificationPermission().catch(() => {});

  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", myId));

  if (unsubscribeChats) unsubscribeChats();

  unsubscribeChats = onSnapshot(q, (snap) => {
    let totalUnread = 0;

    snap.docChanges().forEach((change) => {
      if (change.type === "removed") return;

      const doc = change.doc;
      const data = doc.data();

      const unreadMap = data.unreadCount || {};
      const unread = unreadMap[myId] || 0;
      const lastSenderId = data.lastSenderId || null;
      const previousUnread = seenUnreadPerChat.get(doc.id);

      seenUnreadPerChat.set(doc.id, unread);
      totalUnread += unread;

      /* ------------------------------------------------------------
         NOUVEAU MESSAGE :
         - unread augmente
         - dernier message vient d'un autre user
      ------------------------------------------------------------ */
      if (
        previousUnread !== undefined &&
        unread > previousUnread &&
        lastSenderId &&
        lastSenderId !== myId
      ) {
        showToast("Nouveau message 🔔");
        playSound();

        // notification navigateur surtout utile si page masquée
        if (document.visibilityState === "hidden") {
          showBrowserNotification("MyUm", "Vous avez reçu un nouveau message");
        }
      }
    });

    /* ------------------------------------------------------------
       RECALCUL GLOBAL DES NON-LUS
    ------------------------------------------------------------ */
    // sécurité : on recalcule aussi sur tous les docs
    totalUnread = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      const unreadMap = data.unreadCount || {};
      totalUnread += unreadMap[myId] || 0;
    });

    emitUnreadUpdate(totalUnread);
    updateDocumentTitle(totalUnread);
  });
}

/* ============================================================
   BLOC 8 : TITRE DYNAMIQUE
   Rôle :
   - Afficher le total non lu dans l'onglet navigateur
============================================================ */
function updateDocumentTitle(totalUnread) {
  const baseTitle = "MyUm";
  if (totalUnread > 0) {
    document.title = `(${totalUnread}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}