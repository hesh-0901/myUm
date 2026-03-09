// calls/webrtc-core.js

/* ============================================================
   BLOC 1 : CONFIGURATION STUN
   Rôle :
   - Fournir une connectivité WebRTC minimale
   Utilité scientifique :
   - STUN aide les pairs à découvrir leur adresse réseau publique
============================================================ */
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

/* ============================================================
   BLOC 2 : CRÉATION PEER CONNECTION
   Rôle :
   - Centraliser la création de RTCPeerConnection
============================================================ */
export function createPeerConnection() {
  return new RTCPeerConnection(rtcConfig);
}

/* ============================================================
   BLOC 3 : MICRO LOCAL
   Rôle :
   - Récupérer le flux audio du micro
============================================================ */
export async function getLocalAudioStream() {
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
}

/* ============================================================
   BLOC 4 : AJOUT DU FLUX LOCAL
   Rôle :
   - Injecter les pistes micro dans le peer connection
============================================================ */
export function attachLocalStream(pc, stream) {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

/* ============================================================
   BLOC 5 : CRÉATION OFFRE
============================================================ */
export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

/* ============================================================
   BLOC 6 : CRÉATION RÉPONSE
============================================================ */
export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

/* ============================================================
   BLOC 7 : APPLICATION DESCRIPTION DISTANTE
============================================================ */
export async function setRemoteDescriptionSafe(pc, sdp) {
  if (!sdp) return;
  if (pc.currentRemoteDescription) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

/* ============================================================
   BLOC 8 : AJOUT ICE DISTANT
============================================================ */
export async function addRemoteIceCandidate(pc, candidate) {
  if (!candidate) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error("Erreur addIceCandidate:", err);
  }
}

/* ============================================================
   BLOC 9 : FERMETURE PROPRE
============================================================ */
export function closeCallResources(pc, localStream) {
  try {
    localStream?.getTracks()?.forEach((track) => track.stop());
  } catch {}

  try {
    pc?.close();
  } catch {}
}