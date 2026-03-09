import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);

/* ===============================
INIT BUTTON
=============================== */

function initPdfExport(){

const container = document.getElementById("header-actions");
if(!container) return;

const btn = document.createElement("button");

btn.className =
"w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition";

btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

btn.addEventListener("click", generatePDF);

container.appendChild(btn);

}

/* ===============================
MAIN PDF
=============================== */

async function generatePDF(){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();

const leftSidebar = 70;

let yLeft = 85;
let yRight = 85;

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;
const photoEl = document.getElementById("profilePhoto");

const createdAt = new Date().toLocaleDateString("fr-FR");

/* ===============================
IMAGES
=============================== */

const logo = await loadImageBase64("/myUm/assets/logo-myum.png");

let photo = null;

try{
photo = await loadImageBase64(photoEl.src);
}catch(e){}

const qr = await loadImageBase64(generateQR(username));

/* ===============================
HEADER
=============================== */

doc.setFillColor(26,54,104);
doc.rect(0,0,pageWidth,60,"F");

doc.setFillColor(52,152,219);
doc.roundedRect(45,22,pageWidth-55,25,12,12,"F");

if(logo){
doc.addImage(logo,"PNG",15,15,35,12);
}

if(photo){

doc.setFillColor(255,255,255);
doc.circle(30,35,18,"F");

doc.addImage(photo,"JPEG",12,17,36,36);

}

doc.setTextColor(255,255,255);
doc.setFont("helvetica","bold");
doc.setFontSize(24);

doc.text(fullName,60,35);

doc.setFontSize(12);
doc.text(username,60,43);

doc.setFontSize(11);
doc.text(fonction,60,50);

/* ===============================
SIDEBAR
=============================== */

doc.setFillColor(240,244,248);
doc.rect(0,60,leftSidebar,230,"F");

/* ===============================
SECTION PERSONAL
=============================== */

sectionLeft("Profil personnel");

fieldLeft("Genre",getField("genre"));
fieldLeft("Etat civil",getField("etatCivil"));
fieldLeft("Relation",getField("statutRelationnel"));
fieldLeft("Vie séculière",getField("vieSeculiere"));
fieldLeft("Commune",getField("commune"));
fieldLeft("Avenue",getField("avenue"));

yLeft += 5;

sectionLeft("Infos église");

fieldLeft("Eglise",getField("egliseProvenance"));
fieldLeft("Année baptême",getField("anneeBapteme"));
fieldLeft("Type baptême",getField("typeBapteme"));
fieldLeft("Affermissement",getField("statutAffermissement"));
fieldLeft("Ancienne fonction",getField("ancienneFonction"));
fieldLeft("Responsable",getField("responsableMinistere"));

/* ===============================
RIGHT SIDE
=============================== */

sectionRight("Compétences musicales");

fieldRight("Registre voix",getField("registreVoix"));
fieldRight("Groupe musique",getField("groupeMusique"));

/* ===============================
QR
=============================== */

if(qr){
doc.addImage(qr,"PNG",pageWidth-35,265,20,20);
}

/* ===============================
FOOTER
=============================== */

doc.setDrawColor(200,200,200);
doc.line(15,260,pageWidth-15,260);

doc.setFontSize(9);
doc.setTextColor(120,120,120);

doc.text(`Document officiel MyUm`,pageWidth/2,268,{align:"center"});
doc.text(`Créé par ${username} • ${createdAt}`,pageWidth/2,273,{align:"center"});
doc.text(`https://myum.app`,pageWidth/2,278,{align:"center"});

/* ===============================
SAVE
=============================== */

doc.save(`fiche-membre-${username}.pdf`);


/* ===============================
LEFT COLUMN
=============================== */

function sectionLeft(title){

doc.setFont("helvetica","bold");
doc.setFontSize(12);
doc.setTextColor(26,54,104);

doc.text(title,10,yLeft);

doc.setDrawColor(52,152,219);
doc.line(10,yLeft+2,60,yLeft+2);

yLeft += 8;

}

function fieldLeft(label,value){

doc.setFontSize(9);
doc.setTextColor(90,90,90);

doc.text(label,10,yLeft);

doc.setFont("helvetica","bold");

doc.text(value || "—",10,yLeft+4);

doc.setFont("helvetica","normal");

yLeft += 10;

}

/* ===============================
RIGHT COLUMN
=============================== */

function sectionRight(title){

doc.setFont("helvetica","bold");
doc.setFontSize(14);
doc.setTextColor(26,54,104);

doc.text(title,leftSidebar+15,yRight);

doc.setDrawColor(52,152,219);
doc.line(leftSidebar+15,yRight+2,pageWidth-20,yRight+2);

yRight += 12;

}

function fieldRight(label,value){

doc.setFontSize(11);

doc.setTextColor(120,120,120);

doc.text(label,leftSidebar+15,yRight);

doc.setFont("helvetica","bold");
doc.setTextColor(40,40,40);

doc.text(value || "—",leftSidebar+70,yRight);

doc.setFont("helvetica","normal");

yRight += 10;

}

}

/* ===============================
FIELDS
=============================== */

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const value = field.querySelector(".value");

if(!value) return "";

return value.innerText;

}

/* ===============================
QR
=============================== */

function generateQR(username){

const clean = username.replace("@","");

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${clean}`;

}

/* ===============================
IMAGE BASE64
=============================== */

async function loadImageBase64(url){

try{

const response = await fetch(url,{mode:"cors"});

const blob = await response.blob();

return await new Promise(resolve=>{

const reader = new FileReader();

reader.onloadend = ()=> resolve(reader.result);

reader.readAsDataURL(blob);

});

}catch(e){

return null;

}

}
