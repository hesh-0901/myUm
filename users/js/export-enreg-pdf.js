const { jsPDF } = window.jspdf;

function addPdfButton(){

const container = document.getElementById("header-actions");

if(!container) return;

const btn = document.createElement("button");

btn.className =
"w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition";

btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

btn.addEventListener("click",generatePDF);

container.appendChild(btn);

}



function generatePDF(){

const doc = new jsPDF();

const fullName = document.getElementById("fullName").textContent;
const username = document.getElementById("username").textContent;
const fonction = document.getElementById("userFunction").textContent;

doc.setFontSize(18);
doc.text("Fiche membre MyUm",20,20);

doc.setFontSize(12);

doc.text(`Nom : ${fullName}`,20,40);
doc.text(`Username : ${username}`,20,50);
doc.text(`Fonction : ${fonction}`,20,60);

doc.save("fiche-membre.pdf");

}



document.addEventListener("DOMContentLoaded",addPdfButton);
