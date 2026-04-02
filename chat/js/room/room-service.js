import { db } from "../../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function buildChatId(a, b) {
  return [a, b].sort().join("_");
}

export function getMessagesRef(myId, friendId) {
  const chatId = buildChatId(myId, friendId);
  return collection(db, "chats", chatId, "messages");
}

export async function sendMessage(myId, friendId, inputEl) {
  const text = inputEl.value.trim();
  if (!text) return;

  const ref = getMessagesRef(myId, friendId);

  await addDoc(ref, {
    senderId: myId,
    text,
    createdAt: serverTimestamp()
  });

  inputEl.value = "";
}