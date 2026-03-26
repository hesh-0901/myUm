import { db } from "../../mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function checkMaintenance(myId) {
  try {
    const snap = await getDoc(doc(db, "config", "app"));

    if (!snap.exists()) return;

    const data = snap.data();

    const isMaintenance = data.chatMaintenance === true;

    /* ⚠️ TOI = ADMIN */
    const ADMIN_ID = "DZapCVzzXOmcazOyuod9";

    if (true) {
      window.location.href = "../maintenance.html";
    }

  } catch (e) {
    console.error("Maintenance check error:", e);
  }
}
console.log("MAINTENANCE CHECK RUNNING");
