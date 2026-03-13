// chat/js/emoji-picker.js

/* ============================================================
   BLOC 1 : STORAGE RÉCENTS
   Rôle :
   - mémoriser les emojis récents
============================================================ */
const RECENT_KEY = "myum_recent_emojis";

function getRecentEmojis() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji) {
  if (!emoji) return;

  const current = getRecentEmojis().filter((e) => e !== emoji);
  current.unshift(emoji);
  const trimmed = current.slice(0, 12);
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
}

/* ============================================================
   BLOC 2 : HELPERS INPUT
============================================================ */
function insertAtCursor(input, textToInsert) {
  if (!input) return;

  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.substring(0, start);
  const after = input.value.substring(end);

  input.value = before + textToInsert + after;

  const newPos = start + textToInsert.length;
  input.focus();
  input.setSelectionRange(newPos, newPos);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/* ============================================================
   BLOC 3 : PICKER MESSAGE
   Rôle :
   - picker complet pour le champ message
============================================================ */
export function initMessageEmojiPicker({
  button,
  panel,
  mount,
  input
}) {
  const Picker = window.MyUmEmojiPicker;
  const data = window.MyUmEmojiData;

  if (!Picker || !data || !button || !panel || !mount || !input) return;

  let picker = null;
  let initialized = false;

  function closePanel() {
    panel.classList.add("hidden");
  }

  function openPanel() {
    panel.classList.remove("hidden");

    if (initialized) return;

    picker = new Picker({
      data,
      theme: "light",
      previewPosition: "none",
      skinTonePosition: "none",
      onEmojiSelect: (emoji) => {
        const native = emoji?.native || "";
        if (!native) return;
        insertAtCursor(input, native);
        saveRecentEmoji(native);
      }
    });

    mount.innerHTML = "";
    mount.appendChild(picker);
    initialized = true;
  }

  button.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      openPanel();
    }
  });

  document.addEventListener("click", (e) => {
    const insidePicker = panel.contains(e.target);
    const onBtn = button.contains(e.target);
    if (!insidePicker && !onBtn) {
      closePanel();
    }
  });

  input.addEventListener("focus", () => {
    closePanel();
  });

  return {
    closePanel,
    openPanel
  };
}

/* ============================================================
   BLOC 4 : PICKER RÉACTION
   Rôle :
   - picker complet pour réactions
============================================================ */
export function initReactionEmojiPicker({
  moreButton,
  panel,
  mount,
  onPick
}) {
  const Picker = window.MyUmEmojiPicker;
  const data = window.MyUmEmojiData;

  if (!Picker || !data || !moreButton || !panel || !mount) return;

  let initialized = false;

  function closePanel() {
    panel.classList.add("hidden");
  }

  function openPanel() {
    panel.classList.remove("hidden");

    if (initialized) return;

    const picker = new Picker({
      data,
      theme: "light",
      previewPosition: "none",
      skinTonePosition: "none",
      onEmojiSelect: (emoji) => {
        const native = emoji?.native || "";
        if (!native) return;
        saveRecentEmoji(native);
        onPick?.(native);
      }
    });

    mount.innerHTML = "";
    mount.appendChild(picker);
    initialized = true;
  }

  moreButton.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      openPanel();
    }
  });

  return {
    closePanel,
    openPanel
  };
}

/* ============================================================
   BLOC 5 : RÉACTIONS RAPIDES
   Rôle :
   - injecter récents + défauts
============================================================ */
export function getQuickReactionList() {
  const recents = getRecentEmojis().slice(0, 5);
  const defaults = ["👍", "❤️", "😂", "🔥", "😢"];

  const merged = [];
  [...recents, ...defaults].forEach((emoji) => {
    if (!merged.includes(emoji)) merged.push(emoji);
  });

  return merged.slice(0, 5);
}

export { saveRecentEmoji };