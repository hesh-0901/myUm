import { db } from "../../../mains.js/firebase-config.js";

import {
  doc,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getRoomDom } from "./room-ui.js";
import { sendTextMessage } from "./room-send.js";
import { listenMessages } from "./room-messages.js";

export function initRoomCore() {
  const currentUser = JSON.parse(localStorage.getItem("myum_user"));
  const myId = currentUser?.id;

  const params = new URLSearchParams(window.location.search);
  const friendId = params.get("uid");

  const chatId = [myId, friendId].sort().join("_");

  const chatRef = doc(db, "chats", `chat_${chatId}`);
  const messagesRef = collection(db, "chats", `chat_${chatId}`, "messages");

  const dom = getRoomDom();

  listenMessages(messagesRef, dom.messagesEl, myId);

  dom.sendBtn?.addEventListener("click", async () => {
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
  });
}