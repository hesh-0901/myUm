// public/js/dashboard.js

// Vérifier session
const user = JSON.parse(localStorage.getItem("myum_user"));
if (!user) {
  window.location.href = "../users/login.html";
}

// =========================
// 🎯 PARTICIPATION DONUT
// =========================

const participationCtx = document.getElementById("participationChart").getContext("2d");

// Gradient premium
const gradientParticipation = participationCtx.createLinearGradient(0, 0, 200, 200);
gradientParticipation.addColorStop(0, "#2596D9");
gradientParticipation.addColorStop(1, "#3FA9F5");

new Chart(participationCtx, {
  type: "doughnut",
  data: {
    datasets: [{
      data: [87, 13],
      backgroundColor: [
        gradientParticipation,
        "#E5E7EB"
      ],
      borderWidth: 0,
      hoverOffset: 6
    }]
  },
  options: {
    cutout: "78%",
    animation: {
      animateRotate: true,
      duration: 1500
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  }
});

// =========================
// 📊 DISCIPLINE BAR CHART
// =========================

const disciplineCtx = document.getElementById("disciplineChart").getContext("2d");

// Gradient vertical premium
const gradientDiscipline = disciplineCtx.createLinearGradient(0, 0, 0, 200);
gradientDiscipline.addColorStop(0, "#1A3668");
gradientDiscipline.addColorStop(1, "#3FA9F5");

new Chart(disciplineCtx, {
  type: "bar",
  data: {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
    datasets: [{
      data: [90, 85, 88, 92, 87, 94],
      backgroundColor: gradientDiscipline,
      borderRadius: 12,
      barThickness: 18
    }]
  },
  options: {
    animation: {
      duration: 1800,
      easing: "easeOutQuart"
    },
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        display: false,
        beginAtZero: true,
        max: 100
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#6B7280",
          font: { size: 11 }
        }
      }
    }
  }
});