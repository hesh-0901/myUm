// mains.js/presence.js
import { db } from "./firebase-config.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   PRESENCE MODULE (GLOBAL)
   Utilité:
   - Mettre à jour lastSeen régulièrement (heartbeat)
   - Online = lastSeen récent (fiable même si fermeture brutale)
============================================================ */

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}

const me = getCurrentUser();
const uid = me?.id;

let heartbeatTimer = null;

async function ping() {
  if (!uid) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      online: true,                // indicatif (lastSeen est le vrai signal)
      lastSeen: serverTimestamp()
    });
  } catch {
    // best effort
  }
}

export function initPresence(options = {}) {
  const intervalMs = options.intervalMs ?? 25000;

  ping();

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(ping, intervalMs);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") setOffline();
    else ping();
  });

  window.addEventListener("beforeunload", () => setOffline());
}

export async function setOffline() {
  if (!uid) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      online: false,
      lastSeen: serverTimestamp()
    });
  } catch {
    // best effort
  }
}