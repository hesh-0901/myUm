import { db } from "/myUm/mains.js/firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { openRadar } from "/myUm/partials/js/radar.js";


const openRoomBtn = document.getElementById("openRoomBtn");
const launchRadarBtn = document.getElementById("launchRadarBtn");
const forceStopBtn = document.getElementById("forceStopBtn");
const activeRoomStatus = document.getElementById("activeRoomStatus");

let activeRoomId = null;
let selectedMode = null;

// ===============================
// les boutons Heures fixe
// ===============================
const modeHoursBtn = document.getElementById("modeHours");
const modeTimerBtn = document.getElementById("modeTimer");

const hoursContainer = document.getElementById("hoursContainer");
const timerContainer = document.getElementById("timerContainer");

modeHoursBtn.addEventListener("click", () => {

  selectedMode = "hours";

  hoursContainer.classList.remove("hidden");
  timerContainer.classList.add("hidden");

});

modeTimerBtn.addEventListener("click", () => {

  selectedMode = "timer";

  timerContainer.classList.remove("hidden");
  hoursContainer.classList.add("hidden");

});
// ===============================
// TIMER PERSONNALISÉ
// ===============================
const timerDuration = document.getElementById("timerDuration");
const customTimer = document.getElementById("customTimer");

if (timerDuration) {

  timerDuration.addEventListener("change", () => {

    if (timerDuration.value === "custom") {

      customTimer.classList.remove("hidden");

    } else {

      customTimer.classList.add("hidden");

    }

  });

}


// ===============================
// CHECK SALON ACTIF
// ===============================

async function checkActiveRoom() {

  const q = query(
    collection(db, "presenceRooms"),
    where("status", "==", "active"),
    limit(1)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {

    const room = snap.docs[0];

    activeRoomId = room.id;

    activeRoomStatus.innerText = "Un salon est déjà actif.";

    launchRadarBtn.classList.remove("hidden");
    forceStopBtn.classList.remove("hidden");

    return true;
  }

  activeRoomStatus.innerText = "Aucun salon actif.";

  return false;
}

checkActiveRoom();

// ===============================
// VALIDATION
// ===============================

function validateForm() {

  const date = document.getElementById("roomDate").value;
  const chorale = document.getElementById("roomChorale").value;
  const type = document.getElementById("roomType").value;

  const mode = selectedMode;

  if (!date || !chorale || !type || !mode) return false;

  if (mode === "hours") {

    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;

    if (!start || !end) return false;
  }

  if (mode === "timer") {

    const duration = document.getElementById("timerDuration").value;

    if (!duration) return false;

    if (duration === "custom") {

      const custom = document.getElementById("customTimer").value;

      if (!custom) return false;

    }

  }

  return true;
}



// ===============================
// CREATE ROOM
// ===============================

openRoomBtn.addEventListener("click", async () => {

  const alreadyActive = await checkActiveRoom();

  if (alreadyActive) {
    alert("Un salon est déjà actif.");
    return;
  }

if (!validateForm()) {
  alert("Veuillez remplir tous les champs obligatoires.");
  return;
}

if (!selectedMode) {
  alert("Choisissez un mode de durée.");
  return;
}

  navigator.geolocation.getCurrentPosition(async (position) => {

    openRoomBtn.disabled = true;

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const date = document.getElementById("roomDate").value;
    const chorale = document.getElementById("roomChorale").value;
    const type = document.getElementById("roomType").value;
    const description = document.getElementById("roomDescription").value;

    const mode = selectedMode;

    let startTimestamp = null;
    let endTimestamp = null;

    if (mode === "hours") {

      const start = document.getElementById("startTime").value;
      const end = document.getElementById("endTime").value;

      startTimestamp = new Date(`${date}T${start}`);
      endTimestamp = new Date(`${date}T${end}`);

    } else {

      let minutes = document.getElementById("timerDuration").value;

      if (minutes === "custom") {
        minutes = document.getElementById("customTimer").value;
      }

      startTimestamp = new Date();
      endTimestamp = new Date(Date.now() + minutes * 60000);

    }

    const storedUser = JSON.parse(localStorage.getItem("myum_user"));
    const photoURL = storedUser.photoURL || "/myUm/assets/default-avatar.png";

    if (!storedUser) {
      alert("Session invalide.");
      return;
    }

    const userId = storedUser.id;
    const fullName = `${storedUser.firstName} ${storedUser.lastName}`;

const roomRef = await addDoc(collection(db, "presenceRooms"), {

  date,
  chorale,
  type,
  description,
  mode,

  startTime: startTimestamp,
  endTime: endTimestamp,

  latitude,
  longitude,

  status: "active",

  createdBy: userId,
  createdByName: fullName,
  photoURL: photoURL, // ✅ AJOUT ICI

  createdAt: serverTimestamp()

});

    activeRoomId = roomRef.id;

    activeRoomStatus.innerText = "Salon actif.";

    launchRadarBtn.classList.remove("hidden");
    forceStopBtn.classList.remove("hidden");

    autoCloseRoom(roomRef.id, endTimestamp);

    openRadar(roomRef.id);

  }, () => {

    alert("Géolocalisation refusée. Impossible de créer le salon.");

  });

});



// ===============================
// AUTO CLOSE
// ===============================

function autoCloseRoom(roomId, endTime) {

  const delay = endTime.getTime() - Date.now();

  if (delay <= 0) return;

  setTimeout(async () => {

    await updateDoc(doc(db, "presenceRooms", roomId), {
      status: "closed"
    });

    activeRoomStatus.innerText = "Salon expiré.";

    launchRadarBtn.classList.add("hidden");
    forceStopBtn.classList.add("hidden");

  }, delay);

}

// ===============================
// FERMETURE AUTO DU RADAR
// ===============================
async function checkRoomExpiration() {

  const q = query(
    collection(db, "presenceRooms"),
    where("status", "==", "active"),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) return;

  const room = snap.docs[0];
  const data = room.data();

  if (!data.endTime) return;

  const endTime = data.endTime.toDate();

  if (new Date() >= endTime) {

    await updateDoc(doc(db, "presenceRooms", room.id), {
      status: "closed"
    });

    activeRoomStatus.innerText = "Salon expiré.";

  }

}

checkRoomExpiration();



// ===============================
// FORCE STOP
// ===============================

forceStopBtn.addEventListener("click", async () => {

  if (!activeRoomId) return;

  await updateDoc(doc(db, "presenceRooms", activeRoomId), {
    status: "closed"
  });

  activeRoomStatus.innerText = "Salon arrêté manuellement.";

  launchRadarBtn.classList.add("hidden");
  forceStopBtn.classList.add("hidden");

});



// ===============================
// LAUNCH RADAR
// ===============================

launchRadarBtn.addEventListener("click", () => {

  if (!activeRoomId) return;

  openRadar(activeRoomId);

});
