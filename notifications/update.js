// ======================================
// UPDATE NOTIFICATIONS SYSTEM
// ======================================

import { db } from "/myUm/mains.js/firebase-config.js";
import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===============================
// PUSH UPDATE NOTIFICATION
// ===============================

export async function pushUpdateNotification(userId, version){

  try{

    await addDoc(collection(db,"notifications"),{

      userId: userId,
      type: "update",

      message: `Nouvelle version disponible (${version})`,

      read: false,
      createdAt: serverTimestamp()

    });

    console.log("✅ Notification update envoyée");

  }catch(err){

    console.error("❌ Erreur notif update :", err);

  }

}
