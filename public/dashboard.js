// public/js/dashboard.js

// ================= SESSION =================
const user = JSON.parse(localStorage.getItem("myum_user"));
if (!user) {
  window.location.href = "../users/login.html";
}
document.getElementById("usernameDisplay").textContent = user.username;


// ================= PARTICIPATION DONUT =================

const participationCtx = document.getElementById("participationChart").getContext("2d");

// Gradient circulaire premium
const gradientParticipation = participationCtx.createLinearGradient(0, 0, 300, 300);
gradientParticipation.addColorStop(0, "#2596D9");
gradientParticipation.addColorStop(1, "#1A3668");

new Chart(participationCtx, {
  type: "doughnut",
  data: {
    datasets: [{
      data: [87, 13],
      backgroundColor: [
        gradientParticipation,
        "#EDF2F7"
      ],
      borderWidth: 0,
      hoverOffset: 0
    }]
  },
  options: {
    cutout: "82%",
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

const evolutionCtx = document.getElementById("evolutionChart").getContext("2d");

// Gradient fintech fill
const gradientEvolution = evolutionCtx.createLinearGradient(0, 0, 0, 200);
gradientEvolution.addColorStop(0, "rgba(37,150,217,0.4)");
gradientEvolution.addColorStop(1, "rgba(37,150,217,0)");

new Chart(evolutionCtx, {
  type: "line",
  data: {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
    datasets: [{
      data: [72, 78, 80, 85, 83, 87],
      borderColor: "#2596D9",
      backgroundColor: gradientEvolution,
      tension: 0.45,
      fill: true,
      pointRadius: 0,
      borderWidth: 3
    }]
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
          color: "#94A3B8",
          font: { size: 11 }
        }
      }
    }
  }
});