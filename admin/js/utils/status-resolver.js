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

  // Présent → toujours P
  if (isPresent) return "P";

  // Absent → dépend du statut profil
  return STATUS_MAP[userStatus] || "A";
}
