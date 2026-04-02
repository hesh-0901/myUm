export function getRoomDom() {
  return {
    messagesEl: document.getElementById("messages"),
    messageInput: document.getElementById("messageInput"),
    sendBtn: document.getElementById("sendBtn")
  };
}

export function renderMessage(container, message, isMine) {
  const div = document.createElement("div");

  div.className =
    "px-3 py-2 rounded-xl text-sm max-w-[70%] " +
    (isMine
      ? "bg-blue-600 text-white ml-auto"
      : "bg-gray-200 text-black");

  div.textContent = message.text || "";

  container.appendChild(div);
}