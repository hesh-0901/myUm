//partials/js/notifications.js
// ======================================
// NOTIFICATIONS MODULE
// ======================================

import { db } from "../../mains.js/firebase-config.js";

import {
collection,
query,
where,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ======================================
// LISTEN CHAT NOTIFICATIONS
// Rôle :
// - écouter toutes les conversations
// - compter les messages non lus
// - afficher le badge sur la cloche
// ======================================

export function initNotifications(userId){

if(!userId) return;

const badge = document.getElementById("notificationBadge");

if(!badge) return;


// ======================================
// QUERY CHATS
// ======================================

const q = query(
collection(db,"chats"),
where("participants","array-contains",userId)
);


// ======================================
// REALTIME LISTENER
// ======================================

onSnapshot(q,(snapshot)=>{

let totalUnread = 0;

snapshot.forEach(docSnap=>{

const chat = docSnap.data();

const unread =
chat.unreadCount?.[userId] || 0;

totalUnread += unread;

});


// ======================================
// UPDATE BADGE
// ======================================

if(totalUnread > 0){

badge.textContent = totalUnread;

badge.classList.remove("hidden");

}else{

badge.classList.add("hidden");

}

});

}
