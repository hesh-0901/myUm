/* ===============================
   LOAD HEADER BACK PARTIAL
================================ */

async function loadHeaderBack(){

const container = document.getElementById("header-back");

if(!container) return;

try{

const response = await fetch("/myUm/partials/header-back.html");

const html = await response.text();

container.innerHTML = html;

initHeaderBack();

}

catch(error){

console.error("Erreur chargement header-back :", error);

}

}


/* ===============================
   INIT HEADER
================================ */

function initHeaderBack(){

const backBtn = document.getElementById("globalBackBtn");
const title = document.getElementById("backHeaderTitle");

const pageTitle = document.body.dataset.title;

if(title && pageTitle){

title.textContent = pageTitle;

}

if(backBtn){

backBtn.addEventListener("click",()=>{

window.history.back();

});

}

}


/* ===============================
   START
================================ */

document.addEventListener("DOMContentLoaded", loadHeaderBack);
