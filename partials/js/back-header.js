/* =====================================
   BACK HEADER MODULE
   MyUm
===================================== */

/*
Ce module gère :

- le bouton retour global
- le titre dynamique des pages
- la compatibilité navigation stack
*/

import navigationStack from "./navigation-stack.js";


/* =====================================
   DOM ELEMENTS
===================================== */

const backBtn = document.getElementById("globalBackBtn");
const titleEl = document.getElementById("backHeaderTitle");


/* =====================================
   SET PAGE TITLE
===================================== */

function setPageTitle() {

  if (!titleEl) return;

  /*
  Le titre est défini dans le body
  Exemple :

  <body data-title="Gestion membres">
  */

  const pageTitle = document.body.dataset.title;

  if (pageTitle && pageTitle.trim() !== "") {
    titleEl.textContent = pageTitle;
  }

}


/* =====================================
   BACK BUTTON HANDLER
===================================== */

function initBackButton() {

  if (!backBtn) return;

  backBtn.addEventListener("click", () => {

    /*
    Priorité au navigation stack
    */

    if (navigationStack && typeof navigationStack.back === "function") {

      navigationStack.back();
      return;

    }

    /*
    Fallback navigateur
    */

    window.history.back();

  });

}


/* =====================================
   INIT MODULE
===================================== */

function initBackHeader() {

  setPageTitle();

  initBackButton();

}


/* =====================================
   START
===================================== */

document.addEventListener("DOMContentLoaded", initBackHeader);
