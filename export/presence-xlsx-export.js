import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

// ===============================
// EXPORT XLSX
// ===============================
export function exportToXLSX(data = []) {

  if (!data.length) {
    alert("Aucune donnée à exporter");
    return;
  }

  const formatted = data.map((d, i) => {

    const date = d.timestamp?.toDate();

    return {
      Index: i + 1,
      Username: d.username || "",
      Nom: d.fullName || "",
      Chorale: d.chorale || "",
      Heure: date
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "",
      Méthode: d.method === "manual" ? "Manuel" : "Radar",
      Statut:
        d.status === "justified" ? "Justifié" :
        d.status === "suspended" ? "Suspendu" :
        d.status === "special" ? "Spécial" :
        "Présent"
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Présences");

  XLSX.writeFile(workbook, "presences.xlsx");
}
