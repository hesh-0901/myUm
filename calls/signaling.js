// calls/signaling.js

import { db } from "../mains.js/firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BLOC 1 : CALL ID STABLE
   Rôle :
   - Générer un identifiant unique pour l’appel entre 2 users
   Utilité scientifique :
   - Empêche les doublons d’appel entre les mêmes personnes
============================================================ */
export function buildCallId(a, b) {
  const [x, y] = [a, b].sort();
  return `call_${x}_${y}`;
}

/* ============================================================
   BLOC 2 : DOCUMENT PRINCIPAL D’APPEL
   Rôle :
   - Fournir la référence Firestore centrale
============================================================ */
export function getCallDoc(callId) {
  return doc(db, "calls", callId);
}

/* ============================================================
   BLOC 3 : CRÉATION D’UN APPEL
   Rôle :
   - Initialiser le document principal
============================================================ */
export async function createCall(callId, fromUserId, toUserId, type = "voice") {
  await setDoc(getCallDoc(callId), {
    fromUserId,
    toUserId,
    type,
    status: "ringing", // ringing | accepted | ended
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* ============================================================
   BLOC 4 : METTRE À JOUR LE STATUT
   Rôle :
   - Faire évoluer l’état global de l’appel
============================================================ */
export async function updateCallStatus(callId, status) {
  await updateDoc(getCallDoc(callId), {
    status,
    updatedAt: serverTimestamp()
  });
}

/* ============================================================
   BLOC 5 : LECTURE TEMPS RÉEL DOC APPEL
   Rôle :
   - Écouter les changements d’état de l’appel
============================================================ */
export function listenCall(callId, callback, onError) {
  return onSnapshot(getCallDoc(callId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, onError);
}

/* ============================================================
   BLOC 6 : OFFRE / RÉPONSE SDP
   Rôle :
   - Sauvegarder l’offre et la réponse WebRTC
============================================================ */
export async function saveOffer(callId, offer) {
  await setDoc(doc(db, "calls", callId, "meta", "sdp"), {
    offer,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function saveAnswer(callId, answer) {
  await setDoc(doc(db, "calls", callId, "meta", "sdp"), {
    answer,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function listenSDP(callId, callback, onError) {
  return onSnapshot(doc(db, "calls", callId, "meta", "sdp"), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  }, onError);
}

/* ============================================================
   BLOC 7 : ICE CANDIDATES
   Rôle :
   - Échanger les candidats réseau entre les deux pairs
============================================================ */
export async function addIceCandidate(callId, side, candidate) {
  await addDoc(collection(db, "calls", callId, "iceCandidates", side, "items"), {
    candidate,
    createdAt: serverTimestamp()
  });
}

export function listenIceCandidates(callId, side, callback, onError) {
  return onSnapshot(
    collection(db, "calls", callId, "iceCandidates", side, "items"),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          callback(data.candidate);
        }
      });
    },
    onError
  );
}

/* ============================================================
   BLOC 8 : NETTOYAGE APPEL
   Rôle :
   - Marquer comme terminé
   - Nettoyer SDP + ICE si besoin plus tard
   Note :
   - Ici on marque ended sans tout supprimer brutalement
============================================================ */
export async function endCall(callId) {
  const ref = getCallDoc(callId);
  const snap = await getDoc(ref).catch(() => null);
  if (snap && snap.exists()) {
    await updateDoc(ref, {
      status: "ended",
      updatedAt: serverTimestamp()
    }).catch(() => {});
  }
}

/* ============================================================
   BLOC 9 : ÉCOUTE APPEL ENTRANT GLOBAL
   Rôle :
   - Détecter si quelqu’un m’appelle
   Note :
   - Simplifié : écoute par doc déterministe entre deux users
   - Pour du vrai global scalable, on ajoutera un index d’appels entrants
============================================================ */
export async function cleanupEndedCall(callId) {
  const ref = getCallDoc(callId);
  await deleteDoc(ref).catch(() => {});
  await deleteDoc(doc(db, "calls", callId, "meta", "sdp")).catch(() => {});
}