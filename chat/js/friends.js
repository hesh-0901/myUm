// chat/js/friends.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   SESSION
========================= */

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

const currentUser = getCurrentUser();
const uid = currentUser?.id;

if (!uid) {
  alert("Session invalide. Veuillez vous reconnecter.");
  window.location.href = "../users/login.html";
}

/* =========================
   DOM
========================= */

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchModal = document.getElementById("searchModal");
const closeSearchModal = document.getElementById("closeSearchModal");

const incomingSection = document.getElementById("incomingSection");
const outgoingSection = document.getElementById("outgoingSection");
const friendsSection = document.getElementById("friendsSection");

const tabIncoming = document.getElementById("tabIncoming");
const tabOutgoing = document.getElementById("tabOutgoing");
const tabFriends = document.getElementById("tabFriends");

/* =========================
   INIT
========================= */

init();

async function init() {

  switchTab("incoming");

  tabIncoming?.addEventListener("click", () => switchTab("incoming"));
  tabOutgoing?.addEventListener("click", () => switchTab("outgoing"));
  tabFriends?.addEventListener("click", () => switchTab("friends"));

  searchInput?.addEventListener(
    "input",
    debounce(() => {
      const v = normalizeTerm(searchInput.value);
      if (v.length >= 2) {
        searchModal.classList.remove("hidden");
        onSearch();
      }
    }, 250)
  );

  closeSearchModal?.addEventListener("click", () => {
    searchModal.classList.add("hidden");
  });

  await renderIncoming();
  await renderOutgoing();
  await renderFriends();
}

/* =========================
   TABS
========================= */

function switchTab(tab) {

  incomingSection.classList.add("hidden");
  outgoingSection.classList.add("hidden");
  friendsSection.classList.add("hidden");

  tabIncoming.classList.remove("bg-primary", "text-white");
  tabOutgoing.classList.remove("bg-primary", "text-white");
  tabFriends.classList.remove("bg-primary", "text-white");

  if (tab === "incoming") {
    incomingSection.classList.remove("hidden");
    tabIncoming.classList.add("bg-primary", "text-white");
  }

  if (tab === "outgoing") {
    outgoingSection.classList.remove("hidden");
    tabOutgoing.classList.add("bg-primary", "text-white");
  }

  if (tab === "friends") {
    friendsSection.classList.remove("hidden");
    tabFriends.classList.add("bg-primary", "text-white");
  }
}

/* =========================
   SEARCH
========================= */

async function onSearch() {

  const term = normalizeTerm(searchInput.value);
  searchResults.innerHTML = "";

  if (!term) return;

  const usersRef = collection(db, "users");
  const termUpper = term.toUpperCase();

  try {

    const qUsername = query(
      usersRef,
      where("username", ">=", termUpper),
      where("username", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const qFirst = query(
      usersRef,
      where("firstName", ">=", termUpper),
      where("firstName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const qLast = query(
      usersRef,
      where("lastName", ">=", termUpper),
      where("lastName", "<=", termUpper + "\uf8ff"),
      limit(10)
    );

    const qPhone = query(
      usersRef,
      where("phone", "==", term),
      limit(10)
    );

    const [a, b, c, d] = await Promise.all([
      getDocs(qUsername),
      getDocs(qFirst),
      getDocs(qLast),
      getDocs(qPhone)
    ]);

    const found = new Map();

    a.forEach(x => found.set(x.id, { id: x.id, ...x.data() }));
    b.forEach(x => found.set(x.id, { id: x.id, ...x.data() }));
    c.forEach(x => found.set(x.id, { id: x.id, ...x.data() }));
    d.forEach(x => found.set(x.id, { id: x.id, ...x.data() }));

    if (found.size === 0) {
      searchResults.innerHTML = `<div class="text-sm text-gray-500">Aucun utilisateur trouvé</div>`;
      return;
    }

    for (const user of found.values()) {

      if (user.id === uid) continue;

      const alreadyFriend = await isFriend(uid, user.id);
      const pending = await hasPendingRequest(uid, user.id);

      const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.username ||
        "Utilisateur";

      const sub =
        user.username ? `@${user.username}` :
        user.phone || "";

      const card = document.createElement("div");

      card.className =
        "bg-gray-50 rounded-2xl p-4 flex justify-between items-center shadow-sm";

      card.innerHTML = `
        <div>
          <div class="font-semibold text-sm">${escapeHtml(name)}</div>
          <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
        </div>

        <button class="addBtn px-3 py-2 rounded-xl text-xs font-semibold
        ${alreadyFriend ? "bg-gray-300 text-gray-600" :
        pending ? "bg-yellow-200 text-yellow-900" :
        "bg-blue-600 text-white"}"
        ${alreadyFriend || pending ? "disabled" : ""}>

        ${alreadyFriend ? "Ami" : pending ? "En attente" : "Ajouter"}

        </button>
      `;

      if (!alreadyFriend && !pending) {
        card.querySelector(".addBtn")
          .addEventListener("click", () => sendFriendRequest(user.id));
      }

      searchResults.appendChild(card);
    }

  } catch (e) {
    console.error(e);
  }
}

/* =========================
   SEND REQUEST
========================= */

async function sendFriendRequest(toUserId) {

  const myRequests = collection(db, "users", uid, "friendRequests");
  const theirRequests = collection(db, "users", toUserId, "friendRequests");

  const newReq = await addDoc(myRequests, {
    fromUserId: uid,
    toUserId,
    type: "outgoing",
    status: "pending",
    createdAt: serverTimestamp()
  });

  await setDoc(doc(theirRequests, newReq.id), {
    fromUserId: uid,
    toUserId,
    type: "incoming",
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Demande envoyée");

  await renderIncoming();
  await renderOutgoing();
}

/* =========================
   INCOMING
========================= */

async function renderIncoming() {

  incomingSection.innerHTML = "";

  const col = collection(db, "users", uid, "friendRequests");

  const snap = await getDocs(
    query(col,
      where("type", "==", "incoming"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30))
  );

  if (snap.empty) {
    incomingSection.innerHTML = `<div class="text-sm text-gray-500">Aucune demande</div>`;
    return;
  }

  snap.forEach(async docSnap => {

    const req = docSnap.data();

    const fromSnap = await getDoc(doc(db, "users", req.fromUserId));

    const u = fromSnap.exists() ? fromSnap.data() : {};

    const name =
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      u.username ||
      req.fromUserId;

    const row = document.createElement("div");

    row.className =
      "bg-gray-50 rounded-2xl p-3 flex justify-between items-center";

    row.innerHTML = `
      <div class="text-sm font-semibold">${escapeHtml(name)}</div>

      <div class="flex gap-2">
        <button class="accept px-3 py-2 text-xs bg-green-600 text-white rounded-xl">Accepter</button>
        <button class="reject px-3 py-2 text-xs bg-gray-200 rounded-xl">Refuser</button>
      </div>
    `;

    row.querySelector(".accept")
      .addEventListener("click", () =>
        acceptRequest(docSnap.id, req.fromUserId)
      );

    row.querySelector(".reject")
      .addEventListener("click", () =>
        rejectRequest(docSnap.id, req.fromUserId)
      );

    incomingSection.appendChild(row);

  });
}

/* =========================
   OUTGOING
========================= */

async function renderOutgoing() {

  outgoingSection.innerHTML = "";

  const col = collection(db, "users", uid, "friendRequests");

  const snap = await getDocs(
    query(col,
      where("type", "==", "outgoing"),
      where("status", "==", "pending"),
      limit(30))
  );

  if (snap.empty) {
    outgoingSection.innerHTML = `<div class="text-sm text-gray-500">Aucune demande envoyée</div>`;
    return;
  }

  snap.forEach(docSnap => {

    const req = docSnap.data();

    const row = document.createElement("div");

    row.className =
      "bg-gray-50 rounded-2xl p-3 flex justify-between items-center";

    row.innerHTML = `
      <div class="text-sm font-semibold">${req.toUserId}</div>
      <span class="text-xs text-yellow-600">En attente</span>
    `;

    outgoingSection.appendChild(row);

  });
}

/* =========================
   FRIENDS
========================= */

async function renderFriends() {

  friendsSection.innerHTML = "";

  const col = collection(db, "users", uid, "friends");

  const snap = await getDocs(query(col, limit(60)));

  if (snap.empty) {
    friendsSection.innerHTML = `<div class="text-sm text-gray-500">Aucun ami</div>`;
    return;
  }

  snap.forEach(docSnap => {

    const data = docSnap.data();
    const friendId = data.friendId || docSnap.id;

    const row = document.createElement("div");

    row.className =
      "bg-gray-50 rounded-2xl p-3 flex justify-between items-center";

    row.innerHTML = `
      <div class="text-sm font-semibold">${escapeHtml(data.friendName || friendId)}</div>

      <a href="room.html?uid=${encodeURIComponent(friendId)}"
      class="px-3 py-2 bg-blue-600 text-white text-xs rounded-xl">

      Chatter

      </a>
    `;

    friendsSection.appendChild(row);

  });
}

/* =========================
   ACCEPT
========================= */

async function acceptRequest(requestId, fromUserId) {

  await setDoc(doc(db, "users", uid, "friends", fromUserId), {
    friendId: fromUserId,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", uid), {
    friendId: uid,
    createdAt: serverTimestamp()
  });

  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId));
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId));

  await renderIncoming();
  await renderFriends();
}

/* =========================
   REJECT
========================= */

async function rejectRequest(requestId, fromUserId) {

  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId));
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId));

  await renderIncoming();
}

/* =========================
   HELPERS
========================= */

async function isFriend(a, b) {
  return (await getDoc(doc(db, "users", a, "friends", b))).exists();
}

async function hasPendingRequest(from, to) {
  const snap = await getDocs(
    query(
      collection(db, "users", from, "friendRequests"),
      where("toUserId", "==", to),
      where("status", "==", "pending"),
      limit(1)
    )
  );
  return !snap.empty;
}

function normalizeTerm(v) {
  return String(v).replace(/\s+/g, " ").trim();
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}
