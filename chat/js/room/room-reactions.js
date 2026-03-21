import {
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function toggleReaction(db, chatId, messageId, myId, emoji) {
  const ref = doc(db, "chats", chatId, "messages", messageId);

  await updateDoc(ref, {
    [`reactions.${myId}`]: emoji
  });
}

export function renderReactions(message) {
  const reactions = message.reactions || {};
  const values = Object.values(reactions);

  if (!values.length) return null;

  const row = document.createElement("div");
  row.className = "mt-2 flex gap-1";

  values.forEach((emoji) => {
    const chip = document.createElement("span");
    chip.className = "px-2 py-1 rounded-full bg-black/5 text-xs";
    chip.textContent = emoji;
    row.appendChild(chip);
  });

  return row;
}