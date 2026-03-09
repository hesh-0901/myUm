import navigationStack from "./navigation-stack.js";


/* =========================
ELEMENTS
========================= */

const titleEl = document.getElementById("backHeaderTitle");
const backBtn = document.getElementById("globalBackBtn");


/* =========================
SET TITLE
========================= */

const pageTitle = document.body.dataset.title;

if(pageTitle){
titleEl.textContent = pageTitle;
}


/* =========================
BACK BUTTON
========================= */

backBtn.addEventListener("click",()=>{

navigationStack.back();

});
