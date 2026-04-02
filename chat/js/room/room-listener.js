import { getMessagesRef } from "./room-service.js";
import { renderMessage } from "./room-ui.js";

import {
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function listenMessages(myId, friendId, container) {
  const ref = getMessagesRef(myId, friendId);

  const q = query(ref, orderBy("createdAt", "asc"));

  onSnapshot(q, (snap) => {
    container.innerHTML = "";

    snap.forEach(doc => {
      const m = doc.data();

      renderMessage(
        container,
        m,
        m.senderId === myId
      );
    });

    container.scrollTop = container.scrollHeight;
  });
}