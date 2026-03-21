// chat/js/room-ui.js

/* ============================================================
   DOM CENTRALISÉ (ANTI BUG)
============================================================ */
export function getRoomDom() {
  return {
    backBtn: document.getElementById("backBtn"),
    voiceCallBtn: document.getElementById("voiceCallBtn"),

    roomAvatar: document.getElementById("roomAvatar"),
    roomTitle: document.getElementById("roomTitle"),
    roomSub: document.getElementById("roomSub"),
    typingIndicator: document.getElementById("typingIndicator"),

    messagesEl: document.getElementById("messages"),
    messagesWrapper: document.getElementById("messagesWrapper"),
    emptyState: document.getElementById("emptyState"),

    messageInput: document.getElementById("messageInput"),
    sendBtn: document.getElementById("sendBtn"),
    sendBtnIcon: document.getElementById("sendBtnIcon"),

    attachBtn: document.getElementById("attachBtn"),
    emojiBtn: document.getElementById("emojiBtn"),

    replyPreview: document.getElementById("replyPreview"),
    replyPreviewText: document.getElementById("replyPreviewText"),
    cancelReplyBtn: document.getElementById("cancelReplyBtn"),

    pinnedBanner: document.getElementById("pinnedBanner"),
    pinnedPreviewText: document.getElementById("pinnedPreviewText"),
    unpinBtn: document.getElementById("unpinBtn")
  };
}

/* ============================================================
   AVATAR
============================================================ */
export function renderRoomAvatar(container, photoURL, initials = "U") {
  if (!container) return;

  container.innerHTML = "";
  container.textContent = initials;

  if (!photoURL) return;

  const img = new Image();
  img.src = photoURL;
  img.className = "w-full h-full object-cover";

  img.onload = () => {
    container.innerHTML = "";
    container.appendChild(img);
  };

  img.onerror = () => {
    container.innerHTML = initials;
  };
}

/* ============================================================
   SMART BUTTON (MIC ↔ SEND)
============================================================ */
export function bindSmartButton(dom, onSend, onRecord) {
  if (!dom.messageInput || !dom.sendBtn || !dom.sendBtnIcon) return;

  function updateIcon() {
    const hasText = dom.messageInput.value.trim().length > 0;

    if (hasText) {
      dom.sendBtnIcon.className = "bi bi-send-fill";
    } else {
      dom.sendBtnIcon.className = "bi bi-mic-fill";
    }
  }

  dom.messageInput.addEventListener("input", updateIcon);

  dom.sendBtn.addEventListener("click", () => {
    const hasText = dom.messageInput.value.trim().length > 0;

    if (hasText) {
      onSend?.();
    } else {
      onRecord?.();
    }
  });

  updateIcon();
}

/* ============================================================
   SCROLL
============================================================ */
export function scrollToBottom(dom) {
  if (!dom.messagesWrapper) return;
  dom.messagesWrapper.scrollTop = dom.messagesWrapper.scrollHeight;
}