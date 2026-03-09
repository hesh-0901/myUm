import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("export-enreg-pdf chargé");

document.addEventListener("DOMContentLoaded", init);

function init(){

waitForHeader();

}


// =======================================
// WAIT HEADER
// =======================================

function waitForHeader(){

const interval = setInterval(()=>{

const header = document.getElementById("header-back");

if(!header) return;


// chercher header-actions

let actions = document.getElementById("header-actions");


// créer si absent

if(!actions){

actions = document.createElement("div");

actions.id = "header-actions";

actions.className =
"absolute right-4 top-1/2 -translate-y-1/2 flex items-center";

header.appendChild(actions);

}


// injecter bouton

if(!actions.querySelector(".pdf-btn")){

const btn = document.createElement("button");

btn.className =
"pdf-btn w-10 h-10 flex items-center justify-center rounded-full bg-lightblue/10 text-medium hover:bg-lightblue/20 transition";

btn.innerHTML =
`<i class="bi bi-file-earmark-pdf text-lg"></i>`;

btn.onclick = ()=>alert("PDF export");

actions.appendChild(btn);

}

clearInterval(interval);

},200);

}
