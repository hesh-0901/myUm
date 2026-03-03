import { db } from "/myUm/mains.js/firebase-config.js";
import {
collection, query, where, getDocs,
doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM
const roomInfo = document.getElementById("roomInfo");
const enterRoomBtn = document.getElementById("enterRoomBtn");
const immersiveModal = document.getElementById("immersiveModal");
const liveCount = document.getElementById("liveCount");
const fingerprintBtn = document.getElementById("fingerprintBtn");
const progressCircle = document.getElementById("progressCircle");
const immersiveTimer = document.getElementById("immersiveTimer");
const backBtn = document.getElementById("backBtn");

let activeRoomId = null;
let roomData = null;
let unsubscribe = null;
let scanInterval = null;
let progress = 0;

const circumference = 2 * Math.PI * 100;

// ===== LOAD ACTIVE ROOM =====
async function loadActiveRoom(){
const q = query(collection(db,"presenceRooms"),where("status","==","active"));
const snap = await getDocs(q);

if(snap.empty){
roomInfo.innerHTML="<p>Aucun salon actif.</p>";
roomInfo.classList.remove("hidden");
return;
}

const docSnap = snap.docs[0];
activeRoomId = docSnap.id;
roomData = docSnap.data();

roomInfo.innerHTML=`
<p><strong>Ouvert par :</strong> ${roomData.createdByName}</p>
<p><strong>Chorale :</strong> ${roomData.chorale}</p>
<p><strong>Motif :</strong> ${roomData.type}</p>
`;

roomInfo.classList.remove("hidden");
enterRoomBtn.classList.remove("hidden");
startTimer();
}
loadActiveRoom();

// ===== TIMER =====
function startTimer(){
setInterval(()=>{
if(!roomData) return;
const diff = roomData.endTime.toDate()-new Date();
if(diff<=0){ immersiveTimer.innerText="00:00"; return;}
const m=Math.floor(diff/60000);
const s=Math.floor((diff%60000)/1000);
immersiveTimer.innerText=`${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
},1000);
}

// ===== ENTER =====
enterRoomBtn?.addEventListener("click",()=>{
immersiveModal.classList.remove("hidden");

unsubscribe = onSnapshot(
collection(db,"presenceRooms",activeRoomId,"attendances"),
snap=> liveCount.innerText=snap.size
);
});

// ===== BACK =====
backBtn?.addEventListener("click",()=>{
immersiveModal.classList.add("hidden");
if(unsubscribe) unsubscribe();
});

// ===== SCAN =====
function startScan(e){
e.preventDefault();
progress=0;
fingerprintBtn.classList.add("scanning");

scanInterval=setInterval(()=>{
progress+=1.5;
updateProgress(progress);

if(navigator.vibrate) navigator.vibrate(30);

if(progress>=100){
clearInterval(scanInterval);
completeScan();
}
},40);
}

function cancelScan(){
clearInterval(scanInterval);
updateProgress(0);
fingerprintBtn.classList.remove("scanning");
}

function updateProgress(value){
const offset = circumference - (value/100)*circumference;
progressCircle.style.strokeDashoffset=offset;
}

// ===== COMPLETE =====
async function completeScan(){

if(navigator.vibrate) navigator.vibrate([300,150,300]);

successSoundLong();

await signPresence();

fingerprintBtn.innerHTML="<i class='bi bi-check-circle text-5xl text-green-400'></i>";
fingerprintBtn.classList.remove("scanning");
}

// ===== SIGNATURE =====
async function signPresence(){

if(roomData.status!=="active") return;

const storedUser = JSON.parse(localStorage.getItem("myum_user"));
if(!storedUser) return;

const attendanceRef = doc(db,"presenceRooms",activeRoomId,"attendances",storedUser.id);

const existing = await getDoc(attendanceRef);
if(existing.exists()) return;

await setDoc(attendanceRef,{
userId:storedUser.id,
username:storedUser.username,
fullName:`${storedUser.firstName} ${storedUser.lastName}`,
genre:storedUser.genre==="Homme"?"M":"F",
statut:"P",
method:"auto",
timestamp:serverTimestamp()
});
}

// ===== LONG SUCCESS SOUND =====
function successSoundLong(){
const ctx=new(window.AudioContext||window.webkitAudioContext)();
const osc=ctx.createOscillator();
const gain=ctx.createGain();
osc.connect(gain);
gain.connect(ctx.destination);

osc.type="sawtooth";
osc.frequency.setValueAtTime(400,ctx.currentTime);
osc.frequency.exponentialRampToValueAtTime(900,ctx.currentTime+0.6);

gain.gain.setValueAtTime(0.5,ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.2);

osc.start();
osc.stop(ctx.currentTime+1.2);
}

// ===== EVENTS =====
fingerprintBtn?.addEventListener("mousedown",startScan);
fingerprintBtn?.addEventListener("touchstart",startScan,{passive:false});
fingerprintBtn?.addEventListener("mouseup",cancelScan);
fingerprintBtn?.addEventListener("mouseleave",cancelScan);
fingerprintBtn?.addEventListener("touchend",cancelScan);
