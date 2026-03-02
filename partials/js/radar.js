import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let countdownInterval = null;
let attendanceUnsubscribe = null;

export async function openRadar(roomId) {

  const modal = document.getElementById("radarModal");
  const countdownEl = document.getElementById("radarCountdown");
  const counterEl = document.getElementById("radarCount");
  const scanBtn = document.getElementById("radarScanBtn");

  modal.classList.remove("hidden");

  // ==============================
  // LOAD ROOM DATA
  // ==============================

  const roomRef = doc(db, "presenceRooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return;

  const roomData = roomSnap.data();

  // ==============================
  // LIVE COUNT
  // ==============================

  const attendanceRef = collection(db, "presenceRooms", roomId, "attendances");

  attendanceUnsubscribe = onSnapshot(attendanceRef, (snapshot) => {
    counterEl.innerText = snapshot.size;
  });

  // ==============================
  // COUNTDOWN
  // ==============================

  function startCountdown() {

    countdownInterval = setInterval(() => {

      const now = new Date();
      const end = roomData.endTime.toDate();

      const diff = end - now;

      if (diff <= 0) {
        clearInterval(countdownInterval);
        countdownEl.innerText = "00:00";
        scanBtn.disabled = true;
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      countdownEl.innerText =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    }, 1000);
  }

  startCountdown();

  // ==============================
  // SCAN ACTION
  // ==============================

  scanBtn.onclick = async () => {

    if (roomData.status !== "active") {
      alert("Salon inactif.");
      return;
    }

    const now = new Date();
    const start = roomData.startTime.toDate();
    const end = roomData.endTime.toDate();

    if (now < start || now > end) {
      alert("Hors plage horaire.");
      return;
    }

    // ==============================
    // GPS CHECK 7 METERS
    // ==============================

    navigator.geolocation.getCurrentPosition(async (position) => {

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const roomLat = roomData.latitude;
      const roomLng = roomData.longitude;

      const distance = getDistance(userLat, userLng, roomLat, roomLng);

      if (distance > 7) {
        alert("Vous êtes hors rayon (7m).");
        return;
      }

      // ==============================
      // USER DATA
      // ==============================

      const storedUser = JSON.parse(localStorage.getItem("myum_user"));
      if (!storedUser) return;

      const userId = storedUser.id;

      const userSnap = await getDoc(doc(db, "users", userId));
      const userData = userSnap.data();

      const attendanceDoc = doc(db,
        "presenceRooms",
        roomId,
        "attendances",
        userId
      );

      const existing = await getDoc(attendanceDoc);

      if (existing.exists()) {
        alert("Déjà signé.");
        return;
      }

      await addDoc(
        collection(db, "presenceRooms", roomId, "attendances"),
        {
          userId,
          username: userData.username,
          fullName: `${userData.firstName} ${userData.lastName}`,
          genre: userData.genre === "Homme" ? "M" : "F",
          statut: "P",
          method: "auto",
          timestamp: serverTimestamp()
        }
      );

    });

  };

}

// ==============================
// DISTANCE CALCULATION
// ==============================

function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371000;
  const toRad = (v) => v * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ==============================
// CLOSE MODAL CLEANUP
// ==============================

export function closeRadar() {

  const modal = document.getElementById("radarModal");
  modal.classList.add("hidden");

  if (countdownInterval) clearInterval(countdownInterval);
  if (attendanceUnsubscribe) attendanceUnsubscribe();
}
