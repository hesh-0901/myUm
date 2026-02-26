// users/js/login.js

import { db } from "../../mains.js/firebase-config.js";
import { collection, query, where, getDocs }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim().toUpperCase();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        try {

            // Chercher utilisateur
            const q = query(
                collection(db, "users"),
                where("username", "==", username)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("Utilisateur introuvable.");
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Hasher mot de passe saisi
            const hashedInputPassword = await hashPassword(password);

            // Comparer hash
            if (hashedInputPassword !== userData.passwordHash) {
                alert("Mot de passe incorrect.");
                return;
            }

            // ✅ Créer session locale
            localStorage.setItem("myum_user", JSON.stringify({
                id: userDoc.id,
                username: userData.username,
                chorale: userData.chorale
            }));

            alert("Connexion réussie !");
            window.location.href = "../dashboard.html";

        } catch (error) {
            console.error(error);
            alert("Erreur lors de la connexion.");
        }

    });

});


// 🔐 Fonction SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}