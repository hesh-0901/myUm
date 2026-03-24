import { db } from "../../mains.js/firebase-config.js";
import "/myUm/partials/js/back-header.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// LOAD PARTIALS
// ======================================



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

const genre = (user.genre || "").toLowerCase();

if (genre === "homme" || genre === "h") {
  countH++;
}
else if (genre === "femme" || genre === "f" || genre === "m") {
  countF++;
}
else {
  countNM++;
}

const chorale = user.chorale || "Inconnue";

if(!chorales[chorale]){
chorales[chorale] = {
  count: 0,
  H: 0,
  F: 0,
  NM: 0
};
}

chorales[chorale].count++;

// gestion genre par chorale
if (genre === "homme" || genre === "h") {
  chorales[chorale].H++;
}
else if (genre === "femme" || genre === "f" || genre === "m") {
  chorales[chorale].F++;
}
else {
  chorales[chorale].NM++;
}

});


// ================= UPDATE UI

totalUsersEl.textContent = total;
countHEl.textContent = countH;
countFEl.textContent = countF;
countNMEl.textContent = countNM;

// ================= RENDER CHORALES (STYLE PRO)

choraleContainer.innerHTML = "";

// mapping noms complets
const choraleNames = {
PC: "Prophetic Choir",
WS: "Wake Up Song",
VN: "Vent Nouveau",
IN: "Instrumentiste",
AD: "Administration",
GT: "Visiteur"
};

// couleurs fixes (plus propre que random)
const choraleStyles = {
PC: "bg-blue-100 text-blue-600",
WS: "bg-green-100 text-green-600",
VN: "bg-purple-100 text-purple-600",
IN: "bg-yellow-100 text-yellow-600",
AD: "bg-red-100 text-red-600",
GT: "bg-gray-200 text-gray-600"
};

// icônes adaptées
const choraleIcons = {
PC: "bi-mic-fill",
WS: "bi-music-note-list",
VN: "bi-wind",
IN: "bi-music-note-beamed",
AD: "bi-gear-fill",
GT: "bi-person"
};

Object.entries(chorales).forEach(([code,data]) => {

const name = choraleNames[code] || code;
const style = choraleStyles[code] || "bg-gray-100 text-gray-600";
const icon = choraleIcons[code] || "bi-music-note";
const percent = total > 0 
  ? Math.round((data.count / total) * 100) 
  : 0;

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


card.innerHTML = `

<div class="flex items-center gap-3">

  <div class="w-11 h-11 rounded-2xl flex items-center justify-center ${style}">
    <i class="bi ${icon} text-lg"></i>
  </div>

  <div class="flex flex-col w-full">

    <p class="text-sm font-semibold text-gray-800">
      ${name}
    </p>

        <p class="text-xs text-gray-400">
          ${percent}% des choristes
        </p>
        
        <div class="flex gap-3 mt-2 text-xs text-gray-500">
        
          <span class="text-green-600 font-medium">
            H: ${data.H}
          </span>
        
          <span class="text-pink-600 font-medium">
            F: ${data.F}
          </span>
        
          <span class="text-gray-500 font-medium">
            NM: ${data.NM}
          </span>
        
        </div>

    <!-- PROGRESS BAR -->
      <div class="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
        <div class="progress-bar h-2 rounded-full" 
     style="width:0%; display:block; background: linear-gradient(to right, #2596D9, #3FA9F5);">
</div>
      </div>

  </div>

</div>

<div class="text-right">

  <p class="text-lg font-semibold text-primary">
    ${data.count}
  </p>

  <p class="text-xs text-gray-400">
    membres
  </p>

</div>

`;

choraleContainer.appendChild(card);

const bar = card.querySelector(".progress-bar");

if(bar){
  bar.style.transition = "width 0.8s ease";

  requestAnimationFrame(() => {
    bar.style.width = percent + "%";
  });
}

// 👉 AJOUT ICI
bar.style.transition = "width 0.8s ease";

requestAnimationFrame(() => {
  bar.style.width = percent + "%";
});
  
});

}catch(err){

console.error(err);
alert("Erreur chargement dashboard");

}

}

loadDashboard();


