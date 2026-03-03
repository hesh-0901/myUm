import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ================= GLOBAL STATE ================= */

let currentRoomId = null;
let roomData = null;
let attendanceData = [];
let currentUser = JSON.parse(localStorage.getItem("myum_user"));

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {

  await injectPartials();

  const params = new URLSearchParams(window.location.search);
  currentRoomId = params.get("roomId");

  if (!currentRoomId) {
    alert("Salon introuvable.");
    return;
  }

  await loadRoom();
  await loadAttendances();
  initActions();
});

/* ================= PARTIAL INJECTION ================= */

async function injectPartials() {

  try {

    // HEADER
    const headerRes = await fetch("../partials/back-header.html");
    if (headerRes.ok) {
      document.getElementById("headerContainer").innerHTML =
        await headerRes.text();
    }

    // MODAL
    const modalRes = await fetch("../partials/add-member.html");
    if (modalRes.ok) {
      document.getElementById("modalContainer").innerHTML =
        await modalRes.text();
    }

    // BACK BUTTON SAFE
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => window.history.back());
    }

  } catch (error) {
    console.error("Erreur injection partials :", error);
  }
}

/* ================= LOAD ROOM ================= */

async function loadRoom() {

  const snap = await getDoc(doc(db, "presenceRooms", currentRoomId));
  if (!snap.exists()) return;

  roomData = snap.data();

  const container = document.getElementById("roomInfo");

  container.innerHTML = `
    <div><strong>Date :</strong> ${roomData.date || "-"}</div>
    <div><strong>Chorale :</strong> ${roomData.chorale || "-"}</div>
    <div><strong>Motif :</strong> ${roomData.type || "-"}</div>
    <div><strong>Description :</strong> ${roomData.description || "-"}</div>
    <div><strong>Statut :</strong> ${roomData.status || "-"}</div>
  `;

  // Permissions
  if (currentUser?.role === "admin") {
    const reopenBtn = document.getElementById("reopenRoom");
    if (reopenBtn) reopenBtn.classList.remove("hidden");
  }

  if (currentUser?.role === "super_admin") {
    document.getElementById("approveRoom")?.classList.remove("hidden");
    document.getElementById("disapproveRoom")?.classList.remove("hidden");
  }
}

/* ================= LOAD ATTENDANCES ================= */

async function loadAttendances() {

  const snap = await getDocs(
    collection(db, "presenceRooms", currentRoomId, "attendances")
  );

  const body = document.getElementById("attendanceTableBody");
  body.innerHTML = "";
  attendanceData = [];

  let index = 1;

  snap.forEach(docSnap => {

    const data = docSnap.data();
    const formatted =
      data.timestamp?.toDate().toLocaleString("fr-FR") || "-";

    attendanceData.push({
      Nom: data.fullName,
      Username: data.username,
      Genre: data.genre,
      Méthode: data.method,
      Horodatage: formatted
    });

    body.innerHTML += `
      <tr>
        <td class="px-4 py-3">${index++}</td>
        <td class="px-4 py-3">${data.fullName}</td>
        <td class="px-4 py-3">${data.username}</td>
        <td class="px-4 py-3 text-center">${data.genre}</td>
        <td class="px-4 py-3">${data.method}</td>
        <td class="px-4 py-3">${formatted}</td>
        <td class="px-4 py-3 text-center">
          ${
            currentUser?.role !== "member"
              ? `<button onclick="removeAttendance('${docSnap.id}')"
                  class="text-red-600 hover:text-red-800">
                  <i class="bi bi-trash"></i>
                 </button>`
              : ""
          }
        </td>
      </tr>
    `;
  });
}

/* ================= REMOVE ATTENDANCE ================= */

window.removeAttendance = async function (userId) {
  await deleteDoc(
    doc(db, "presenceRooms", currentRoomId, "attendances", userId)
  );
  await loadAttendances();
};

/* ================= ACTIONS ================= */

function initActions() {

  // OPEN MODAL
  document.getElementById("openAddMember")?.addEventListener("click", () => {
    document.getElementById("addMemberModal")?.classList.remove("hidden");
  });

  // CLOSE MODAL
  document.getElementById("closeAddMember")
    ?.addEventListener("click", closeModal);

  document.getElementById("cancelAddMember")
    ?.addEventListener("click", closeModal);

  // CONFIRM ADD
  document.getElementById("confirmAddMember")
    ?.addEventListener("click", addManualUser);

  // REOPEN ROOM
  document.getElementById("reopenRoom")
    ?.addEventListener("click", async () => {

      await updateDoc(
        doc(db, "presenceRooms", currentRoomId),
        { status: "active" }
      );

      alert("Salon réouvert.");
      await loadRoom();
    });

  // APPROVE
  document.getElementById("approveRoom")
    ?.addEventListener("click", async () => {

      await updateDoc(
        doc(db, "presenceRooms", currentRoomId),
        { status: "approved" }
      );

      alert("Salon approuvé.");
      await loadRoom();
    });

  // DISAPPROVE
  document.getElementById("disapproveRoom")
    ?.addEventListener("click", async () => {

      await updateDoc(
        doc(db, "presenceRooms", currentRoomId),
        { status: "active" }
      );

      alert("Salon désapprouvé.");
      await loadRoom();
    });

  // EXPORT
  document.getElementById("exportXLS")
    ?.addEventListener("click", exportXLS);

  document.getElementById("exportPDF")
    ?.addEventListener("click", exportPDF);
}

/* ================= CLOSE MODAL ================= */

function closeModal() {
  document.getElementById("addMemberModal")
    ?.classList.add("hidden");
}

/* ================= ADD MANUAL USER ================= */

async function addManualUser() {

  const usernameInput = document.getElementById("manualUsername");
  const username = usernameInput?.value.trim();

  if (!username) return alert("Username requis.");

  const usersSnap = await getDocs(collection(db, "users"));

  let userFound = null;

  usersSnap.forEach(docSnap => {
    if (docSnap.data().username === username) {
      userFound = { ...docSnap.data(), id: docSnap.id };
    }
  });

  if (!userFound) {
    alert("Utilisateur introuvable.");
    return;
  }

  await setDoc(
    doc(db, "presenceRooms", currentRoomId, "attendances", userFound.id),
    {
      userId: userFound.id,
      username: userFound.username,
      fullName: userFound.firstName + " " + userFound.lastName,
      genre: userFound.genre === "Homme" ? "M" : "F",
      method: "manual",
      timestamp: serverTimestamp()
    }
  );

  usernameInput.value = "";
  closeModal();
  await loadAttendances();
}

/* ================= EXPORT XLS ================= */

function exportXLS() {

  if (!attendanceData.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(attendanceData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");

  XLSX.writeFile(workbook, "Participants_Salon_MyUm.xlsx");
}

/* ================= EXPORT PDF ================= */

function exportPDF() {

  if (!attendanceData.length) {
    alert("Aucune donnée à exporter.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Liste des Participants", 14, 15);

  let y = 25;

  attendanceData.forEach((p, i) => {
    doc.setFontSize(10);
    doc.text(
      `${i + 1}. ${p.Nom} - ${p.Username} - ${p.Genre} - ${p.Méthode}`,
      14,
      y
    );
    y += 7;
  });

  doc.save("Participants_Salon_MyUm.pdf");
}
