// mains.js/app-init.js

import { checkAuth } from "./auth-guard.js";
import { initPresence } from "./presence.js";
import { initNotifications } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {

try {

const user = checkAuth();

if(!user) return;

// init modules
initPresence({ intervalMs: 25000 });
initNotifications();

} catch (err) {

console.error("App init error:", err);

}

});
