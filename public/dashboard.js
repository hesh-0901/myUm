// public/js/dashboard.js


// ================= SESSION =================

const user = JSON.parse(localStorage.getItem("myum_user"));
import { db } from "../mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
if (!user) {
  window.location.href = "../users/login.html";
}

document.getElementById("usernameDisplay").textContent = user.username;



// ================= PARTICIPATION GAUGE =================

const participationCanvas = document.getElementById("participationChart");

if (participationCanvas) {

  const ctx = participationCanvas.getContext("2d");

  const participationValue = 75;


  // gradient gauge style
  const gradientGauge = ctx.createLinearGradient(0, 0, 300, 0);

  gradientGauge.addColorStop(0, "#A7EBF2");
  gradientGauge.addColorStop(0.5, "#54ACBF");
  gradientGauge.addColorStop(1, "#26658C");


  new Chart(ctx, {

    type: "doughnut",

    data: {
      datasets: [
        {
          data: [participationValue, 100 - participationValue],

          backgroundColor: [
            gradientGauge,
            "#023859"
          ],

          borderWidth: 0,

          borderRadius: 20,

          spacing: 2
        }
      ]
    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      rotation: -90,

      circumference: 180,

      cutout: "72%",

      animation: {
        duration: 1600,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }

    }

  });


  // affichage pourcentage au centre
  const label = document.getElementById("percentageLabel");

  if (label) {
    label.textContent = participationValue + "%";
  }

}




// ================= EVOLUTION CHART =================

const evolutionCanvas = document.getElementById("evolutionChart");

if (evolutionCanvas) {

  const ctx = evolutionCanvas.getContext("2d");


  const gradientLine = ctx.createLinearGradient(0, 0, 0, 220);

  gradientLine.addColorStop(0, "rgba(84,172,191,0.45)");
  gradientLine.addColorStop(1, "rgba(84,172,191,0)");


  new Chart(ctx, {

    type: "line",

    data: {

      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],

      datasets: [
        {
          data: [72, 78, 80, 85, 83, 87],

          borderColor: "#54ACBF",

          backgroundColor: gradientLine,

          tension: 0.45,

          fill: true,

          pointRadius: 0,

          borderWidth: 3
        }
      ]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      animation: {
        duration: 2000,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: { display: false }
      },

      scales: {

        y: {
          display: false,
          min: 60,
          max: 100
        },

        x: {

          grid: { display: false },

          ticks: {
            color: "#A7EBF2",
            font: { size: 11 }
          }

        }

      }

    }

  });

}
/* ============================================================
   BLOC : BADGE CHAT DASHBOARD
   Rôle :
   - Écouter le total des messages non lus
   - Mettre à jour le badge sur l’icône
============================================================ */
const dashboardChatBadge = document.getElementById("dashboardChatBadge");

window.addEventListener("myum:chat-unread-update", (event) => {
  const total = event.detail?.total || 0;

  if (!dashboardChatBadge) return;

  if (total > 0) {
    dashboardChatBadge.textContent = total > 99 ? "99+" : String(total);
    dashboardChatBadge.classList.remove("hidden");
  } else {
    dashboardChatBadge.classList.add("hidden");
  }
});

async function loadProfileCompletion(){

  const user = JSON.parse(localStorage.getItem("myum_user"));
  if(!user) return;

  const snap = await getDoc(doc(db,"users",user.id));
  if(!snap.exists()) return;

  const data = snap.data();

  const fields = [

    "genre",
    "etatCivil",
    "commune",
    "vieSeculiere",

    "typeMembre",
    "egliseProvenance",
    "anneeBapteme",
    "typeBapteme",

    "statutAffermissement",
    "responsableMinistere",

    "registreVoix",
    "groupeMusique"

  ];

  let filled = 0;

  fields.forEach(field => {

    const value = data[field];

    if(Array.isArray(value)){
      if(value.length > 0) filled++;
    }
    else if(value && value !== "" && value !== "—"){
      filled++;
    }

  });

  const percent = Math.round((filled / fields.length) * 100);

  const bar = document.getElementById("profileProgress");
  const label = document.getElementById("profilePercent");

  if(bar) bar.style.width = percent + "%";
  if(label) label.innerText = percent + "%";

}
