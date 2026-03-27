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

  const container = document.getElementById("header-back");
  const backBtn = document.getElementById("globalBackBtn");
  const title = document.getElementById("backHeaderTitle");

  const pageTitle = document.body.dataset.title;

  // TITLE
  if(title && pageTitle){
    title.textContent = pageTitle;
  }

  // BACK BUTTON
  if(backBtn){
    backBtn.addEventListener("click",()=>{
      window.history.back();
    });
  }

  // ===============================
  // ACTION ADMIN (MEMBERS)
  // ===============================
  const path = window.location.pathname;

  if (path.endsWith("users-management.html")) {

    // évite doublon
    if (container.querySelector("#membersShortcut")) return;

    const actionBtn = document.createElement("button");
    actionBtn.id = "membersShortcut";

    actionBtn.innerHTML = '<i class="bi bi-collection"></i>';

    actionBtn.className = `
      absolute right-4 top-1/2 -translate-y-1/2
      text-gray-400 text-lg active:scale-95 transition
    `;

    actionBtn.addEventListener("click", () => {
      window.location.href = "/myUm/admin/members-management.html";
    });

    const headerContent = container.firstElementChild;

    if (!headerContent) return;

    headerContent.style.position = "relative";
    headerContent.appendChild(actionBtn);
  }

}


/* ===============================
   START
================================ */

document.addEventListener("DOMContentLoaded", loadHeaderBack);
