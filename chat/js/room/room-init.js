import { getRoomDom, bindSmartButton } from "./room-ui.js";
import { sendMessage } from "./room-service.js";
import { listenMessages } from "./room-listener.js";

/* SESSION */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const user = getUser();
const myId = user?.id;

if (!myId) {
  alert("Session invalide");
  location.href = "../../users/login.html";
}

/* PARAMS */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

if (!friendId) {
  alert("Aucun utilisateur");
  history.back();
}

/* INIT */
function initRoom() {
  const dom = getRoomDom();

  // 🔥 smart button
  bindSmartButton(dom.messageInput, dom.sendBtnIcon);

  // envoyer message
  dom.sendBtn.addEventListener("click", () => {
    sendMessage(myId, friendId, dom.messageInput);
  });

  dom.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage(myId, friendId, dom.messageInput);
    }
  });

  // écouter messages
  listenMessages(myId, friendId, dom.messagesEl);
}

initRoom();