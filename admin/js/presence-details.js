import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc, getDoc, updateDoc,
  collection, getDocs,
  setDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let attendanceData = [];
let currentRoomId = null;
let roomData = null;
let currentUser = JSON.parse(localStorage.getItem("myum_user"));

document.addEventListener("DOMContentLoaded", async () => {

  const params = new URLSearchParams(window.location.search);
  currentRoomId = params.get("roomId");

  if (!currentRoomId) return;

  await loadRoomDetails();
  await loadAttendances();

  initActions();
});

async function loadRoomDetails() {

  const snap = await getDoc(doc(db, "presenceRooms", currentRoomId));
  if (!snap.exists()) return;

  roomData = snap.data();

  const container = document.getElementById("roomInfo");

  container.innerHTML = `
    <p><strong>Date :</strong> ${roomData.date}</p>
    <p><strong>Chorale :</strong> ${roomData.chorale}</p>
    <p><strong>Motif :</strong> ${roomData.type}</p>
    <p><strong>Description :</strong> ${roomData.description || "-"}</p>
    <p><strong>Ouvert par :</strong> ${roomData.createdByName}</p>
    <p><strong>Statut :</strong> ${roomData.status}</p>
  `;

  // Gestion permissions
  if (currentUser.role === "admin" && roomData.status !== "submitted") {
    document.getElementById("manualAddSection").classList.remove("hidden");
    document.getElementById("reopenRoom").classList.remove("hidden");
  }

  if (currentUser.role === "super_admin") {
    document.getElementById("approveRoom").classList.remove("hidden");
    document.getElementById("disapproveRoom").classList.remove("hidden");
  }
}

async function loadAttendances() {

  const snapshot = await getDocs(
    collection(db, "presenceRooms", currentRoomId, "attendances")
  );

  const tableBody = document.getElementById("attendanceTableBody");
  tableBody.innerHTML = "";
  attendanceData = [];

  snapshot.forEach(docSnap => {

    const data = docSnap.data();
    const date = data.timestamp?.toDate();
    const formatted = date ? date.toLocaleString("fr-FR") : "-";

    attendanceData.push({
      Nom: data.fullName,
      Username: data.username,
      Genre: data.genre,
      Méthode: data.method,
      Horodatage: formatted
    });

    tableBody.innerHTML += `
      <tr>
        <td class="px-4 py-3">${data.fullName}</td>
        <td class="px-4 py-3">${data.username}</td>
        <td class="px-4 py-3 text-center">${data.genre}</td>
        <td class="px-4 py-3">${data.method}</td>
        <td class="px-4 py-3">${formatted}</td>
        <td class="px-4 py-3 text-center">
          ${currentUser.role !== "member" ? `
          <button onclick="removeAttendance('${docSnap.id}')"
            class="text-danger">
            <i class="bi bi-trash"></i>
          </button>` : ""}
        </td>
      </tr>
    `;
  });
}

window.removeAttendance = async function(userId) {
  await deleteDoc(doc(db, "presenceRooms", currentRoomId, "attendances", userId));
  loadAttendances();
};

function initActions() {

  document.getElementById("reopenRoom")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "presenceRooms", currentRoomId), {
      status: "active"
    });
    alert("Salon réouvert.");
  });

  document.getElementById("approveRoom")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "presenceRooms", currentRoomId), {
      status: "approved"
    });
    alert("Salon approuvé.");
  });

  document.getElementById("disapproveRoom")?.addEventListener("click", async () => {
    await updateDoc(doc(db, "presenceRooms", currentRoomId), {
      status: "active"
    });
    alert("Salon désapprouvé.");
  });

  document.getElementById("addManual")?.addEventListener("click", addManualUser);

  document.getElementById("exportXLS")?.addEventListener("click", exportXLS);
  document.getElementById("exportPDF")?.addEventListener("click", exportPDF);
}

async function addManualUser() {

  const username = document.getElementById("manualUsername").value.trim();
  if (!username) return;

  const userSnap = await getDocs(
    collection(db, "users")
  );

  let userData = null;

  userSnap.forEach(docSnap => {
    if (docSnap.data().username === username) {
      userData = docSnap.data();
    }
  });

  if (!userData) {
    alert("Utilisateur introuvable.");
    return;
  }

  await setDoc(
    doc(db, "presenceRooms", currentRoomId, "attendances", userData.id),
    {
      userId: userData.id,
      username: userData.username,
      fullName: userData.firstName + " " + userData.lastName,
      genre: userData.genre === "Homme" ? "M" : "F",
      method: "manual",
      timestamp: serverTimestamp()
    }
  );

  loadAttendances();
}

function exportXLS() {
  const worksheet = XLSX.utils.json_to_sheet(attendanceData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
  XLSX.writeFile(workbook, "Participants.xlsx");
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Liste des Participants", 10, 10);
  let y = 20;
  attendanceData.forEach(p => {
    doc.text(`${p.Nom} - ${p.Username}`, 10, y);
    y += 8;
  });
  doc.save("Participants.pdf");
}
