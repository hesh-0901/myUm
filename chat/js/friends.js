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
        <div class="flex items-center gap-3">

          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">

            ${
              user.photoURL
              ? `<img src="${user.photoURL}" class="w-full h-full object-cover">`
              : `${(user.firstName?.charAt(0) || "")}${(user.lastName?.charAt(0) || "")}`
            }

          </div>

          <div>
            <div class="font-semibold text-sm">${escapeHtml(name)}</div>
            <div class="text-xs text-gray-500">${escapeHtml(sub)}</div>
          </div>

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
        /* =========================
   UI ACTION
   Utilité: transmettre le bouton pour gérer état (Envoi / En attente)
========================= */
       const btn = card.querySelector(".sendBtn");
       btn.addEventListener("click", () =>       sendFriendRequest(user.id, btn));
      }

      searchResults.appendChild(card);
    }

  } catch (e) {
    console.error(e);
  }


/* =========================
   SEND REQUEST (ANTI-SPAM PRO)
   Utilité scientifique:
   - Id déterministe → empêche les doublons (consistance)
   - setDoc → idempotent (clics multiples = 1 requête)
   - feedback UI → améliore UX + réduit erreurs humaines
========================= */
async function sendFriendRequest(toUserId, btn = null) {

  try {
    // UI lock (évite spam double click)
    if (btn) {
      btn.disabled = true;
      btn.classList.add("opacity-60");
      btn.textContent = "Envoi...";
    }

    // ID stable : 1 seule demande possible
    const requestId = `${uid}_${toUserId}`;

    const myReqRef = doc(db, "users", uid, "friendRequests", requestId);
    const theirReqRef = doc(db, "users", toUserId, "friendRequests", requestId);

    // Vérifier si déjà en attente
    const existsSnap = await getDoc(myReqRef);
    if (existsSnap.exists() && existsSnap.data()?.status === "pending") {
      showToast("Demande déjà envoyée ✅");
      if (btn) {
        btn.textContent = "En attente";
        btn.className = "sendBtn px-3 py-1 rounded-xl text-xs bg-yellow-200";
      }
      return;
    }

    // Écriture idempotente (ne crée pas 50 docs)
    await setDoc(myReqRef, {
      fromUserId: uid,
      toUserId,
      type: "outgoing",
      status: "pending",
      createdAt: serverTimestamp()
    });

    await setDoc(theirReqRef, {
      fromUserId: uid,
      toUserId,
      type: "incoming",
      status: "pending",
      createdAt: serverTimestamp()
    });

    showToast("Demande envoyée ✅");

    // refresh UI
    await renderIncoming();
    await renderFriends();

    if (btn) {
      btn.textContent = "En attente";
      btn.className = "sendBtn px-3 py-1 rounded-xl text-xs bg-yellow-200";
    }

  } catch (e) {
    console.error("sendFriendRequest error:", e);
    showToast("Erreur: impossible d'envoyer la demande ❌");

    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-60");
      btn.textContent = "Ajouter";
    }
  }
}


/* =========================
   INCOMING
========================= */

async function renderIncoming() {

  incomingSection.innerHTML = "";

  const col = collection(db, "users", uid, "friendRequests");

  const snap = await getDocs(
    query(
      col,
      where("type", "==", "incoming"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(30)
    )
  );

  if (snap.empty) {
    incomingSection.innerHTML = `<div class="text-sm text-gray-500">Aucune demande</div>`;
    return;
  }

  for (const docSnap of snap.docs) {

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
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">

          ${
            u.photoURL
            ? `<img src="${u.photoURL}" class="w-full h-full object-cover">`
            : `${(u.firstName?.charAt(0) || "")}${(u.lastName?.charAt(0) || "")}`
          }

        </div>

        <div class="text-sm font-semibold">${escapeHtml(name)}</div>

      </div>

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

  }

}


/* =========================
   OUTGOING
========================= */

async function renderOutgoing() {

  outgoingSection.innerHTML = "";

  const col = collection(db, "users", uid, "friendRequests");

  const snap = await getDocs(
    query(
      col,
      where("type", "==", "outgoing"),
      where("status", "==", "pending"),
      limit(30)
    )
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
      <div class="text-sm font-semibold">${escapeHtml(req.toUserName || req.toUserId)}</div>
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

  for (const docSnap of snap.docs) {

    const data = docSnap.data();
    const friendId = data.friendId || docSnap.id;

    let name = data.friendName || "";
    let photoURL = data.photoURL || null;

    // Si nom ou photo manquant → récupérer depuis users
    if (!name || !photoURL) {

      const friendSnap = await getDoc(doc(db, "users", friendId));

      if (friendSnap.exists()) {

        const u = friendSnap.data();

        name =
          `${u.firstName || ""} ${u.lastName || ""}`.trim()
          || u.username
          || friendId;

        photoURL = u.photoURL || null;
      }

    }

    const initials =
      name
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const row = document.createElement("div");

    row.className =
      "bg-gray-50 rounded-2xl p-3 flex justify-between items-center";

    row.innerHTML = `
      <div class="flex items-center gap-3">

        <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-semibold">

          ${
            photoURL
            ? `<img src="${photoURL}" class="w-full h-full object-cover">`
            : initials
          }

        </div>

        <div class="text-sm font-semibold">${escapeHtml(name)}</div>

      </div>

      <a href="room.html?uid=${encodeURIComponent(friendId)}"
      class="px-3 py-2 bg-blue-600 text-white text-xs rounded-xl">

      Chatter

      </a>
    `;

    friendsSection.appendChild(row);

  }

}


/* =========================
   ACCEPT
========================= */

async function acceptRequest(requestId, fromUserId) {

  const [meSnap, otherSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "users", fromUserId))
  ]);

  const me = meSnap.exists() ? meSnap.data() : {};
  const other = otherSnap.exists() ? otherSnap.data() : {};

  const myName =
    `${me.firstName || ""} ${me.lastName || ""}`.trim()
    || me.username
    || uid;

  const otherName =
    `${other.firstName || ""} ${other.lastName || ""}`.trim()
    || other.username
    || fromUserId;

  await setDoc(doc(db, "users", uid, "friends", fromUserId), {
    friendId: fromUserId,
    friendName: otherName,
    friendUsername: other.username || "",
    photoURL: other.photoURL || null,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, "users", fromUserId, "friends", uid), {
    friendId: uid,
    friendName: myName,
    friendUsername: me.username || "",
    photoURL: me.photoURL || null,
    createdAt: serverTimestamp()
  });

  await deleteDoc(doc(db, "users", uid, "friendRequests", requestId)).catch(()=>{});
  await deleteDoc(doc(db, "users", fromUserId, "friendRequests", requestId)).catch(()=>{});

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
