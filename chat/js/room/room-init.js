// chat/js/room-init.js

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getRoomDom,
  renderRoomAvatar,
  bindSmartButton
} from "./room-ui.js";

/* ============================================================
   SESSION
============================================================ */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const myId = currentUser?.id;

/* ============================================================
   PARAMS
============================================================ */
const params = new URLSearchParams(window.location.search);
const friendId = params.get("uid");

/* ============================================================
   INIT GLOBAL
============================================================ */
export async function initRoomCore({
  onSendText,
  onOpenRecorder,
  onMessagesSnapshot
}) {
  const dom = getRoomDom();

  if (!myId || !friendId) {
    alert("Session invalide");
    window.location.href = "../users/login.html";
    return;
  }

  /* ================= NAV ================= */
  dom.backBtn?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  dom.voiceCallBtn?.addEventListener("click", () => {
    window.location.href = `call-voice.html?uid=${friendId}&mode=caller`;
  });

  /* ================= SMART BUTTON ================= */
  bindSmartButton(dom, onSendText, onOpenRecorder);

  /* ================= USER INFO ================= */
  await loadFriend(dom);

  /* ================= LISTENER MESSAGES ================= */
  onMessagesSnapshot?.(dom);
}

/* ============================================================
   LOAD FRIEND
============================================================ */
async function loadFriend(dom) {
  const snap = await getDoc(doc(db, "users", friendId));

  if (!snap.exists()) return;

  const u = snap.data();

  const name =
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    u.username ||
    "Utilisateur";

  dom.roomTitle.textContent = name;

  const initials =
    `${(u.firstName?.[0] || "")}${(u.lastName?.[0] || "")}`.toUpperCase() || "U";

  renderRoomAvatar(dom.roomAvatar, u.photoURL, initials);

  /* présence simple */
  dom.roomSub.textContent = "En ligne";
}