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
// LONG PRESS SIGNATURE
// ==========================

fingerprintBtn.addEventListener("mousedown", () => {

  longPressTimer = setTimeout(async () => {

    const confirmSign = confirm("Confirmer votre présence ?");
    if (!confirmSign) return;

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
    if (existing.exists()) {
      alert("Déjà signé.");
      return;
    }

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
      `<i class="bi bi-check-circle text-4xl text-green-400"></i>`;

  }, 800);

});

fingerprintBtn.addEventListener("mouseup", () => clearTimeout(longPressTimer));
fingerprintBtn.addEventListener("mouseleave", () => clearTimeout(longPressTimer));
