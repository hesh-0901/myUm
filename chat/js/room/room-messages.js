import {
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  formatMessageTime,
  getMessageDateKey,
  renderDateSeparator
} from "./room-utils.js";

export function listenMessages(messagesRef, messagesEl, myId) {
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(300));

  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";

    let previousDate = null;

    snap.forEach((docSnap) => {
      const msg = { id: docSnap.id, ...docSnap.data() };

      const currentDate = getMessageDateKey(msg.createdAt);

      if (currentDate !== previousDate) {
        messagesEl.appendChild(renderDateSeparator(msg.createdAt));
        previousDate = currentDate;
      }

      const wrap = document.createElement("div");
      wrap.className = msg.senderId === myId
        ? "flex justify-end"
        : "flex justify-start";

      const bubble = document.createElement("div");
      bubble.className = msg.senderId === myId
        ? "bg-primary text-white px-4 py-2 rounded-2xl"
        : "bg-white px-4 py-2 rounded-2xl";

      bubble.textContent = msg.text;

      const meta = document.createElement("div");
      meta.className = "text-[11px] mt-1 opacity-70";
      meta.textContent = formatMessageTime(msg.createdAt);

      bubble.appendChild(meta);
      wrap.appendChild(bubble);

      messagesEl.appendChild(wrap);
    });
  });
}