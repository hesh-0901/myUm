import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc, getDoc, updateDoc,
  collection, getDocs,
  setDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentRoomId;
let roomData;
let attendanceData = [];
let currentUser = JSON.parse(localStorage.getItem("myum_user"));

document.addEventListener("DOMContentLoaded", async () => {

  await injectPartials();

  const params = new URLSearchParams(window.location.search);
  currentRoomId = params.get("roomId");
  if (!currentRoomId) return;

  await loadRoom();
  await loadAttendances();
  initActions();
});

/* ================= PARTIALS ================= */

async function injectPartials() {

  const header = await fetch("/myUm/partials/back-header.html");
  document.getElementById("headerContainer").innerHTML = await header.text();

  const modal = await fetch("/myUm/partials/add-member.html");
  document.getElementById("modalContainer").innerHTML = await modal.text();

  document.getElementById("backBtn")
    .addEventListener("click", () => window.history.back());
}

/* ================= ROOM ================= */

async function loadRoom() {

  const snap = await getDoc(doc(db,"presenceRooms",currentRoomId));
  if(!snap.exists()) return;

  roomData = snap.data();

  document.getElementById("roomInfo").innerHTML = `
    <div><strong>Date :</strong> ${roomData.date}</div>
    <div><strong>Chorale :</strong> ${roomData.chorale}</div>
    <div><strong>Motif :</strong> ${roomData.type}</div>
    <div><strong>Description :</strong> ${roomData.description || "-"}</div>
    <div><strong>Statut :</strong> ${roomData.status}</div>
  `;

  if(currentUser.role==="admin"){
    document.getElementById("reopenRoom").classList.remove("hidden");
  }

  if(currentUser.role==="super_admin"){
    document.getElementById("approveRoom").classList.remove("hidden");
    document.getElementById("disapproveRoom").classList.remove("hidden");
  }
}

/* ================= ATTENDANCES ================= */

async function loadAttendances(){

  const snap = await getDocs(collection(db,"presenceRooms",currentRoomId,"attendances"));
  const body = document.getElementById("attendanceTableBody");
  body.innerHTML="";
  attendanceData=[];

  let index=1;

  snap.forEach(docSnap=>{
    const data = docSnap.data();
    const formatted = data.timestamp?.toDate().toLocaleString("fr-FR") || "-";

    attendanceData.push({...data});

    body.innerHTML+=`
      <tr>
        <td class="px-4 py-3">${index++}</td>
        <td class="px-4 py-3">${data.fullName}</td>
        <td class="px-4 py-3">${data.username}</td>
        <td class="px-4 py-3 text-center">${data.genre}</td>
        <td class="px-4 py-3">${data.method}</td>
        <td class="px-4 py-3">${formatted}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="removeAttendance('${docSnap.id}')"
            class="text-red-600">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

/* ================= ACTIONS ================= */

function initActions(){

  document.getElementById("openAddMember")
    .addEventListener("click",()=> {
      document.getElementById("addMemberModal").classList.remove("hidden");
    });

  document.getElementById("closeAddMember")
    .addEventListener("click",closeModal);

  document.getElementById("cancelAddMember")
    .addEventListener("click",closeModal);

  document.getElementById("confirmAddMember")
    .addEventListener("click",addManualUser);

  document.getElementById("reopenRoom")
    .addEventListener("click",()=> updateDoc(doc(db,"presenceRooms",currentRoomId),{status:"active"}));
}

function closeModal(){
  document.getElementById("addMemberModal").classList.add("hidden");
}

/* ================= MANUAL ADD ================= */

async function addManualUser(){

  const username = document.getElementById("manualUsername").value.trim();
  if(!username) return;

  const usersSnap = await getDocs(collection(db,"users"));
  let userFound=null;

  usersSnap.forEach(docSnap=>{
    if(docSnap.data().username===username){
      userFound = {...docSnap.data(), id: docSnap.id};
    }
  });

  if(!userFound) return alert("Utilisateur introuvable.");

  await setDoc(
    doc(db,"presenceRooms",currentRoomId,"attendances",userFound.id),
    {
      userId:userFound.id,
      username:userFound.username,
      fullName:userFound.firstName+" "+userFound.lastName,
      genre:userFound.genre==="Homme"?"M":"F",
      method:"manual",
      timestamp:serverTimestamp()
    }
  );

  closeModal();
  loadAttendances();
}

window.removeAttendance = async function(userId){
  await deleteDoc(doc(db,"presenceRooms",currentRoomId,"attendances",userId));
  loadAttendances();
};
