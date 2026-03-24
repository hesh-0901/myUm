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
const countFEl = document.getElementById("countM");
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
let countF = 0;
let countNM = 0;

const chorales = {};

snap.forEach(doc => {

const user = doc.data();

if(user.role !== "choriste") return;

total++;

const genre = (user.genre || "").toUpperCase();

if(genre === "H") countH++;
else if(genre === "M" || genre === "F") countF++;
else countNM++;

const chorale = user.chorale || "Inconnue";

if(!chorales[chorale]){
chorales[chorale] = {
count:0
};
}

chorales[chorale].count++;

});


// ================= UPDATE UI

totalUsersEl.textContent = total;
countHEl.textContent = countH;
countFEl.textContent = countF;
countNMEl.textContent = countNM;


// ================= RENDER CHORALES (STYLE AMÉLIORÉ)

choraleContainer.innerHTML = "";

Object.entries(chorales).forEach(([name,data]) => {

const card = document.createElement("div");

card.className = `
bg-white
rounded-3xl
shadow-sm
p-4
flex
items-center
justify-between
transition
active:scale-95
`;

// petit effet couleur aléatoire soft
const colors = [
"bg-blue-100 text-blue-600",
"bg-green-100 text-green-600",
"bg-purple-100 text-purple-600",
"bg-yellow-100 text-yellow-600"
];

const randomColor = colors[Math.floor(Math.random()*colors.length)];

card.innerHTML = `

<div class="flex items-center gap-3">

<div class="w-10 h-10 rounded-xl flex items-center justify-center ${randomColor}">
<i class="bi bi-music-note-beamed"></i>
</div>

<div>
<p class="text-sm font-medium text-gray-700">${name}</p>
<p class="text-xs text-gray-400">Chorale</p>
</div>

</div>

<div class="text-lg font-semibold text-primary">
${data.count}
</div>

`;

choraleContainer.appendChild(card);

});

}catch(err){

console.error(err);
alert("Erreur chargement dashboard");

}

}

loadDashboard();
