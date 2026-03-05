// mains.js/app-init.js

import { checkAuth } from "./auth-guard.js";
import { initPresence } from "./presence.js";
import { initNotifications } from "./notifications.js";

/* ============================================================
   APP INIT (GLOBAL BOOTSTRAP)
   Utilité:
   - Check session (auth-guard)
   - Démarrer présence (heartbeat)
   - Démarrer notifications (toast + son)
   IMPORTANT:
   - À inclure sur toutes les pages privées (pas login/register)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  try {
    checkAuth();
    initPresence({ intervalMs: 25000 });
    initNotifications();
  } catch (err) {
    console.error("App init error:", err);
  }
});