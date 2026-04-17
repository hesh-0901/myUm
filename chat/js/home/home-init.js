import { getHomeDom } from "./home-ui.js";
import { listenChats } from "./home-listener.js";

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

/* INIT */
function initHome() {
  const dom = getHomeDom();

  listenChats(myId, dom.chatList, dom.emptyState);
}

initHome();