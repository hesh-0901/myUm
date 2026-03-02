import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let activeRoomId = null;
let countdownInterval = null;

const modal = document.getElementById("radarModal");
const closeBtn = document.getElementById("closeRadar");
const countEl = document.getElementById("radarCount");
const countdownEl = document.getElementById("radarCountdown");

// ============================
// OPEN RADAR
// ============================

export async function openRadar(roomId) {

  activeRoomId = roomId;
  modal.classList.remove("hidden");

  listenAttendances();
  startCountdown();
}

// ============================
// CLOSE RADAR
// ============================

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  clearInterval(countdownInterval);
});

// ============================
// REALTIME COUNT
// ============================

function listenAttendances() {

  const attendanceRef = collection(
    db,
    `presence_rooms/${activeRoomId}/attendances`
  );

  onSnapshot(attendanceRef, snapshot => {
    countEl.innerText = snapshot.size;
  });

}

// ============================
// COUNTDOWN
// ============================

async function startCountdown() {

  const roomSnap = await getDoc(
    doc(db, "presence_rooms", activeRoomId)
  );

  if (!roomSnap.exists()) return;

  const room = roomSnap.data();
  const endTime = room.endTime.toDate();

  countdownInterval = setInterval(() => {

    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      countdownEl.innerText = "Terminé";
      clearInterval(countdownInterval);
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    countdownEl.innerText =
      `${minutes.toString().padStart(2,"0")}:` +
      `${seconds.toString().padStart(2,"0")}`;

  }, 1000);
}
