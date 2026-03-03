import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const roomInfo = document.getElementById("roomInfo");
const enterRoomBtn = document.getElementById("enterRoomBtn");
const immersiveModal = document.getElementById("immersiveModal");
const liveCount = document.getElementById("liveCount");
const fingerprintBtn = document.getElementById("fingerprintBtn");
const immersiveTimer = document.getElementById("immersiveTimer");

let activeRoomId = null;
let roomData = null;
let longPressTimer = null;
let unsubscribe = null;

// ==========================
// LOAD ACTIVE ROOM
// ==========================

async function loadActiveRoom() {

  const q = query(collection(db, "presenceRooms"), where("status", "==", "active"));
  const snap = await getDocs(q);

  if (snap.empty) {
    roomInfo.innerHTML = `<p class="text-sm text-gray-500">Aucun salon actif.</p>`;
    roomInfo.classList.remove("hidden");
    return;
  }

  const docSnap = snap.docs[0];
  activeRoomId = docSnap.id;
  roomData = docSnap.data();

  roomInfo.innerHTML = `
    <p><strong>Ouvert par :</strong> ${roomData.createdByName}</p>
    <p><strong>Chorale :</strong> ${roomData.chorale}</p>
    <p><strong>Motif :</strong> ${roomData.type}</p>
  `;

  roomInfo.classList.remove("hidden");
  enterRoomBtn.classList.remove("hidden");

  startTimer();
}

loadActiveRoom();

// ==========================
// TIMER
// ==========================

function startTimer() {

  const interval = setInterval(() => {

    const now = new Date();
    const end = roomData.endTime.toDate();
    const diff = end - now;

    if (diff <= 0) {
      immersiveTimer.innerText = "00:00";
      clearInterval(interval);
      return;
    }

    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    immersiveTimer.innerText =
      `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  }, 1000);
}

// ==========================
// ENTER ROOM
// ==========================

enterRoomBtn.addEventListener("click", () => {

  immersiveModal.classList.remove("hidden");

  const attendanceRef = collection(db, "presenceRooms", activeRoomId, "attendances");

  unsubscribe = onSnapshot(attendanceRef, snap => {
    liveCount.innerText = snap.size;
  });

});

// ==========================
// BIOMETRIC SCAN SIGNATURE
// ==========================

const scanProgress = document.getElementById("scanProgress");
const backBtn = document.getElementById("backBtn");

let scanTimeout = null;
let vibrationInterval = null;

// Retour
if (backBtn) {
  backBtn.addEventListener("click", () => {
    immersiveModal.classList.add("hidden");
  });
}

// Support mobile + desktop
function startScan() {

  scanProgress.classList.add("scanning");

  let vibrationCount = 0;

  vibrationInterval = setInterval(() => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    vibrationCount++;
  }, 1000);

  scanTimeout = setTimeout(async () => {

    clearInterval(vibrationInterval);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    playBeep();

    await signPresence();

    scanProgress.classList.remove("scanning");

  }, 3000); // 3 secondes
}

function cancelScan() {
  clearTimeout(scanTimeout);
  clearInterval(vibrationInterval);
  scanProgress.classList.remove("scanning");
}

fingerprintBtn.addEventListener("mousedown", startScan);
fingerprintBtn.addEventListener("touchstart", startScan);

fingerprintBtn.addEventListener("mouseup", cancelScan);
fingerprintBtn.addEventListener("mouseleave", cancelScan);
fingerprintBtn.addEventListener("touchend", cancelScan);


// ==========================
// SIGNATURE FUNCTION
// ==========================

async function signPresence() {

  const storedUser = JSON.parse(localStorage.getItem("myum_user"));
  if (!storedUser) return;

  const attendanceRef = doc(
    db,
    "presenceRooms",
    activeRoomId,
    "attendances",
    storedUser.id
  );

  const existing = await getDoc(attendanceRef);
  if (existing.exists()) return;

  await setDoc(attendanceRef, {
    userId: storedUser.id,
    username: storedUser.username,
    fullName: `${storedUser.firstName} ${storedUser.lastName}`,
    genre: storedUser.genre === "Homme" ? "M" : "F",
    statut: "P",
    method: "auto",
    timestamp: serverTimestamp()
  });

  fingerprintBtn.innerHTML =
    `<i class="bi bi-check-circle text-5xl text-green-400"></i>`;
}


// ==========================
// BEEP SOUND
// ==========================

function playBeep() {

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.type = "sine";
  oscillator.frequency.value = 800;

  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.5
  );

}
