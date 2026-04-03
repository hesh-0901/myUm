// ===============================
// STATUS DICTIONARY
// ===============================

export const STATUS_MAP = {
  "En déplacement": "D",
  "Repos autorisé": "R"
};

// ===============================
// REVERSE (optionnel)
// ===============================
export const STATUS_LABEL = {
  "P": "Présent",
  "A": "Absent",
  "D": "En déplacement",
  "R": "Repos autorisé",
  "(S)P": "Suspendu (présent)",
  "(S)A": "Suspendu (absent)"
};

// ===============================
// CORE FUNCTION
// ===============================
export function resolveStatus(isPresent, userStatus = "Actif") {

  // ===============================
  // CAS SPÉCIAL : SUSPENDU
  // ===============================
  if (userStatus === "Suspendu") {
    return isPresent ? "(S)P" : "(S)A";
  }

  // ===============================
  // PRÉSENCE NORMALE
  // ===============================
  if (isPresent) return "P";

  // ===============================
  // AUTRES STATUTS
  // ===============================
  if (STATUS_MAP[userStatus]) {
    return STATUS_MAP[userStatus];
  }

  // ===============================
  // ABSENT PAR DÉFAUT
  // ===============================
  return "A";
}
