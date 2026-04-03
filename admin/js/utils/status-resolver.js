// ===============================
// STATUS DICTIONARY
// ===============================

// ⚠️ On ne met PAS "Actif": "P"
// Actif = état normal, pas présence

export const STATUS_MAP = {
  "Suspendu": "S",
  "En déplacement": "D",
  "Repos autorisé": "R"
};

// ===============================
// REVERSE (optionnel)
// ===============================
export const STATUS_LABEL = {
  "P": "Présent",
  "S": "Suspendu",
  "D": "En déplacement",
  "R": "Repos autorisé",
  "A": "Absent"
};

// ===============================
// CORE FUNCTION
// ===============================
export function resolveStatus(isPresent, userStatus = "Actif") {

  // ✔ Présent réel
  if (isPresent) return "P";

  // ✔ Statuts spéciaux (absence justifiée)
  if (STATUS_MAP[userStatus]) {
    return STATUS_MAP[userStatus];
  }

  // ✔ Absent simple
  return "A";
}
