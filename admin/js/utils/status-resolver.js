// ==========================================
// STATUS RESOLVER (PDF / EXPORT)
// ==========================================

/**
 * Retourne le statut final à afficher dans le PDF
 * @param {boolean} isPresent
 * @param {string} userStatus
 * @returns {string}
 */
export function resolveStatus(isPresent, userStatus) {

  // 🔥 sécurité
  if (!userStatus) userStatus = "Actif";

  // =========================
  // CAS SUSPENDU
  // =========================
  if (userStatus === "Suspendu") {
    return isPresent ? "(S)P" : "(S)A";
  }

  // =========================
  // CAS PRÉSENT
  // =========================
  if (isPresent) {
    return "Présent";
  }

  // =========================
  // CAS ABSENT + ACTIF
  // =========================
  if (userStatus === "Actif") {
    return "Absent";
  }

  // =========================
  // CAS ABSENT + AUTRE STATUT
  // =========================
  return userStatus;
}
