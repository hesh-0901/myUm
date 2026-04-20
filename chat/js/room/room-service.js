import { db } from "../../../mains.js/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ============================================================
   BUILD CHAT ID
============================================================ */
export function buildChatId(a, b) {
  return [a, b].sort().join("_"); // ⚠️ DOIT MATCH PARTOUT
}

/* ============================================================
   GET MESSAGES REF
============================================================ */
export function getMessagesRef(myId, friendId) {
  const chatId = buildChatId(myId, friendId);
  return collection(db, "chats", chatId, "messages");
}

/* ============================================================
   SEND MESSAGE
============================================================ */
export async function sendMessage(myId, friendId, inputEl) {
  try {
    const text = (inputEl.value || "").trim();
    if (!text) return;

    const chatId = buildChatId(myId, friendId);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

    console.log("📨 SEND MESSAGE →", chatId);

    /* =========================
       1. CREATE MESSAGE
    ========================= */
    await addDoc(messagesRef, {
      senderId: myId,
      text,
      createdAt: serverTimestamp()
    });

    /* =========================
       2. UPDATE CHAT LIST
    ========================= */
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      // 🔥 NOUVEAU CHAT
      await setDoc(chatRef, {
        participants: [myId, friendId],
        lastMessage: text,
        updatedAt: new Date(), // ⚡ IMPORTANT POUR LISTE
        unreadCount: {
          [myId]: 0,
          [friendId]: 1
        }
      });

      console.log("✅ NEW CHAT CREATED");

    } else {
      // 🔥 CHAT EXISTANT
      const data = snap.data();
      const currentUnread = data.unreadCount?.[friendId] || 0;

      await setDoc(chatRef, {
        participants: data.participants || [myId, friendId],

        lastMessage: text,

        updatedAt: new Date(), // ⚡ TRIGGER LIST REFRESH

        unreadCount: {
          ...(data.unreadCount || {}),
          [friendId]: currentUnread + 1,
          [myId]: 0
        }
      }, { merge: true });

      console.log("✅ CHAT UPDATED");
    }

    /* =========================
       3. CLEAR INPUT
    ========================= */
    inputEl.value = "";

  } catch (error) {
    console.error("❌ sendMessage error:", error);
    alert("Erreur envoi message");
  }
}