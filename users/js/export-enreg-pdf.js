import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);

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

async function generatePDF(){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();

const leftX = 15;
const rightX = 110;

let yLeft = 90;
let yRight = 90;

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;
const photoEl = document.getElementById("profilePhoto");

const createdAt = new Date().toLocaleDateString("fr-FR");

const logo = await loadImageBase64("/myUm/assets/logo-myum.png");

let photo = null;
try{
photo = await loadImageBase64(photoEl.src);
}catch(e){}

const qr = await loadImageBase64(generateQR(username));

drawHeader();
drawColumns();
drawFooter();

doc.save(`fiche-membre-${username}.pdf`);


/* =========================
HEADER
========================= */

function drawHeader(){

doc.setFillColor(26,54,104);
doc.rect(0,0,pageWidth,65,"F");

doc.setFillColor(52,152,219);
doc.roundedRect(40,25,pageWidth-50,28,14,14,"F");

if(logo){
doc.addImage(logo,"PNG",15,15,35,12);
}

if(photo){

doc.setFillColor(255,255,255);
doc.circle(30,40,18,"F");

doc.addImage(photo,"JPEG",12,22,36,36);

}

doc.setFont("helvetica","bold");
doc.setFontSize(24);
doc.setTextColor(255,255,255);
doc.text(fullName,55,40);

doc.setFontSize(12);
doc.text(username,55,47);

doc.setFontSize(11);
doc.text(fonction,55,54);

}


/* =========================
LEFT COLUMN
========================= */

function drawColumns(){

sectionLeft("Informations personnelles");

fieldLeft("Genre",getField("genre"));
fieldLeft("Etat civil",getField("etatCivil"));
fieldLeft("Relation",getField("statutRelationnel"));
fieldLeft("Vie séculière",getField("vieSeculiere"));
fieldLeft("Commune",getField("commune"));
fieldLeft("Avenue",getField("avenue"));

yLeft += 5;

sectionLeft("Informations ecclésiastiques");

fieldLeft("Eglise",getField("egliseProvenance"));
fieldLeft("Année baptême",getField("anneeBapteme"));
fieldLeft("Type baptême",getField("typeBapteme"));
fieldLeft("Affermissement",getField("statutAffermissement"));
fieldLeft("Ancienne fonction",getField("ancienneFonction"));
fieldLeft("Responsable",getField("responsableMinistere"));

/* RIGHT */

sectionRight("Compétences musicales");

fieldRight("Registre voix",getField("registreVoix"));
fieldRight("Groupe musique",getField("groupeMusique"));

}


/* =========================
SECTION LEFT
========================= */

function sectionLeft(title){

doc.setFillColor(52,152,219);
doc.roundedRect(leftX,yLeft-6,85,10,6,6,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(12);
doc.setFont("helvetica","bold");

doc.text(title,leftX+5,yLeft);

yLeft += 10;

}

function fieldLeft(label,value){

doc.setTextColor(80,80,80);
doc.setFontSize(10);
doc.setFont("helvetica","normal");

doc.text(label,leftX,yLeft);

doc.setFont("helvetica","bold");

doc.text(value || "—",leftX+45,yLeft);

yLeft += 7;

}


/* =========================
SECTION RIGHT
========================= */

function sectionRight(title){

doc.setFillColor(52,152,219);
doc.roundedRect(rightX,yRight-6,85,10,6,6,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(12);
doc.setFont("helvetica","bold");

doc.text(title,rightX+5,yRight);

yRight += 10;

}

function fieldRight(label,value){

doc.setTextColor(80,80,80);
doc.setFontSize(10);
doc.setFont("helvetica","normal");

doc.text(label,rightX,yRight);

doc.setFont("helvetica","bold");

doc.text(value || "—",rightX+45,yRight);

yRight += 7;

}


/* =========================
FOOTER
========================= */

function drawFooter(){

if(qr){
doc.addImage(qr,"PNG",pageWidth-35,265,18,18);
}

doc.setDrawColor(200,200,200);
doc.line(15,260,pageWidth-15,260);

doc.setFontSize(9);
doc.setTextColor(120,120,120);

doc.text(
`Document officiel MyUm`,
pageWidth/2,
268,
{align:"center"}
);

doc.text(
`Créé par ${username} • ${createdAt}`,
pageWidth/2,
273,
{align:"center"}
);

doc.text(
`https://myum.app`,
pageWidth/2,
278,
{align:"center"}
);

}

}


/* =========================
FIELDS
========================= */

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const value = field.querySelector(".value");

if(!value) return "";

return value.innerText;

}


/* =========================
QR
========================= */

function generateQR(username){

const clean = username.replace("@","");

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${clean}`;

}


/* =========================
IMAGE BASE64
========================= */

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
