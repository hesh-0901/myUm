import { getMessagesRef } from "./services/room-service.js";

import {
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function listenMessages(myId, friendId, container) {
  const ref = getMessagesRef(myId, friendId);

  onSnapshot(ref, (snapshot) => {
    console.log("🔥 SNAPSHOT SIZE:", snapshot.size);

    container.innerHTML = "";

    const messages = [];

    snapshot.forEach(doc => {
      const m = doc.data();

      // ⚠️ ignore messages sans date (temps Firebase)
      if (!m.createdAt) return;

      messages.push({
        id: doc.id,
        ...m
      });
    });

    // 🔥 TRI MANUEL (important)
    messages.sort((a, b) => {
      return a.createdAt.toDate() - b.createdAt.toDate();
    });

    // 🔥 RENDER
    messages.forEach(m => {
      const div = document.createElement("div");

      const isMine = m.senderId === myId;

      div.className =
        "px-3 py-2 rounded-xl text-sm max-w-[70%] mb-2 " +
        (isMine
          ? "bg-blue-600 text-white ml-auto"
          : "bg-gray-200 text-black");

      div.textContent = m.text || "";

      container.appendChild(div);
    });

    // 🔥 scroll
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 50);

  }, (err) => {
    console.error("❌ LISTENER ERROR:", err);
  });
}