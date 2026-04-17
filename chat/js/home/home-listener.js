import { db } from "../../../mains.js/firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { renderConversation } from "./home-ui.js";

export function listenChats(myId, container, emptyState) {

  const chatsRef = collection(db, "chats");

  const q = query(
    chatsRef,
    where("participants", "array-contains", myId),
    orderBy("updatedAt", "desc")
  );

  onSnapshot(q, async (snap) => {

    container.innerHTML = "";

    if (snap.empty) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    for (const docSnap of snap.docs) {
      const chat = docSnap.data();

      const otherId = chat.participants.find(p => p !== myId);

      const userSnap = await getDoc(doc(db, "users", otherId));

      let display = "User";
      let initials = "U";
      let photoURL = null;

      if (userSnap.exists()) {
        const u = userSnap.data();

        display =
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.username ||
          "User";

        initials =
          (u.firstName?.[0] || "") +
          (u.lastName?.[0] || "");

        photoURL = u.photoURL || null;
      }

      const time = chat.updatedAt?.toDate
        ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

      renderConversation(container, {
        otherId,
        other: { display, initials, photoURL },
        lastMessage: chat.lastMessage,
        time,
        unread: chat.unreadCount?.[myId] || 0
      }, myId);
    }

  });
}