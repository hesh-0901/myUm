// Récupération utilisateur connecté
const user = JSON.parse(localStorage.getItem("myum_user"));

if (!user) {
  window.location.href = "../users/login.html";
}

document.getElementById("usernameDisplay").textContent = user.username;

// PARTICIPATION CHART
new Chart(document.getElementById("participationChart"), {
  type: "doughnut",
  data: {
    labels: ["Présence", "Absence"],
    datasets: [{
      data: [85, 15],
      backgroundColor: ["#2596D9", "#E5E7EB"],
      borderWidth: 0
    }]
  },
  options: {
    cutout: "70%",
    plugins: {
      legend: { display: false }
    }
  }
});

// DISCIPLINE CHART
new Chart(document.getElementById("disciplineChart"), {
  type: "bar",
  data: {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai"],
    datasets: [{
      label: "Score",
      data: [90, 85, 88, 92, 87],
      backgroundColor: "#3FA9F5",
      borderRadius: 10
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      y: { display: false },
      x: { display: false }
    }
  }
});
