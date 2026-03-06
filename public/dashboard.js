// public/js/dashboard.js


// ================= SESSION =================

const user = JSON.parse(localStorage.getItem("myum_user"));

if (!user) {
  window.location.href = "../users/login.html";
}

document.getElementById("usernameDisplay").textContent = user.username;


// ================= PARTICIPATION DEMI DONUT =================

const participationCtx = document
  .getElementById("participationChart")
  .getContext("2d");


// Gradient LUNA palette
const gradientParticipation =
  participationCtx.createLinearGradient(0, 0, 300, 0);

gradientParticipation.addColorStop(0, "#A7EBF2");
gradientParticipation.addColorStop(0.5, "#54ACBF");
gradientParticipation.addColorStop(1, "#26658C");


const participationValue = 87;

new Chart(participationCtx, {

  type: "doughnut",

  data: {
    datasets: [
      {
        data: [participationValue, 100 - participationValue],

        backgroundColor: [
          gradientParticipation,
          "#023859"
        ],

        borderWidth: 0,
        hoverOffset: 0
      }
    ]
  },

  options: {

    rotation: -90,
    circumference: 180,   // demi cercle

    cutout: "78%",

    animation: {
      duration: 1800,
      easing: "easeOutCubic"
    },

    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }

  }

});


// ================= EVOLUTION LINE CHART =================

const evolutionCtx =
  document.getElementById("evolutionChart").getContext("2d");


// Gradient fintech LUNA
const gradientEvolution =
  evolutionCtx.createLinearGradient(0, 0, 0, 220);

gradientEvolution.addColorStop(0, "rgba(84,172,191,0.45)");
gradientEvolution.addColorStop(1, "rgba(84,172,191,0)");


new Chart(evolutionCtx, {

  type: "line",

  data: {

    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],

    datasets: [
      {
        data: [72, 78, 80, 85, 83, 87],

        borderColor: "#54ACBF",

        backgroundColor: gradientEvolution,

        tension: 0.45,

        fill: true,

        pointRadius: 0,

        borderWidth: 3
      }
    ]
  },

  options: {

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
