// mains.js/app-init.js
import { checkAuth } from "./auth-guard.js";
import { initPresence } from "./presence.js";
import { initNotifications } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
  try {
    checkAuth();
    initPresence({ intervalMs: 25000 });
    initNotifications(); // 🔔 NEW
  } catch (err) {
    console.error("App init error:", err);
  }
});