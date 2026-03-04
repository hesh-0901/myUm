// mains.js/presence.js
import { db } from "./firebase-config.js";
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("myum_user")); }
  catch { return null; }
}

const me = getCurrentUser();
const uid = me?.id;

export async function setOnline() {
  if (!uid) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      online: true,
      lastSeen: serverTimestamp()
    });
  } catch {}
}

export async function setOffline() {
  if (!uid) return;
  try {
    await updateDoc(doc(db, "users", uid), {
      online: false,
      lastSeen: serverTimestamp()
    });
  } catch {}
}

// auto hook
export function initPresence() {
  setOnline();

  // quand l’utilisateur ferme / change page
  window.addEventListener("beforeunload", () => {
    // best-effort
    setOffline();
  });

  // fallback mobile
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") setOffline();
    else setOnline();
  });
}