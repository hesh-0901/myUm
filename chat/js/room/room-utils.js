export function formatMessageTime(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function getMessageDateKey(ts) {
  if (!ts || !ts.toDate) return "unknown";
  const d = ts.toDate();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function formatDateSeparator(ts) {
  if (!ts || !ts.toDate) return "Date inconnue";

  const d = ts.toDate();
  const now = new Date();

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diff = Math.round((startToday - startMsg) / 86400000);

  if (diff === 0) return "Aujourd’hui";
  if (diff === 1) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function renderDateSeparator(ts) {
  const wrap = document.createElement("div");
  wrap.className = "flex justify-center my-3";

  const label = document.createElement("div");
  label.className = "px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[11px]";

  label.textContent = formatDateSeparator(ts);

  wrap.appendChild(label);

  return wrap;
}