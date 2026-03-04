// mains.js/notifications.js
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}

let audioUnlocked = false;
let audioEl = null;
let unsubscribe = null;

// Permet de “débloquer” l’audio sur mobile (Chrome/Android)
export function unlockAudioOnce() {
  if (audioUnlocked) return;

  const unlock = async () => {
    try {
      audioEl = new Audio(`${getBasePath()}assets/sounds/notify.mp3`);
      audioEl.volume = 0.9;
      // play() puis pause() pour autoriser les prochains play
      await audioEl.play();
      audioEl.pause();
      audioEl.currentTime = 0;
      audioUnlocked = true;
    } catch {
      // si bloqué, on retentera au prochain click
    } finally {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    }
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

function getBasePath() {
  const { pathname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  if (window.location.hostname.includes("github.io") && parts.length > 0) {
    return "/" + parts[0] + "/";
  }
  return "/";
}

function safePlay() {
  if (!audioEl) {
    audioEl = new Audio(`${getBasePath()}assets/sounds/notify.mp3`);
    audioEl.volume = 0.9;
  }
  // best effort
  audioEl.currentTime = 0;
  audioEl.play().catch(() => {});
}

export function initNotifications() {
  const me = getCurrentUser();
  const myId = me?.id;
  if (!myId) return;

  // Débloquer audio dès que l'utilisateur interagit avec l'app
  unlockAudioOnce();

  // Pour éviter de rejouer en boucle, on garde un cache des unreadCount vus
  const seen = new Map(); // chatId -> lastUnread

  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", myId));

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "removed") return;

      const doc = change.doc;
      const data = doc.data();

      const unreadMap = data.unreadCount || {};
      const unread = unreadMap[myId] || 0;

      const lastSenderId = data.lastSenderId || null;

      const prev = seen.get(doc.id);
      seen.set(doc.id, unread);

      // 🔔 Condition notification :
      // - unread augmente
      // - dernier message vient d’un autre user
      if (prev !== undefined && unread > prev && lastSenderId && lastSenderId !== myId) {
        safePlay();
      }
    });
  });
}