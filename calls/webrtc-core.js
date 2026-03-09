// calls/webrtc-core.js

/* ============================================================
   BLOC 1 : CONFIGURATION ICE
   Rôle :
   - STUN minimum pour WebRTC
   Note :
   - plus tard, pour une vraie fiabilité mobile, il faudra un TURN
============================================================ */
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

/* ============================================================
   BLOC 2 : PEER CONNECTION
============================================================ */
export function createPeerConnection() {
  return new RTCPeerConnection(rtcConfig);
}

/* ============================================================
   BLOC 3 : MICRO LOCAL
============================================================ */
export async function getLocalAudioStream() {
  return await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
  });
}

/* ============================================================
   BLOC 4 : ATTACH LOCAL STREAM
============================================================ */
export function attachLocalStream(pc, stream) {
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });
}

/* ============================================================
   BLOC 5 : OFFER / ANSWER
============================================================ */
export async function createOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

/* ============================================================
   BLOC 6 : REMOTE DESCRIPTION
   Rôle :
   - Poser la description distante une seule fois
============================================================ */
export async function setRemoteDescriptionSafe(pc, sdp) {
  if (!sdp) return false;
  if (pc.currentRemoteDescription) return true;

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  return true;
}

/* ============================================================
   BLOC 7 : ICE QUEUE
   Rôle :
   - Stocker les candidats reçus avant la remote description
   Utilité scientifique :
   - Empêche la perte des candidates si elles arrivent trop tôt
============================================================ */
export function createIceQueue() {
  return [];
}

export async function addRemoteIceCandidateBuffered(pc, queue, candidate) {
  if (!candidate) return;

  // Si la remote description n'est pas encore prête, on stocke
  if (!pc.remoteDescription) {
    queue.push(candidate);
    return;
  }

  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error("Erreur addIceCandidate immédiat :", err);
  }
}

export async function flushIceQueue(pc, queue) {
  if (!pc.remoteDescription || !queue.length) return;

  while (queue.length > 0) {
    const candidate = queue.shift();
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Erreur flushIceQueue :", err);
    }
  }
}

/* ============================================================
   BLOC 8 : FERMETURE
============================================================ */
export function closeCallResources(pc, localStream) {
  try {
    localStream?.getTracks()?.forEach((track) => track.stop());
  } catch {}

  try {
    pc?.close();
  } catch {}
}