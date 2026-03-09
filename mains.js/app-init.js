// mains.js/app-init.js

import { checkAuth } from "./auth-guard.js";
import { initPresence } from "./presence.js";
import { initNotifications } from "./notifications.js";
import { initIncomingCalls } from "./incoming-calls.js";

/* ============================================================
   BLOC 1 : APP INIT GLOBAL
   Rôle :
   - Initialiser tous les services globaux de l'app
   - Session
   - Presence
   - Notifications
   - Incoming calls
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  try {
    checkAuth();
    initPresence({ intervalMs: 25000 });
    initNotifications();
    initIncomingCalls();
  } catch (err) {
    console.error("App init error:", err);
  }
});