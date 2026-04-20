import { db } from "../../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function buildChatId(a, b) {
  return [a, b].sort().join("_"); // ⚠️ IMPORTANT
}

export function getMessagesRef(myId, friendId) {
  const chatId = buildChatId(myId, friendId);
  return collection(db, "chats", chatId, "messages");
}

export async function sendMessage(myId, friendId, inputEl) {
  const text = inputEl.value.trim();
  if (!text) return;

  const chatId = buildChatId(myId, friendId);
  const messagesRef = collection(db, "chats", chatId, "messages");
  const chatRef = doc(db, "chats", chatId);

  console.log("SEND TO CHAT:", chatId);

  // 🔥 message
  await addDoc(messagesRef, {
    senderId: myId,
    text,
    createdAt: serverTimestamp()
  });

  // 🔥 chat doc
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [myId, friendId],
      lastMessage: text,
      updatedAt: serverTimestamp(),
      unreadCount: {
        [myId]: 0,
        [friendId]: 1
      }
    });
  } else {
    const data = snap.data();
    const currentUnread = data.unreadCount?.[friendId] || 0;

    await setDoc(chatRef, {
      lastMessage: text,
      updatedAt: serverTimestamp(),
      unreadCount: {
        ...data.unreadCount,
        [friendId]: currentUnread + 1,
        [myId]: 0
      }
    }, { merge: true });
  }

  inputEl.value = "";
}