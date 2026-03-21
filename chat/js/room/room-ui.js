export function getRoomDom() {
  return {
    roomAvatar: document.getElementById("roomAvatar"),
    roomTitle: document.getElementById("roomTitle"),
    roomSub: document.getElementById("roomSub"),
    typingIndicator: document.getElementById("typingIndicator"),
    messagesEl: document.getElementById("messages"),
    messagesWrapper: document.getElementById("messagesWrapper"),
    messageInput: document.getElementById("messageInput"),
    sendBtn: document.getElementById("sendBtn"),
    sendBtnIcon: document.getElementById("sendBtnIcon")
  };
}

export function renderRoomAvatar(roomAvatar, photoURL, initials) {
  if (!roomAvatar) return;

  roomAvatar.innerHTML = "";
  roomAvatar.textContent = initials;

  if (!photoURL) return;

  const img = new Image();
  img.src = photoURL;
  img.className = "w-full h-full object-cover";

  img.onload = () => {
    roomAvatar.innerHTML = "";
    roomAvatar.appendChild(img);
  };
}

replyPreview: document.getElementById("replyPreview"),
replyPreviewText: document.getElementById("replyPreviewText"),
cancelReplyBtn: document.getElementById("cancelReplyBtn"),