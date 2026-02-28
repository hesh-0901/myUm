// mains.js/auth-guard.js

export function checkAuth() {

  const storedUser = localStorage.getItem("myum_user");

  if (!storedUser) {
    window.location.href = "../users/login.html";
    return null;
  }

  return JSON.parse(storedUser);
}
