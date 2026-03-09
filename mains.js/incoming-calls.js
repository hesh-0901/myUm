// mains.js/incoming-calls.js

import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  updateCallStatus,
  endCall
} from "../calls/signaling.js";

/* ============================================================
   BLOC 1 : SESSION
   Rôle :
   - Identifier l'utilisateur connecté
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
   BLOC 3 : SONNERIE
============================================================ */
let ringtoneAudio = null;

function getRingtone() {
  if (!ringtoneAudio) {
    ringtoneAudio = new Audio(`${getBasePath()}assets/sounds/notify.mp3`);
    ringtoneAudio.loop = true;
    ringtoneAudio.volume = 1;
  }
  return ringtoneAudio;
}

function startRingtone() {
  try {
    const a = getRingtone();
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

function stopRingtone() {
  try {
    const a = getRingtone();
    a.pause();
    a.currentTime = 0;
  } catch {}
}

/* ============================================================
   BLOC 4 : TOAST DEBUG
   Rôle :
   - Afficher des infos visibles sans console
============================================================ */
function showDebugToast(message) {
  let t = document.getElementById("incoming_call_debug_toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "incoming_call_debug_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-2 rounded-xl shadow-lg opacity-0 transition z-[10001]";
    document.body.appendChild(t);
  }

  t.textContent = message;
  t.style.opacity = "1";

  clearTimeout(window.__incomingCallDebugTimer);
  window.__incomingCallDebugTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1800);
}

/* ============================================================
   BLOC 5 : ÉTAT LOCAL
============================================================ */
let unsubscribeIncomingCalls = null;
let activeIncomingCallId = null;

/* ============================================================
   BLOC 6 : INIT LISTENER GLOBAL
   Rôle :
   - Écouter tous les appels qui me ciblent
   - Filtrer status côté JS pour éviter un query trop fragile
============================================================ */
export function initIncomingCalls() {
  const me = getCurrentUser();
  const myId = me?.id;
  if (!myId) return;

  const callsRef = collection(db, "calls");

  // ✅ requête plus simple = moins de risque d’index / échec silencieux
  const q = query(
    callsRef,
    where("toUserId", "==", myId)
  );

  if (unsubscribeIncomingCalls) unsubscribeIncomingCalls();

  unsubscribeIncomingCalls = onSnapshot(q, async (snap) => {
    if (snap.empty) {
      stopRingtone();
      removeIncomingCallModal();
      activeIncomingCallId = null;
      return;
    }

    // On cherche un appel ringing dans les résultats
    const ringingDoc = snap.docs.find((d) => {
      const data = d.data();
      return data.status === "ringing";
    });

    if (!ringingDoc) {
      stopRingtone();
      removeIncomingCallModal();
      activeIncomingCallId = null;
      return;
    }

    const callId = ringingDoc.id;
    const callData = ringingDoc.data();

    if (activeIncomingCallId === callId) return;
    activeIncomingCallId = callId;

    const callerId = callData.fromUserId;
    const type = callData.type || "voice";

    const callerProfile = await getUserProfile(callerId);

    showDebugToast("Appel entrant détecté 📞");
    showIncomingCallModal({
      callId,
      callerId,
      type,
      callerProfile
    });

    startRingtone();

  }, (error) => {
    console.error("Erreur incoming calls:", error);
    showDebugToast("Erreur appels entrants ❌");
  });
}

/* ============================================================
   BLOC 7 : PROFIL APPELANT
============================================================ */
async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid)).catch(() => null);
  const u = snap && snap.exists() ? snap.data() : {};

  const firstName = u.firstName || "";
  const lastName = u.lastName || "";
  const username = u.username || "";
  const photoURL = u.photoURL || "";

  const displayName =
    `${firstName} ${lastName}`.trim() ||
    username ||
    uid;

  const initials =
    `${(firstName?.[0] || "")}${(lastName?.[0] || "")}`.toUpperCase() ||
    (username?.[0] || "").toUpperCase() ||
    "—";

  return {
    uid,
    displayName,
    photoURL,
    initials
  };
}

/* ============================================================
   BLOC 8 : MODAL APPEL ENTRANT
============================================================ */
function showIncomingCallModal({ callId, callerId, type, callerProfile }) {
  removeIncomingCallModal();

  const overlay = document.createElement("div");
  overlay.id = "incomingCallOverlay";
  overlay.className =
    "fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000] flex items-center justify-center p-4";

  overlay.innerHTML = `
    <div class="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
      <div class="mx-auto w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700">
        ${
          callerProfile.photoURL
            ? `<img src="${escapeAttr(callerProfile.photoURL)}" class="w-full h-full object-cover" onerror="this.remove();">`
            : escapeHtml(callerProfile.initials)
        }
      </div>

      <div class="mt-4 text-lg font-semibold">${escapeHtml(callerProfile.displayName)}</div>
      <div class="mt-1 text-sm text-gray-500">
        ${type === "video" ? "Appel vidéo entrant" : "Appel vocal entrant"}
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <button id="rejectIncomingCallBtn"
          class="h-12 rounded-2xl bg-red-500 text-white font-semibold active:scale-95 transition">
          Refuser
        </button>

        <button id="acceptIncomingCallBtn"
          class="h-12 rounded-2xl bg-green-600 text-white font-semibold active:scale-95 transition">
          Accepter
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const rejectBtn = document.getElementById("rejectIncomingCallBtn");
  const acceptBtn = document.getElementById("acceptIncomingCallBtn");

  rejectBtn?.addEventListener("click", async () => {
    stopRingtone();
    removeIncomingCallModal();
    activeIncomingCallId = null;

    try {
      await endCall(callId);
    } catch (error) {
      console.error("Erreur refus appel:", error);
    }
  });

  acceptBtn?.addEventListener("click", async () => {
    stopRingtone();
    removeIncomingCallModal();

    try {
      await updateCallStatus(callId, "accepted");
    } catch (error) {
      console.error("Erreur accept status:", error);
    }

    if (type === "video") {
      window.location.href = `${getBasePath()}chat/call-video.html?uid=${encodeURIComponent(callerId)}&mode=callee`;
    } else {
      window.location.href = `${getBasePath()}chat/call-voice.html?uid=${encodeURIComponent(callerId)}&mode=callee`;
    }
  });
}

/* ============================================================
   BLOC 9 : REMOVE MODAL
============================================================ */
function removeIncomingCallModal() {
  const existing = document.getElementById("incomingCallOverlay");
  if (existing) existing.remove();
}

/* ============================================================
   BLOC 10 : HELPERS HTML
============================================================ */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/</g, "&lt;");
}