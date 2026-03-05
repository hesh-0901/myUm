// mains.js/auth-guard.js

export function checkAuth() {

  // Vérifie session persistante OU session temporaire
  const storedUser =
    localStorage.getItem("myum_user") ||
    sessionStorage.getItem("myum_user");

  // Si aucune session → redirection vers login
  if (!storedUser) {
    window.location.href = "../users/login.html";
    return null;
  }

  let user = null;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error("Session utilisateur corrompue :", error);

    // Nettoyage sécurité
    localStorage.removeItem("myum_user");
    sessionStorage.removeItem("myum_user");

    window.location.href = "../users/login.html";
    return null;
  }

  return user;

}
