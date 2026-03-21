import {
  addDoc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function sendTextMessage({
  messagesRef,
  chatRef,
  friendId,
  myId,
  text
}) {
  await addDoc(messagesRef, {
    senderId: myId,
    type: "text",
    text,
    createdAt: serverTimestamp(),
    deliveredTo: { [myId]: true },
    readBy: { [myId]: true }
  });

  const chatSnap = await getDoc(chatRef);
  const chat = chatSnap.data();

  const unread = (chat?.unreadCount?.[friendId] || 0) + 1;

  await updateDoc(chatRef, {
    lastMessage: text,
    lastSenderId: myId,
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${friendId}`]: unread
  });
}