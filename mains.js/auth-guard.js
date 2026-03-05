// mains.js/auth-guard.js

export function checkAuth() {

  // Vérifie localStorage (remember me) OU sessionStorage
  const storedUser =
    localStorage.getItem("myum_user") ||
    sessionStorage.getItem("myum_user");

  // Si aucun utilisateur trouvé → redirection login
  if (!storedUser) {
    window.location.href = "../users/login.html";
    return null;
  }

  // Retourne les informations utilisateur
  return JSON.parse(storedUser);
}
