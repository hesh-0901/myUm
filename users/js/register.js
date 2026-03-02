// users/js/register.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const submitBtn = document.getElementById("registerBtn") || form?.querySelector('button[type="submit"]');

  if (!form) {
    console.error("[register.js] Form #registerForm introuvable.");
    safeToast("error", "Erreur UI", "Formulaire introuvable. Vérifie l'id registerForm.");
    return;
  }

  // Toggle password (safe)
  document.querySelectorAll(".togglePassword").forEach((icon) => {
    icon.addEventListener("click", function () {
      const input = this.previousElementSibling;
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        this.classList.replace("bi-eye", "bi-eye-slash");
      } else {
        input.type = "password";
        this.classList.replace("bi-eye-slash", "bi-eye");
      }
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // UI loading
    let oldBtnText = "";
    if (submitBtn) {
      submitBtn.disabled = true;
      oldBtnText = submitBtn.textContent;
      submitBtn.textContent = "Création en cours...";
    }

    try {
      const firstNameRaw = document.getElementById("firstName")?.value ?? "";
      const lastNameRaw = document.getElementById("lastName")?.value ?? "";
      const birthday = document.getElementById("birthday")?.value ?? "";
      const ageVal = document.getElementById("age")?.value ?? "";
      const chorale = document.getElementById("chorale")?.value ?? "";
      const phone = (document.getElementById("phone")?.value ?? "").trim();
      const password = document.getElementById("password")?.value ?? "";
      const confirmPassword = document.getElementById("confirmPassword")?.value ?? "";

      const firstName = firstNameRaw.trim().toUpperCase();
      const lastName = lastNameRaw.trim().toUpperCase();
      const age = parseInt(ageVal, 10);

      if (!firstName || !lastName) {
        safeToast("error", "Champs requis", "Veuillez renseigner votre prénom et votre nom.");
        return;
      }
      if (!birthday) {
        safeToast("error", "Champs requis", "Veuillez renseigner votre date de naissance.");
        return;
      }
      if (Number.isNaN(age) || age < 17) {
        safeToast("error", "Âge invalide", "Vous devez avoir au minimum 17 ans.");
        return;
      }
      if (!chorale) {
        safeToast("error", "Champs requis", "Veuillez sélectionner une chorale.");
        return;
      }
      if (!phone) {
        safeToast("error", "Champs requis", "Veuillez renseigner votre numéro de téléphone.");
        return;
      }
      if (!password || password.length < 6) {
        safeToast("error", "Mot de passe", "Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        safeToast("error", "Confirmation", "Les mots de passe ne correspondent pas.");
        return;
      }

      // Username
      const date = new Date(birthday);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const f2 = (firstName.substring(0, 2) || "XX");
      const l2 = (lastName.substring(0, 2) || "XX");

      const username = `${f2}${l2}${day}${month}-${chorale}`;

      // Hash password
      const passwordHash = await hashPassword(password);

      // Check username exists
      const qUser = query(collection(db, "users"), where("username", "==", username));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        safeToast(
          "error",
          "Username déjà utilisé",
          "Ce username existe déjà. Vérifie tes infos (nom/prénom/date) ou réessaie."
        );
        return;
      }

      // (Optionnel) check phone exists pour éviter doublons
      const qPhone = query(collection(db, "users"), where("phone", "==", phone));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        safeToast(
          "error",
          "Téléphone déjà utilisé",
          "Ce numéro est déjà enregistré. Connecte-toi ou contacte un responsable."
        );
        return;
      }

      // Save
      await addDoc(collection(db, "users"), {
        firstName,
        lastName,
        birthday,
        age,
        chorale,
        phone,
        username,
        passwordHash,
        createdAt: new Date()
      });

      // ✅ Success UI
      safeToast("success", "Compte créé ✅", `Ton username est : ${username}`);

      // Reset form
      form.reset();

      // Redirection (GitHub Pages friendly)
      const loginUrl = "login.html";

      // Animation overlay si dispo, sinon fallback
      if (window.MyUmUI && typeof window.MyUmUI.showJourney === "function") {
        window.MyUmUI.showJourney(username, loginUrl);
      } else {
        // fallback simple
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 1200);
      }

    } catch (err) {
      console.error("[register.js] Erreur:", err);
      safeToast("error", "Erreur", "Erreur lors de la création du compte. Ouvre la console (F12) pour voir le détail.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldBtnText || "Créer mon compte";
      }
    }
  });
});

// Hash SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Toast helper (fallback safe)
function safeToast(type, title, message) {
  if (window.MyUmUI && typeof window.MyUmUI.showToast === "function") {
    window.MyUmUI.showToast(type, title, message);
  } else {
    // Fallback: always show something
    const prefix = type === "success" ? "✅ " : type === "error" ? "❌ " : "ℹ️ ";
    alert(prefix + (title ? title + "\n" : "") + (message || ""));
  }
}