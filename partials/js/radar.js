import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let countdownInterval = null;
let attendanceUnsubscribe = null;
let roomUnsubscribe = null;

export async function openRadar(roomId) {

  const modal = document.getElementById("radarModal");
  const countdownEl = document.getElementById("radarCountdown");
  const counterEl = document.getElementById("radarCount");
  const scanBtn = document.getElementById("radarScanBtn");
  const backBtn = document.getElementById("radarBackBtn");

  if (backBtn) {
  backBtn.onclick = () => {
    window.location.href = "/myUm/admin/open-room.html";
  };
}

  if (!modal || !countdownEl || !counterEl || !scanBtn) return;

  modal.classList.remove("hidden");

  const roomRef = doc(db, "presenceRooms", roomId);

// ==============================
// LISTENER SALON (TEMPS RÉEL)
// ==============================

roomUnsubscribe = onSnapshot(roomRef, (snapshot) => {

  const data = snapshot.data();
  if (!data) return;

  // si le salon est fermé
  if (data.status === "closed") {

    closeRadar();

    window.location.href = "/myUm/admin/open-room.html";

  }

});


// ==============================
// RÉCUPÉRATION DONNÉES SALON
// ==============================

const roomSnap = await getDoc(roomRef);

if (!roomSnap.exists()) return;

const roomData = roomSnap.data();

// sécurité si salon déjà fermé
if (roomData.status !== "active") {

  closeRadar();
  window.location.href = "/myUm/admin/open-room.html";

  return;
}

  // ==============================
  // LIVE COUNT
  // ==============================

  const attendanceRef = collection(db, "presenceRooms", roomId, "attendances");

  attendanceUnsubscribe = onSnapshot(attendanceRef, (snapshot) => {
    counterEl.innerText = snapshot.size;
  });

  // ==============================
  // COUNTDOWN + AUTO CLOSE
  // ==============================

  function startCountdown() {

    countdownInterval = setInterval(async () => {

      const now = new Date();
      const end = roomData.endTime.toDate();
      const diff = end - now;

        if (diff <= 0) {
        
          clearInterval(countdownInterval);
        
          await updateDoc(roomRef, {
            status: "closed"
          });
        
          countdownEl.innerText = "00:00";
          scanBtn.disabled = true;
        
          closeRadar();
        
          // 🔥 retour automatique vers open-room
          setTimeout(() => {
            window.location.href = "/myUm/admin/open-room.html";
          }, 800);
        
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

    if (!roomData.latitude || !roomData.longitude) {
      alert("Coordonnées GPS du salon manquantes.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {

        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const distance = getDistance(
          userLat,
          userLng,
          roomData.latitude,
          roomData.longitude
        );

          const RADAR_RADIUS = 250; // rayon en mètres
          
          if (distance > RADAR_RADIUS) {
            alert(`Vous êtes hors rayon (${RADAR_RADIUS}m).`);
            return;
          }

        const storedUser = JSON.parse(localStorage.getItem("myum_user"));
        if (!storedUser) return;

        const userId = storedUser.id;

        const userSnap = await getDoc(doc(db, "users", userId));
        if (!userSnap.exists()) return;

        const userData = userSnap.data();

        const attendanceRef = doc(
          db,
          "presenceRooms",
          roomId,
          "attendances",
          userId
        );

        const existing = await getDoc(attendanceRef);

        if (existing.exists()) {
          alert("Déjà signé.");
          return;
        }

        // ✅ CORRECTION STRUCTURE OFFICIELLE
        await setDoc(attendanceRef, {
          userId,
          username: userData.username,
          fullName: `${userData.firstName} ${userData.lastName}`,
          genre: userData.genre === "Homme" ? "M" : "F",
          statut: "P",
          method: "auto",
          timestamp: serverTimestamp()
        });

      },
      () => {
        alert("Géolocalisation refusée.");
      }
    );

  };
}


// ==============================
// DISTANCE
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
  if (!modal) return;

  modal.classList.add("hidden");

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (attendanceUnsubscribe) {
    attendanceUnsubscribe();
    attendanceUnsubscribe = null;
  }

  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }

}
