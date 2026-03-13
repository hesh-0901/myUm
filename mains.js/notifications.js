// mains.js/notifications.js

/* ============================================================
   BLOC 1 : HELPERS SESSION
============================================================ */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("myum_user"));
  } catch {
    return null;
  }
}

/* ============================================================
   BLOC 2 : INIT
   Rôle :
   - Placeholder safe pour ton app-init
============================================================ */
export function initNotifications() {
  const me = getCurrentUser();
  if (!me?.id) return;
}

/* ============================================================
   BLOC 3 : TOAST GLOBAL
   Rôle :
   - Toast local réutilisable
   - Avec icône Bootstrap
============================================================ */
export function showToast(message, iconClass = "bi-chat-dots-fill") {
  let t = document.getElementById("myum_global_toast");

  if (!t) {
    t = document.createElement("div");
    t.id = "myum_global_toast";
    t.className =
      "fixed top-4 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-4 py-3 rounded-xl shadow-lg opacity-0 transition z-[9999] flex items-center gap-2";
    document.body.appendChild(t);
  }

  t.innerHTML = `<i class="bi ${iconClass}"></i><span>${escapeHtmlToast(message)}</span>`;
  t.style.opacity = "1";

  clearTimeout(window.__myumGlobalToastTimer);
  window.__myumGlobalToastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1800);
}

export function buildMessageNotificationPreview(message) {
  if (!message) return { text: "Nouveau message", icon: "bi-chat-dots-fill" };

  const type = message.type || "text";

  if (type === "audio") {
    const duration = message.duration ? formatSeconds(message.duration) : "0:00";
    return {
      text: `Note vocale (${duration})`,
      icon: "bi-mic-fill"
    };
  }

  if (type === "image") {
    return {
      text: "Image reçue",
      icon: "bi-image-fill"
    };
  }

  if (type === "video") {
    return {
      text: "Vidéo reçue",
      icon: "bi-camera-video-fill"
    };
  }

  if (type === "file") {
    return {
      text: "Fichier reçu",
      icon: "bi-paperclip"
    };
  }

  return {
    text: message.text || "Nouveau message",
    icon: "bi-chat-dots-fill"
  };
}

function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function escapeHtmlToast(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}