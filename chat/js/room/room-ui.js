export function getRoomDom() {
  return {
    messagesEl: document.getElementById("messages"),
    messageInput: document.getElementById("messageInput"),
    sendBtn: document.getElementById("sendBtn"),
    sendBtnIcon: document.getElementById("sendBtnIcon")
  };
}

export function renderMessage(container, message, isMine) {
  const div = document.createElement("div");

  div.className =
    "px-3 py-2 rounded-xl text-sm max-w-[70%] break-words " +
    (isMine
      ? "bg-blue-600 text-white ml-auto"
      : "bg-gray-200 text-black");

  div.textContent = message.text || "";

  container.appendChild(div);
}

/* 🔥 SMART BUTTON */
export function bindSmartButton(input, btnIcon) {
  function update() {
    const hasText = input.value.trim().length > 0;

    btnIcon.className = hasText
      ? "bi bi-send-fill"
      : "bi bi-mic-fill";
  }

  input.addEventListener("input", update);

  update(); // init
}