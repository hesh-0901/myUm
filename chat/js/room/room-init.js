import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getMessagesRef, sendMessage } from "./room/room-service.js";
import { getRoomDom } from "./room-ui.js";

export function initRoom(myId, friendId) {
  console.log("INIT ROOM:", myId, friendId);

  const {
    messagesEl,
    messageInput,
    sendBtn
  } = getRoomDom();

  const messagesRef = getMessagesRef(myId, friendId);

  const q = query(messagesRef, orderBy("createdAt", "asc"));

  // 🔥 LISTENER
  onSnapshot(q, (snapshot) => {
    console.log("MESSAGES COUNT:", snapshot.size);

    messagesEl.innerHTML = "";

    snapshot.forEach(doc => {
      const m = doc.data();

      const div = document.createElement("div");
      div.className = "p-2 bg-gray-200 rounded-xl text-sm";

      div.textContent = m.text || "…";

      messagesEl.appendChild(div);
    });
  });

  // 🔥 SEND
  sendBtn.addEventListener("click", () => {
    sendMessage(myId, friendId, messageInput);
  });
}