// =============================
// 📦 NAVIGATION STACK SYSTEM
// =============================

const STACK_KEY = "myum_navigation_stack";

/* ================= INIT ================= */

export function initNavigationTracker() {

  const currentPage = window.location.pathname + window.location.search;

  let stack = JSON.parse(sessionStorage.getItem(STACK_KEY)) || [];

  // Si stack vide → première page
  if (stack.length === 0) {
    stack.push(currentPage);
  } else {

    const lastPage = stack[stack.length - 1];

    // Éviter doublon
    if (lastPage !== currentPage) {
      stack.push(currentPage);
    }
  }

  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
}


/* ================= NAVIGATE TO ================= */

export function navigateTo(url) {

  let stack = JSON.parse(sessionStorage.getItem(STACK_KEY)) || [];

  stack.push(url);

  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));

  window.location.href = url;
}


/* ================= GO BACK ================= */

export function goBack(fallback = "/") {

  let stack = JSON.parse(sessionStorage.getItem(STACK_KEY)) || [];

  if (stack.length > 1) {

    // Retirer page actuelle
    stack.pop();

    const previousPage = stack[stack.length - 1];

    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));

    window.location.href = previousPage;

  } else {
    window.location.href = fallback;
  }
}


/* ================= RESET STACK ================= */

export function resetNavigation() {
  sessionStorage.removeItem(STACK_KEY);
}
