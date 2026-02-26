// users/js/login.js

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Erreur de connexion.");
                return;
            }

            // 🔐 Stocker le token
            localStorage.setItem("myum_token", data.token);

            alert("Connexion réussie !");

            // Redirection vers dashboard
            window.location.href = "../dashboard.html";

        } catch (error) {
            console.error("Erreur:", error);
            alert("Impossible de se connecter au serveur.");
        }
    });

});