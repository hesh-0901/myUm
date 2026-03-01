// ===============================
// INFORMATIONS MODULE - MYUM
// ===============================

import { db } from "/myUm/mains.js/firebase-config.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentUserId = null;
let currentUserData = null;

// ===============================
// INIT MODULE
// ===============================
export async function initInformations() {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);

  if (!sessionUser.id) {
    console.error("User ID manquant");
    return;
  }

  currentUserId = sessionUser.id;

  await loadInformations();
  initEditableFields();
}


// ===============================
// LOAD USER DATA
// ===============================
async function loadInformations() {

  try {

    const userRef = doc(db, "users", currentUserId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.error("Utilisateur introuvable");
      return;
    }

    currentUserData = snap.data();

    setField("bio", currentUserData.bio);
    setField("phone", currentUserData.phone);
    setField("birthday", currentUserData.birthday);
    setField("age", currentUserData.age);
    setField("fonction", currentUserData.fonction);

  } catch (error) {
    console.error("Erreur chargement informations :", error);
  }

}


// ===============================
// SET FIELD VALUE
// ===============================
function setField(field, value) {

  const el = document.getElementById("info-" + field);

  if (!el) return;

  el.innerText = value || "—";

}


// ===============================
// EDITABLE FIELDS (BIO + PHONE)
// ===============================
function initEditableFields() {

  document.querySelectorAll(".edit-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      const field = btn.dataset.field;
      const valueEl = document.getElementById("info-" + field);

      if (!valueEl) return;

      // Empêche double édition
      if (valueEl.tagName === "INPUT") return;

      const currentValue =
        valueEl.innerText === "—" ? "" : valueEl.innerText;

      // Création input
      const input = document.createElement("input");
      input.type = "text";
      input.value = currentValue;
      input.className =
        "w-full mt-1 p-2 text-sm border rounded-lg focus:outline-none focus:border-primary";

      valueEl.replaceWith(input);
      input.id = "info-" + field;

      // Changer icône en check
      btn.innerHTML =
        '<i class="bi bi-check-lg text-primary"></i>';

      // Sauvegarde au second clic
      btn.addEventListener("click", async function saveHandler() {

        const newValue = input.value.trim();

        try {

          await updateDoc(doc(db, "users", currentUserId), {
            [field]: newValue
          });

          // Remettre texte
          const newText = document.createElement("p");
          newText.id = "info-" + field;
          newText.className = "text-sm mt-1";
          newText.innerText = newValue || "—";

          input.replaceWith(newText);

          // Restaurer icône pencil
          btn.innerHTML =
            '<i class="bi bi-pencil"></i>';

          // Supprimer listener save pour éviter duplication
          btn.removeEventListener("click", saveHandler);

        } catch (error) {
          console.error("Erreur mise à jour :", error);
        }

      }, { once: true });

    });

  });

}
