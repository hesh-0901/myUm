export function getHomeDom() {
  return {
    chatList: document.getElementById("chatList"),
    emptyState: document.getElementById("chatEmptyState")
  };
}

export function renderConversation(container, chat, myId) {
  const row = document.createElement("div");

  row.className =
    "p-3 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98]";

  const other = chat.other;

  row.innerHTML = `
    <div class="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold overflow-hidden">
      ${
        other.photoURL
          ? `<img src="${other.photoURL}" class="w-full h-full object-cover">`
          : other.initials
      }
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex justify-between">
        <div class="font-semibold text-sm truncate">${other.display}</div>
        <div class="text-xs text-gray-400">${chat.time}</div>
      </div>

      <div class="text-xs truncate text-gray-500">
        ${chat.lastMessage || "—"}
      </div>
    </div>

    ${
      chat.unread > 0
        ? `<div class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">${chat.unread}</div>`
        : ""
    }
  `;

  row.addEventListener("click", () => {
    window.location.href = `room.html?uid=${chat.otherId}`;
  });

  container.appendChild(row);
}