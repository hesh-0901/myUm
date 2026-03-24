import { db } from "../../mains.js/firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ======================================
// LOAD PARTIALS
// ======================================

async function loadPartials(){

const header = await fetch("/myUm/partials/header-back.html").then(r=>r.text());
document.getElementById("header").innerHTML = header;

await import("/myUm/partials/js/back-header.js");

const nav = await fetch("/myUm/partials/nav.html").then(r=>r.text());
document.getElementById("nav").innerHTML = nav;

await import("/myUm/partials/js/nav.js");

}

loadPartials();


// ======================================
// DOM
// ======================================

const totalUsersEl = document.getElementById("totalUsers");
const countHEl = document.getElementById("countH");
const countMEl = document.getElementById("countM");
const countNMEl = document.getElementById("countNM");
const choraleContainer = document.getElementById("choraleContainer");


// ======================================
// LOAD DATA
// ======================================

async function loadDashboard(){

try{

const snap = await getDocs(collection(db,"users"));

let total = 0;

let countH = 0;
let countM = 0;
let countNM = 0;

const chorales = {};

snap.forEach(doc => {

const user = doc.data();

if(user.role !== "choriste") return;

total++;

// ================= GENRE
const genre = user.genre || "NM";

if(genre === "H") countH++;
else if(genre === "M") countM++;
else countNM++;

// ================= CHORALE
const chorale = user.chorale || "Inconnue";

if(!chorales[chorale]){
chorales[chorale] = 0;
}

chorales[chorale]++;

});

// ================= UPDATE UI

totalUsersEl.textContent = total;
countHEl.textContent = countH;
countMEl.textContent = countM;
countNMEl.textContent = countNM;


// ================= RENDER CHORALES

choraleContainer.innerHTML = "";

Object.entries(chorales).forEach(([name,count]) => {

const card = document.createElement("div");

card.className = "bg-white rounded-3xl shadow-sm p-4 flex justify-between items-center";

card.innerHTML = `
<span class="text-sm text-gray-600">${name}</span>
<span class="text-lg font-semibold text-primary">${count}</span>
`;

choraleContainer.appendChild(card);

});

}catch(err){

console.error(err);
alert("Erreur chargement dashboard");

}

}

loadDashboard();
