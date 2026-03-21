import { db } from "../../../mains.js/firebase-config.js";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getRoomDom } from "./room-ui.js";
import { listenMessages } from "./room-messages.js";
import { sendTextMessage } from "./room-send.js";

import { bindSmartSend } from "./room-voice.js";
import { clearReplyTarget } from "./room-reply.js";

/* ============================================================
   INIT CORE
============================================================ */
export async function initRoomCore() {
  try {
    /* =========================
       SESSION
    ========================= */
    const currentUser = JSON.parse(localStorage.getItem("myum_user"));
    const myId = currentUser?.id;

    if (!myId) {
      alert("Session invalide");
      window.location.href = "../users/login.html";
      return;
    }

    /* =========================
       PARAMS
    ========================= */
    const params = new URLSearchParams(window.location.search);
    const friendId = params.get("uid");

    if (!friendId) {
      alert("Aucun utilisateur");
      window.location.href = "index.html";
      return;
    }

    /* =========================
       CHAT ID
    ========================= */
    const chatId = `chat_${[myId, friendId].sort().join("_")}`;

    const chatRef = doc(db, "chats", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");

    /* =========================
       DOM
    ========================= */
    const dom = getRoomDom();

    /* =========================
       ENSURE CHAT
    ========================= */
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        participants: [myId, friendId],
        lastMessage: "",
        lastSenderId: "",
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [myId]: 0,
          [friendId]: 0
        },
        createdAt: serverTimestamp()
      });
    }

    /* =========================
       LISTEN MESSAGES
    ========================= */
    listenMessages(messagesRef, dom.messagesEl, myId);

    /* =========================
       SMART SEND (IMPORTANT)
    ========================= */
    bindSmartSend(
      dom,

      // SEND TEXT
      async () => {
        const text = dom.messageInput.value.trim();
        if (!text) return;

        await sendTextMessage({
          messagesRef,
          chatRef,
          friendId,
          myId,
          text
        });

        dom.messageInput.value = "";
      },

      // OPEN VOICE
      () => {
        alert("🎤 Voice bientôt activé (phase 3)");
      }
    );

    /* =========================
       CANCEL REPLY
    ========================= */
    dom.cancelReplyBtn?.addEventListener("click", () => {
      clearReplyTarget(dom);
    });

  } catch (error) {
    console.error("initRoomCore error:", error);
    alert("Erreur room : " + (error?.message || error));
  }
}