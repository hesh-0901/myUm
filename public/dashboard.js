import { db } from "../mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
collection,
query,
where,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { checkAuth } from "../mains.js/auth-guard.js";
import { initHeader } from "../partials/js/header.js";
import { initSidebar } from "../partials/js/sidebar.js";

// ============================
// CHORALE ACCESS LOGIC
// ============================

function getAllowedChorales(user){

const mainChorales = ["PC","WS","VN"];

if(mainChorales.includes(user.chorale)){
return [user.chorale,"UM"];
}else{
return ["PC","WS","VN","UM"];
}

}

checkAuth();

initApp();

async function initApp(){

try{

const header = await fetch("../partials/header.html");
document.getElementById("header-container").innerHTML = await header.text();
await initHeader();

const sidebar = await fetch("../partials/sidebar.html");
document.getElementById("sidebar-container").innerHTML = await sidebar.text();
initSidebar();

const nav = await fetch("../partials/nav.html");
document.getElementById("navbar-container").innerHTML = await nav.text();

await import("../partials/js/nav.js");

await initDashboard();
loadProfileCompletion();

}catch(error){

console.error("Erreur chargement dashboard :",error);

}

}

async function initDashboard(){

const user = JSON.parse(localStorage.getItem("myum_user"));

if(!user) return;

const allowedChorales = getAllowedChorales(user);
initGauge(allowedChorales);
initQuickActions();
initScroll();

}

async function initGauge(allowedChorales){

const canvas=document.getElementById("participationChart");
if(!canvas) return;

const q = query(
collection(db,"presenceRooms"),
where("chorale","in",allowedChorales)
);

const snap = await getDocs(q);

let totalSessions = snap.size;
let totalPresences = 0;

for(const docSnap of snap.docs){

const roomId = docSnap.id;

const attendancesSnap = await getDocs(
collection(db,"presenceRooms",roomId,"attendances")
);

totalPresences += attendancesSnap.size;

}

const participation = totalSessions === 0
? 0
: Math.min(100, Math.round((totalPresences / (totalSessions*10)) * 100));

const ctx=canvas.getContext("2d");

new Chart(ctx,{
type:"doughnut",
data:{
datasets:[{
data:[participation,100-participation],
backgroundColor:["#54ACBF","#023859"],
borderWidth:0
}]
},
options:{
rotation:-90,
circumference:180,
cutout:"75%",
plugins:{
tooltip:{enabled:false},
legend:{display:false}
}
}
});

const label=document.getElementById("percentageLabel");
if(label) label.innerText=participation+"%";

}

function initQuickActions(){

const routes={
btnMessage:"../chat/index.html",
btnAgenda:"../agenda/index.html",
btnPublication:"../annonce/index.html",
btnPresenceRoom:"../users/presence.html",
btnJustification:"justification.html"
};

Object.keys(routes).forEach(id=>{

const btn=document.getElementById(id);

if(btn){

btn.addEventListener("click",()=>{
window.location.href=routes[id];
});

}

});

}

function initScroll(){

const slider=document.getElementById("quickActions");

if(!slider) return;

slider.addEventListener("wheel",(e)=>{
e.preventDefault();
slider.scrollLeft+=e.deltaY;
});

}

async function loadProfileCompletion(){

const user=JSON.parse(localStorage.getItem("myum_user"));
if(!user) return;

const snap=await getDoc(doc(db,"users",user.id));
if(!snap.exists()) return;

const data=snap.data();

const fields=[

"genre",
"etatCivil",
"commune",
"vieSeculiere",

"typeMembre",
"egliseProvenance",
"anneeBapteme",
"typeBapteme",

"statutAffermissement",
"responsableMinistere",

"registreVoix",
"groupeMusique"

];

let filled=0;

fields.forEach(field=>{

const value=data[field];

if(Array.isArray(value)){
if(value.length>0) filled++;
}
else if(value && value!==""){
filled++;
}

});

const percent=Math.round((filled/fields.length)*100);

const bar=document.getElementById("profileProgress");
const label=document.getElementById("profilePercent");

if(bar){
setTimeout(()=>{
bar.style.width=percent+"%";
},100);
}

if(label){
label.innerText=percent+"%";
}

}
