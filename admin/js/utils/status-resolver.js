// ===============================
// STATUS DICTIONARY
// ===============================

export const STATUS_MAP = {
  "Actif": "P",
  "Suspendu": "S",
  "En déplacement": "D",
  "Repos autorisé": "R",
  "Absent": "A"
};

// ===============================
// REVERSE (optionnel)
// ===============================
export const STATUS_LABEL = {
  "P": "Actif",
  "S": "Suspendu",
  "D": "En déplacement",
  "R": "Repos autorisé",
  "A": "Absent"
};

// ===============================
// CORE FUNCTION
// ===============================
export function resolveStatus(isPresent, userStatus = "Actif") {

  // ✔ présent réel
  if (isPresent) return "P";

  // ✔ statuts spéciaux
  if (STATUS_MAP[userStatus]) {
    return STATUS_MAP[userStatus];
  }

  // ✔ absent normal
  return "A";
}
