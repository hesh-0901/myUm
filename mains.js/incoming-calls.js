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
   BLOC 1 : SESSION UTILISATEUR
   Rôle :
   - Identifier l'utilisateur connecté
   - Savoir si un appel entrant me concerne
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
   - Compatibilité GitHub Pages et racine locale
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
   BLOC 3 : AUDIO SONNERIE
   Rôle :
   - Jouer une sonnerie locale pour appel entrant
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
   BLOC 4 : ÉTAT LOCAL
   Rôle :
   - Éviter d’ouvrir 2 fois la même popup
============================================================ */
let unsubscribeIncomingCalls = null;
let activeIncomingCallId = null;

/* ============================================================
   BLOC 5 : INIT LISTENER GLOBAL
   Rôle :
   - Observer les appels où je suis destinataire
   - Déclencher popup appel entrant
============================================================ */
export function initIncomingCalls() {
  const me = getCurrentUser();
  const myId = me?.id;
  if (!myId) return;

  const callsRef = collection(db, "calls");

  const q = query(
    callsRef,
    where("toUserId", "==", myId),
    where("status", "==", "ringing")
  );

  if (unsubscribeIncomingCalls) unsubscribeIncomingCalls();

  unsubscribeIncomingCalls = onSnapshot(q, async (snap) => {
    if (snap.empty) {
      stopRingtone();
      removeIncomingCallModal();
      activeIncomingCallId = null;
      return;
    }

    // On prend le premier appel entrant actif
    const callDoc = snap.docs[0];
    const callData = callDoc.data();
    const callId = callDoc.id;

    // si c'est déjà affiché, on ne recrée pas
    if (activeIncomingCallId === callId) return;

    activeIncomingCallId = callId;

    const callerId = callData.fromUserId;
    const type = callData.type || "voice";

    const callerProfile = await getUserProfile(callerId);

    showIncomingCallModal({
      callId,
      callerId,
      type,
      callerProfile
    });

    startRingtone();

  }, (error) => {
    console.error("Erreur incoming calls:", error);
  });
}

/* ============================================================
   BLOC 6 : LIRE PROFIL APPELANT
   Rôle :
   - Afficher avatar + nom dans la popup entrante
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
   BLOC 7 : MODAL APPEL ENTRANT
   Rôle :
   - Afficher une UI flottante globale
   - Accepter / refuser
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
      console.error("Erreur accept call status:", error);
    }

    // redirection vers l'écran d'appel entrant
    if (type === "video") {
      window.location.href = `${getBasePath()}chat/call-video.html?uid=${encodeURIComponent(callerId)}&mode=callee`;
    } else {
      window.location.href = `${getBasePath()}chat/call-voice.html?uid=${encodeURIComponent(callerId)}&mode=callee`;
    }
  });
}

/* ============================================================
   BLOC 8 : SUPPRESSION MODAL
============================================================ */
function removeIncomingCallModal() {
  const existing = document.getElementById("incomingCallOverlay");
  if (existing) existing.remove();
}

/* ============================================================
   BLOC 9 : HELPERS HTML
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