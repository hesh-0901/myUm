// chat/js/call-voice.js

import { db } from "../../mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  buildCallId,
  createCall,
  updateCallStatus,
  saveOffer,
  saveAnswer,
  listenCall,
  listenSDP,
  addIceCandidate,
  listenIceCandidates,
  endCall
} from "../../calls/signaling.js";

import {
  createPeerConnection,
  getLocalAudioStream,
  attachLocalStream,
  createOffer,
  createAnswer,
  setRemoteDescriptionSafe,
  createIceQueue,
  addRemoteIceCandidateBuffered,
  flushIceQueue,
  closeCallResources
} from "../../calls/webrtc-core.js";

/* ============================================================
   BLOC 1 : SESSION UTILISATEUR
   Rôle :
   - Récupérer l’utilisateur connecté
   - Bloquer si aucune session valide
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
  alert("Session invalide.");
  window.location.href = "../users/login.html";
}

/* ============================================================
   BLOC 2 : PARAMÈTRES URL
   Rôle :
   - uid : correspondant
   - mode : caller ou callee
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");
const mode = params.get("mode") || "caller";

if (!friendId) {
  alert("Aucun destinataire d'appel.");
  window.location.href = "index.html";
}

/* ============================================================
   BLOC 3 : DOM
   Rôle :
   - Centraliser tous les éléments HTML
============================================================ */
const backRoomBtn = document.getElementById("backRoomBtn");
const callAvatar = document.getElementById("callAvatar");
const callName = document.getElementById("callName");
const callStatus = document.getElementById("callStatus");

const muteBtn = document.getElementById("muteBtn");
const acceptBtn = document.getElementById("acceptBtn");
const endBtn = document.getElementById("endBtn");

const remoteAudio = document.getElementById("remoteAudio");

/* ----------------------------
   DEBUG DOM
----------------------------- */
const dbgSignaling = document.getElementById("dbgSignaling");
const dbgIce = document.getElementById("dbgIce");
const dbgConn = document.getElementById("dbgConn");
const dbgOffer = document.getElementById("dbgOffer");
const dbgAnswer = document.getElementById("dbgAnswer");
const dbgIceCaller = document.getElementById("dbgIceCaller");
const dbgIceCallee = document.getElementById("dbgIceCallee");

/* ============================================================
   BLOC 4 : NAVIGATION
   Rôle :
   - Retour vers la room liée au correspondant
============================================================ */
backRoomBtn?.addEventListener("click", () => {
  window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
});

/* ============================================================
   BLOC 5 : ÉTAT LOCAL
   Rôle :
   - Variables runtime de l’appel
============================================================ */
const callId = buildCallId(myId, friendId);

let pc = null;
let localStream = null;
let remoteStream = null;

let unlistenCall = null;
let unlistenSDP = null;
let unlistenCallerIce = null;
let unlistenCalleeIce = null;

let isMuted = false;
let hasCreatedAnswer = false;

// Queue ICE : évite de perdre les candidats reçus trop tôt
const pendingIceQueue = createIceQueue();

/* ----------------------------
   DEBUG COUNTERS
----------------------------- */
let offerSeen = 0;
let answerSeen = 0;
let iceCallerCount = 0;
let iceCalleeCount = 0;

/* ============================================================
   BLOC DEBUG : HELPERS
   Rôle :
   - Mettre à jour le panneau de debug visible
============================================================ */
function setDebugValue(el, value) {
  if (!el) return;
  el.textContent = String(value);
}

function refreshDebugPanel() {
  setDebugValue(dbgOffer, offerSeen);
  setDebugValue(dbgAnswer, answerSeen);
  setDebugValue(dbgIceCaller, iceCallerCount);
  setDebugValue(dbgIceCallee, iceCalleeCount);

  if (pc) {
    setDebugValue(dbgSignaling, pc.signalingState);
    setDebugValue(dbgIce, pc.iceConnectionState);
    setDebugValue(dbgConn, pc.connectionState);
  }
}

/* ============================================================
   BLOC 6 : INITIALISATION
   Rôle :
   - Orchestrer le démarrage de l’appel
============================================================ */
init().catch((error) => {
  console.error("Erreur init appel vocal :", error);
  alert("Impossible de démarrer l'appel : " + (error?.message || error));
  window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
});

async function init() {
  await loadFriendProfile();
  await setupMediaAndPeer();
  bindButtons();
  subscribeRealtime();

  if (mode === "caller") {
    await startOutgoingCall();
  } else {
    await prepareIncomingCall();
  }
}

/* ============================================================
   BLOC 7 : CHARGER LE PROFIL DU CORRESPONDANT
   Rôle :
   - Afficher avatar + nom
============================================================ */
async function loadFriendProfile() {
  const snap = await getDoc(doc(db, "users", friendId)).catch(() => null);
  const u = snap && snap.exists() ? snap.data() : {};

  const firstName = u.firstName || "";
  const lastName = u.lastName || "";
  const username = u.username || "";
  const photoURL = u.photoURL || "";

  const displayName =
    `${firstName} ${lastName}`.trim() ||
    username ||
    friendId;

  callName.textContent = displayName;

  const initials =
    `${(firstName?.[0] || "")}${(lastName?.[0] || "")}`.toUpperCase() ||
    (username?.[0] || "").toUpperCase() ||
    "—";

  renderAvatar(photoURL, initials);
}

function renderAvatar(photoURL, initials) {
  callAvatar.innerHTML = "";
  callAvatar.textContent = initials;

  if (!photoURL) return;

  const img = new Image();
  img.src = photoURL;
  img.className = "w-full h-full object-cover";

  img.onerror = () => {
    callAvatar.innerHTML = "";
    callAvatar.textContent = initials;
  };

  img.onload = () => {
    callAvatar.innerHTML = "";
    callAvatar.appendChild(img);
  };
}

/* ============================================================
   BLOC 8 : SETUP WEBRTC + MICRO
   Rôle :
   - Initialiser le micro local
   - Créer le peer connection
   - Brancher le flux audio distant
============================================================ */
async function setupMediaAndPeer() {
  localStream = await getLocalAudioStream();

  pc = createPeerConnection();
  attachLocalStream(pc, localStream);

  remoteStream = new MediaStream();
  remoteAudio.srcObject = remoteStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  pc.onicecandidate = async (event) => {
    if (!event.candidate) return;

    const side = mode === "caller" ? "caller" : "callee";
    await addIceCandidate(callId, side, event.candidate.toJSON()).catch(console.error);
  };

  /* ------------------------------------------------------------
     États WebRTC détaillés
  ------------------------------------------------------------ */
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    console.log("connectionState =", state);

    if (state === "new") callStatus.textContent = "Initialisation...";
    else if (state === "connecting") callStatus.textContent = "Connexion...";
    else if (state === "connected") callStatus.textContent = "Connecté";
    else if (state === "disconnected") callStatus.textContent = "Déconnecté";
    else if (state === "failed") callStatus.textContent = "Échec connexion";
    else if (state === "closed") callStatus.textContent = "Appel terminé";

    refreshDebugPanel();
  };

  pc.oniceconnectionstatechange = () => {
    console.log("iceConnectionState =", pc.iceConnectionState);
    refreshDebugPanel();
  };

  pc.onsignalingstatechange = () => {
    console.log("signalingState =", pc.signalingState);
    refreshDebugPanel();
  };

  refreshDebugPanel();
}

/* ============================================================
   BLOC 9 : ACTIONS UI
   Rôle :
   - mute / accepter / terminer
============================================================ */
function bindButtons() {
  muteBtn?.addEventListener("click", toggleMute);

  acceptBtn?.addEventListener("click", async () => {
    acceptBtn.classList.add("hidden");
    await acceptIncomingCall();
  });

  endBtn?.addEventListener("click", async () => {
    await terminateCallAndExit();
  });
}

function toggleMute() {
  if (!localStream) return;

  isMuted = !isMuted;

  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !isMuted;
  });

  muteBtn.innerHTML = isMuted
    ? `<i class="bi bi-mic-mute-fill text-lg"></i>`
    : `<i class="bi bi-mic-fill text-lg"></i>`;
}

/* ============================================================
   BLOC 10 : APPEL SORTANT
   Rôle :
   - Créer le doc d’appel
   - Générer et sauver l’offre
============================================================ */
async function startOutgoingCall() {
  callStatus.textContent = "Appel en cours...";

  await createCall(callId, myId, friendId, "voice");

  const offer = await createOffer(pc);
  await saveOffer(callId, offer);

  offerSeen = 1;
  refreshDebugPanel();

  callStatus.textContent = "Sonnerie...";
}

/* ============================================================
   BLOC 11 : APPEL ENTRANT / CALLEE
   Rôle :
   - Préparer la réponse côté receveur
============================================================ */
async function prepareIncomingCall() {
  callStatus.textContent = "Connexion...";
  acceptBtn.classList.add("hidden");

  if (!hasCreatedAnswer) {
    await acceptIncomingCall();
  }
}

async function acceptIncomingCall() {
  callStatus.textContent = "Connexion...";

  const sdpSnap = await getDoc(doc(db, "calls", callId, "meta", "sdp")).catch(() => null);
  const sdpData = sdpSnap && sdpSnap.exists() ? sdpSnap.data() : null;

  if (!sdpData?.offer) {
    callStatus.textContent = "Offre introuvable";
    return;
  }

  offerSeen = sdpData?.offer ? 1 : 0;
  refreshDebugPanel();

  // Poser l’offre distante
  await setRemoteDescriptionSafe(pc, sdpData.offer);

  // Flush des ICE qui auraient été reçues avant
  await flushIceQueue(pc, pendingIceQueue);

  const answer = await createAnswer(pc);
  await saveAnswer(callId, answer);

  answerSeen = 1;
  refreshDebugPanel();

  await updateCallStatus(callId, "accepted");

  hasCreatedAnswer = true;
}

/* ============================================================
   BLOC 12 : LISTENERS REALTIME
   Rôle :
   - Écouter état appel
   - Écouter SDP
   - Écouter ICE caller/callee
============================================================ */
function subscribeRealtime() {
  unlistenCall = listenCall(callId, async (callData) => {
    if (!callData) return;

    if (callData.status === "ended") {
      callStatus.textContent = "Appel terminé";
      setTimeout(() => {
        cleanupResources();
        window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
      }, 800);
      return;
    }

    if (callData.status === "accepted" && mode === "caller") {
      callStatus.textContent = "Connexion...";
    }
  }, console.error);

  unlistenSDP = listenSDP(callId, async (sdpData) => {
    if (!sdpData) return;

    if (sdpData.offer) {
      offerSeen = 1;
    }

    if (sdpData.answer) {
      answerSeen = 1;
    }

    refreshDebugPanel();

    // caller reçoit la réponse
    if (mode === "caller" && sdpData.answer) {
      const applied = await setRemoteDescriptionSafe(pc, sdpData.answer);
      if (applied) {
        await flushIceQueue(pc, pendingIceQueue);
      }
    }
  }, console.error);

  // caller écoute les ICE du callee
  unlistenCalleeIce = listenIceCandidates(callId, "callee", async (candidate) => {
    iceCalleeCount += 1;
    refreshDebugPanel();
    await addRemoteIceCandidateBuffered(pc, pendingIceQueue, candidate);
  }, console.error);

  // callee écoute les ICE du caller
  unlistenCallerIce = listenIceCandidates(callId, "caller", async (candidate) => {
    iceCallerCount += 1;
    refreshDebugPanel();
    await addRemoteIceCandidateBuffered(pc, pendingIceQueue, candidate);
  }, console.error);
}

/* ============================================================
   BLOC 13 : TERMINER L’APPEL
   Rôle :
   - Marquer ended
   - Revenir vers la room
============================================================ */
async function terminateCallAndExit() {
  try {
    await endCall(callId);
  } catch (error) {
    console.error("Erreur endCall:", error);
  }

  cleanupResources();
  window.location.href = `room.html?uid=${encodeURIComponent(friendId)}`;
}

/* ============================================================
   BLOC 14 : CLEANUP
   Rôle :
   - Couper listeners
   - Fermer micro et peer connection
============================================================ */
function cleanupResources() {
  try { unlistenCall?.(); } catch {}
  try { unlistenSDP?.(); } catch {}
  try { unlistenCallerIce?.(); } catch {}
  try { unlistenCalleeIce?.(); } catch {}

  closeCallResources(pc, localStream);

  pc = null;
  localStream = null;
  remoteStream = null;
}