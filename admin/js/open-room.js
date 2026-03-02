import { db } from "/myUm/mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { openRadar } from "/myUm/partials/js/radar.js";

const openRoomBtn = document.getElementById("openRoomBtn");
const launchRadarBtn = document.getElementById("launchRadarBtn");
const activeRoomStatus = document.getElementById("activeRoomStatus");

let activeRoomId = null;

// ===============================
// CHECK SALON ACTIF
// ===============================

async function checkActiveRoom() {
  const q = query(collection(db, "presenceRooms"), where("status", "==", "active"));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const room = snap.docs[0];
    activeRoomId = room.id;
    activeRoomStatus.innerText = "Un salon est déjà actif.";
    launchRadarBtn.classList.remove("hidden");
    return true;
  }

  activeRoomStatus.innerText = "Aucun salon actif.";
  return false;
}

checkActiveRoom();

// ===============================
// MODE SWITCH
// ===============================

document.querySelectorAll("input[name='mode']").forEach(radio => {
  radio.addEventListener("change", () => {

    document.getElementById("hoursContainer").classList.add("hidden");
    document.getElementById("timerContainer").classList.add("hidden");

    if (radio.value === "hours") {
      document.getElementById("hoursContainer").classList.remove("hidden");
    }

    if (radio.value === "timer") {
      document.getElementById("timerContainer").classList.remove("hidden");
    }
  });
});

document.getElementById("timerDuration").addEventListener("change", (e) => {
  if (e.target.value === "custom") {
    document.getElementById("customTimer").classList.remove("hidden");
  } else {
    document.getElementById("customTimer").classList.add("hidden");
  }
});

// ===============================
// VALIDATION
// ===============================

function validateForm() {

  const date = document.getElementById("roomDate").value;
  const chorale = document.getElementById("roomChorale").value;
  const type = document.getElementById("roomType").value;
  const mode = document.querySelector("input[name='mode']:checked");

  if (!date || !chorale || !type || !mode) return false;

  if (mode.value === "hours") {
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    if (!start || !end) return false;
  }

  if (mode.value === "timer") {
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

  // 🔥 On récupère la position GPS de l'admin
  navigator.geolocation.getCurrentPosition(async (position) => {

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const date = document.getElementById("roomDate").value;
    const chorale = document.getElementById("roomChorale").value;
    const type = document.getElementById("roomType").value;
    const description = document.getElementById("roomDescription").value;

    const mode = document.querySelector("input[name='mode']:checked").value;

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

// 🔥 Récupération admin connecté
const storedUser = JSON.parse(localStorage.getItem("myum_user"));
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

  // ✅ NOUVEAUX CHAMPS
  createdBy: userId,
  createdByName: fullName,

  createdAt: serverTimestamp()
});

    activeRoomId = roomRef.id;

    activeRoomStatus.innerText = "Salon actif.";
    launchRadarBtn.classList.remove("hidden");

    autoCloseRoom(roomRef.id, endTimestamp);

  }, () => {
    alert("Géolocalisation refusée. Impossible de créer le salon.");
  });

});

// ===============================
// AUTO CLOSE
// ===============================

function autoCloseRoom(roomId, endTime) {

  const interval = setInterval(async () => {

    if (new Date() >= endTime) {

      await updateDoc(doc(db, "presenceRooms", roomId), {
        status: "closed"
      });

      clearInterval(interval);
      activeRoomStatus.innerText = "Salon expiré.";
      launchRadarBtn.classList.add("hidden");
    }

  }, 5000);
}

// ===============================
// LAUNCH RADAR
// ===============================

launchRadarBtn.addEventListener("click", () => {
  if (!activeRoomId) return;
  openRadar(activeRoomId);
});
