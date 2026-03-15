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

/* ================= DOM ================= */

const roomInfo = document.getElementById("roomInfo");
const enterRoomBtn = document.getElementById("enterRoomBtn");
const immersiveModal = document.getElementById("immersiveModal");
const liveCount = document.getElementById("liveCount");
const fingerprintBtn = document.getElementById("fingerprintBtn");
const progressCircle = document.getElementById("progressCircle");
const immersiveTimer = document.getElementById("immersiveTimer");
const backBtn = document.getElementById("backBtn");
const distanceDisplay = document.getElementById("distanceDisplay");
const distanceRadar = document.getElementById("distanceRadar");
const distanceDot = document.getElementById("distanceDot");

/* ================= STATE ================= */

let activeRoomId = null;
let roomData = null;
let unsubscribe = null;
let scanInterval = null;
let timerInterval = null;
let distanceInterval = null;
let progress = 0;

/* ================= PROGRESS RING ================= */

const radius = 110;
const circumference = 2 * Math.PI * radius;

if (progressCircle) {
progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = circumference;
}

/* ================= DISTANCE CALCULATION ================= */

function getDistance(lat1, lon1, lat2, lon2){

const R = 6371000;

const toRad = v => v * Math.PI / 180;

const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);

const a =
Math.sin(dLat/2)*Math.sin(dLat/2)+
Math.cos(toRad(lat1))*
Math.cos(toRad(lat2))*
Math.sin(dLon/2)*Math.sin(dLon/2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

return R * c;
}

/* ================= RADAR VISUAL ================= */

function updateRadar(distance){

if(!distanceDot) return;

/* rayon radar */
const maxRadius = 120;

/* distance max autorisée */
const maxDistance = 7;

/* normalisation distance */
let ratio = Math.min(distance / maxDistance,1);

/* angle aléatoire */
const angle = Math.random() * Math.PI * 2;

/* position */
const r = ratio * maxRadius;

const x = 130 + r * Math.cos(angle);
const y = 130 + r * Math.sin(angle);

distanceDot.style.left = x + "px";
distanceDot.style.top = y + "px";

}

/* ================= LOAD ACTIVE ROOM ================= */

async function loadActiveRoom(){

const q = query(
collection(db,"presenceRooms"),
where("status","==","active")
);

const snap = await getDocs(q);

if(snap.empty){

roomInfo.innerHTML = "<p>Aucun salon actif.</p>";
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
startDistanceTracker();

}

loadActiveRoom();

/* ================= TIMER ================= */

function startTimer(){

if(timerInterval) clearInterval(timerInterval);

timerInterval = setInterval(()=>{

if(!roomData) return;

const diff = roomData.endTime.toDate() - new Date();

if(diff <= 0){

immersiveTimer.innerText = "00:00";

clearInterval(timerInterval);

return;
}

const m = Math.floor(diff/60000);
const s = Math.floor((diff%60000)/1000);

immersiveTimer.innerText =
`${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

},1000);

}

/* ================= DISTANCE TRACKER ================= */

function startDistanceTracker(){

if(!roomData.latitude || !roomData.longitude) return;

distanceInterval = setInterval(()=>{

navigator.geolocation.getCurrentPosition(pos=>{

const userLat = pos.coords.latitude;
const userLng = pos.coords.longitude;

const distance = getDistance(
userLat,
userLng,
roomData.latitude,
roomData.longitude
);

updateRadar(distance);
  
if(distanceDisplay){

distanceDisplay.innerText =
`Distance : ${distance.toFixed(1)} m`;

if(distance > 7){
distanceDisplay.classList.add("text-red-500");
}
else{
distanceDisplay.classList.remove("text-red-500");
}

}

});

},2000);

}

/* ================= ENTER ROOM ================= */

enterRoomBtn?.addEventListener("click",()=>{

immersiveModal.classList.remove("hidden");

unsubscribe = onSnapshot(
collection(db,"presenceRooms",activeRoomId,"attendances"),
snap => liveCount.innerText = snap.size
);

});

/* ================= BACK BUTTON ================= */

backBtn?.addEventListener("click",()=>{

immersiveModal.classList.add("hidden");

if(unsubscribe){

unsubscribe();
unsubscribe = null;

}

cancelScan();

});

/* ================= SCAN ================= */

function startScan(e){

e.preventDefault();

if(!activeRoomId || !roomData) return;

progress = 0;

updateProgress(0);

fingerprintBtn.classList.add("scanning");

if(scanInterval) clearInterval(scanInterval);

scanInterval = setInterval(()=>{

progress += 1.2;

updateProgress(progress);

spawnParticle();

if(navigator.vibrate) navigator.vibrate(15);

if(progress >= 100){

clearInterval(scanInterval);

completeScan();

}

},35);

}

function cancelScan(){

if(scanInterval) clearInterval(scanInterval);

progress = 0;

updateProgress(0);

fingerprintBtn.classList.remove("scanning");

}

/* ================= PROGRESS ================= */

function updateProgress(value){

if(!progressCircle) return;

const offset =
circumference - (value/100) * circumference;

progressCircle.style.strokeDashoffset = offset;

}

/* ================= PARTICLES ================= */

function spawnParticle(){

const particle = document.createElement("div");

particle.style.position="absolute";
particle.style.width="4px";
particle.style.height="4px";
particle.style.background="#38bdf8";
particle.style.borderRadius="50%";

particle.style.left=(110+Math.random()*40-20)+"px";
particle.style.top=(110+Math.random()*40-20)+"px";

particle.style.opacity="1";
particle.style.transition="all 0.8s ease";

immersiveModal.appendChild(particle);

setTimeout(()=>{
particle.style.transform="scale(3)";
particle.style.opacity="0";
},10);

setTimeout(()=>{
particle.remove();
},800);

}

/* ================= COMPLETE SCAN ================= */

async function completeScan(){

if(navigator.vibrate)
navigator.vibrate([300,150,300,150,300]);

cinematicFlash();

successSoundEpic();

await signPresence();

fingerprintBtn.innerHTML =
"<i class='bi bi-check-circle text-5xl text-green-400'></i>";

fingerprintBtn.classList.remove("scanning");

}

/* ================= FLASH ================= */

function cinematicFlash(){

const flash = document.createElement("div");

flash.style.position="fixed";
flash.style.inset="0";
flash.style.background="white";
flash.style.opacity="0.9";
flash.style.transition="opacity 0.6s ease";
flash.style.zIndex="9999";

document.body.appendChild(flash);

setTimeout(()=>flash.style.opacity="0",50);

setTimeout(()=>flash.remove(),600);

}

/* ================= SIGN PRESENCE ================= */

async function signPresence(){

if(!roomData || roomData.status!=="active") return;

const storedUser =
JSON.parse(localStorage.getItem("myum_user"));

if(!storedUser) return;

const attendanceRef = doc(
db,
"presenceRooms",
activeRoomId,
"attendances",
storedUser.id
);

const existing = await getDoc(attendanceRef);

if(existing.exists()) return;

await setDoc(attendanceRef,{

userId: storedUser.id,
username: storedUser.username,
fullName: `${storedUser.firstName} ${storedUser.lastName}`,
genre: storedUser.genre === "Homme" ? "M" : "F",
statut: "P",
method: "auto",
timestamp: serverTimestamp()

});

}

/* ================= SOUND ================= */

function successSoundEpic(){

const ctx =
new (window.AudioContext||window.webkitAudioContext)();

if(ctx.state==="suspended") ctx.resume();

const osc = ctx.createOscillator();
const gain = ctx.createGain();

osc.connect(gain);
gain.connect(ctx.destination);

osc.type="sawtooth";

osc.frequency.setValueAtTime(300,ctx.currentTime);

osc.frequency.exponentialRampToValueAtTime(
1200,
ctx.currentTime+0.8
);

gain.gain.setValueAtTime(0.7,ctx.currentTime);

gain.gain.exponentialRampToValueAtTime(
0.001,
ctx.currentTime+1.5
);

osc.start();
osc.stop(ctx.currentTime+1.5);

}

/* ================= EVENTS ================= */

fingerprintBtn?.addEventListener("mousedown",startScan);
fingerprintBtn?.addEventListener("touchstart",startScan,{passive:false});
fingerprintBtn?.addEventListener("mouseup",cancelScan);
fingerprintBtn?.addEventListener("mouseleave",cancelScan);
fingerprintBtn?.addEventListener("touchend",cancelScan);
