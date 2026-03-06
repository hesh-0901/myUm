// public/js/dashboard.js


// ================= SESSION =================

const user = JSON.parse(localStorage.getItem("myum_user"));

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
