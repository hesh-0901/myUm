// mains.js/notifications.js
import { db } from "./firebase-config.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   NOTIFICATIONS MODULE (GLOBAL)
   Utilité:
   - Jouer un son (si autorisé par le navigateur)
   - Montrer un toast visuel (fonctionne même si son bloqué)
   Déclenchement:
   - unreadCount[myId] augmente
   - lastSenderId != myId
   Index:
   - chats: participants (array-contains) + updatedAt desc (si utilisé ailleurs)
============================================================ */

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}

/* ----------------------------
   BASE PATH (GitHub Pages)
   Utilité: auto détecter /myUm/ sur github.io
----------------------------- */
function basePath() {
  const { pathname, hostname } = window.location;
  const parts = pathname.split("/").filter(Boolean);
  if (hostname.includes("github.io") && parts.length > 0) {
    return `/${parts[0]}/`; // ex: /myUm/
  }
  return "/";
}

/* ----------------------------
   AUDIO UNLOCK (Mobile)
----------------------------- */
let audioUnlocked = false;
let audioEl = null;

function ensureAudio() {
  if (!audioEl) {
    audioEl = new Audio(`${basePath()}assets/sounds/notify.mp3`);
    audioEl.volume = 0.9;
  }
  return audioEl;
}

export function unlockAudioOnce() {
  if (audioUnlocked) return;

  const unlock = async () => {
    try {
      const a = ensureAudio();
      await a.play();
      a.pause();
      a.currentTime = 0;
      audioUnlocked = true;
    } catch {
      // si bloqué, on retentera au prochain tap
    } finally {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    }
  };

  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

/* ----------------------------
   TOAST VISUEL
----------------------------- */
function toast(msg) {
  let t = document.getElementById("myum_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "myum_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[9999]";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(window.__myumToastTimer);
  window.__myumToastTimer = setTimeout(() => (t.style.opacity = "0"), 1800);
}

function safePlay() {
  try {
    const a = ensureAudio();
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

/* ----------------------------
   INIT NOTIFICATIONS
----------------------------- */
let unsub = null;
const seenUnread = new Map(); // chatId -> last unread

export function initNotifications() {
  const me = getCurrentUser();
  const myId = me?.id;
  if (!myId) return;

  unlockAudioOnce();

  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "array-contains", myId));

  if (unsub) unsub();

  unsub = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((chg) => {
      if (chg.type === "removed") return;

      const d = chg.doc;
      const c = d.data();

      const unread = (c.unreadCount && c.unreadCount[myId]) ? c.unreadCount[myId] : 0;
      const lastSenderId = c.lastSenderId || null;

      const prev = seenUnread.get(d.id);
      seenUnread.set(d.id, unread);

      // Déclenchement uniquement si déjà initialisé + unread augmente
      if (prev !== undefined && unread > prev && lastSenderId && lastSenderId !== myId) {
        toast("Nouveau message 🔔");
        safePlay();
      }
    });
  });
}