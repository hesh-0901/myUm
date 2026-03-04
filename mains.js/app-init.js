// mains.js/app-init.js

import { checkAuth } from "./auth-guard.js";
import { initPresence } from "./presence.js";

/* =========================
   APP GLOBAL INITIALIZER
========================= */

document.addEventListener("DOMContentLoaded", () => {

  try {

    // Vérifier session utilisateur
    checkAuth();

    // Initialiser présence globale
    initPresence({
      intervalMs: 25000
    });

  } catch (err) {

    console.error("App init error:", err);

  }

});