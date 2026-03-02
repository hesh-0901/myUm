// users/js/register.js

import { db } from "../../mains.js/firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Anti double-submit
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Création en cours...";

    try {
      const firstName = document.getElementById("firstName").value.trim().toUpperCase();
      const lastName = document.getElementById("lastName").value.trim().toUpperCase();
      const birthday = document.getElementById("birthday").value;
      const age = parseInt(document.getElementById("age").value, 10);
      const chorale = document.getElementById("chorale").value;
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!birthday) {
        alert("Veuillez renseigner votre date de naissance.");
        return;
      }

      if (Number.isNaN(age) || age < 17) {
        alert("Vous devez avoir au minimum 17 ans.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
      }

      const date = new Date(birthday);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const username =
        firstName.substring(0, 2) +
        lastName.substring(0, 2) +
        day +
        month +
        "-" +
        chorale;

      // 🔐 Hash mot de passe SHA-256
      const passwordHash = await hashPassword(password);

      // Vérifier si username existe déjà
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert("Ce username existe déjà. Essayez de modifier légèrement votre prénom/nom ou vérifiez vos infos.");
        return;
      }

      // Ajouter dans Firestore
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

      // ✅ Message + redirection
      alert(
        "Compte créé avec succès ✅\n\nVotre username est : " +
          username +
          "\n\nVous allez être redirigé vers la page de connexion."
      );

      // (Optionnel) reset
      form.reset();

      // ✅ Redirection vers login (adapte le chemin si besoin)
      // Si ton fichier login est dans /myUm/users/login.html :
      window.location.href = "/myUm/users/login.html";
      // Sinon, utilise :
      // window.location.href = "login.html";

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du compte. Réessayez.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

// Fonction Hash SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Toggle Password
document.querySelectorAll(".togglePassword").forEach((icon) => {
  icon.addEventListener("click", function () {
    const input = this.previousElementSibling;

    if (input.type === "password") {
      input.type = "text";
      this.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      input.type = "password";
      this.classList.replace("bi-eye-slash", "bi-eye");
    }
  });
});