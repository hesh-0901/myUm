import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);


// ==============================
// INIT PDF BUTTON
// ==============================

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



// ==============================
// GENERATE PDF
// ==============================

async function generatePDF(){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();

const leftCol = 95;

let yLeft = 80;
let yRight = 80;



// ==============================
// USER DATA
// ==============================

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;

const photoEl = document.getElementById("profilePhoto");

const createdAt = new Date().toLocaleDateString("fr-FR");



// ==============================
// LOAD IMAGES
// ==============================

const logo = await loadImageBase64("/myUm/assets/logo-myum.png");

let photo = null;

try{
photo = await loadImageBase64(photoEl.src);
}catch(e){}



const qrUrl = generateQR(username);
const qr = await loadImageBase64(qrUrl);



// ==============================
// HEADER BACKGROUND
// ==============================

doc.setFillColor(26,54,104);
doc.rect(0,0,pageWidth,60,"F");



// ==============================
// HEADER CARD
// ==============================

doc.setFillColor(37,150,217);
doc.roundedRect(40,20,pageWidth-50,25,12,12,"F");



// ==============================
// LOGO
// ==============================

if(logo){
doc.addImage(logo,"PNG",15,15,40,12);
}



// ==============================
// PHOTO
// ==============================

if(photo){

doc.setFillColor(255,255,255);
doc.circle(30,32,18,"F");

doc.addImage(photo,"JPEG",12,14,36,36);

}



// ==============================
// NAME
// ==============================

doc.setFont("helvetica","bold");
doc.setFontSize(24);
doc.setTextColor(255,255,255);

doc.text(fullName,55,33);



doc.setFontSize(12);
doc.text(username,55,41);



doc.setFontSize(11);
doc.text(fonction,55,48);



// ==============================
// SECTION LEFT
// ==============================

function sectionLeft(title){

doc.setFillColor(37,150,217);
doc.roundedRect(10,yLeft-6,leftCol-15,10,5,5,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(12);

doc.text(title,15,yLeft);

yLeft += 10;

}



function fieldLeft(label,value){

doc.setTextColor(50,50,50);
doc.setFontSize(10);

doc.text(label,15,yLeft);

doc.setFont("helvetica","bold");
doc.text(value || "—",55,yLeft);

doc.setFont("helvetica","normal");

yLeft += 7;

}



// ==============================
// SECTION RIGHT
// ==============================

function sectionRight(title){

doc.setFillColor(37,150,217);
doc.roundedRect(leftCol,yRight-6,pageWidth-leftCol-10,10,5,5,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(12);

doc.text(title,leftCol+5,yRight);

yRight += 10;

}



function fieldRight(label,value){

doc.setTextColor(50,50,50);
doc.setFontSize(10);

doc.text(label,leftCol+5,yRight);

doc.setFont("helvetica","bold");
doc.text(value || "—",leftCol+55,yRight);

doc.setFont("helvetica","normal");

yRight += 7;

}



// ==============================
// PERSONAL
// ==============================

sectionLeft("Informations personnelles");

fieldLeft("Genre",getField("genre"));
fieldLeft("Etat civil",getField("etatCivil"));
fieldLeft("Relation",getField("statutRelationnel"));
fieldLeft("Vie séculière",getField("vieSeculiere"));
fieldLeft("Commune",getField("commune"));
fieldLeft("Avenue",getField("avenue"));



// ==============================
// ECCLESIASTIQUE
// ==============================

sectionLeft("Informations ecclésiastiques");

fieldLeft("Eglise",getField("egliseProvenance"));
fieldLeft("Année baptême",getField("anneeBapteme"));
fieldLeft("Type baptême",getField("typeBapteme"));
fieldLeft("Affermissement",getField("statutAffermissement"));
fieldLeft("Ancienne fonction",getField("ancienneFonction"));
fieldLeft("Responsable",getField("responsableMinistere"));



// ==============================
// MUSICAL
// ==============================

sectionRight("Compétences musicales");

fieldRight("Registre voix",getField("registreVoix"));
fieldRight("Groupe musique",getField("groupeMusique"));



// ==============================
// QR CODE
// ==============================

if(qr){

doc.addImage(qr,"PNG",pageWidth-35,265,18,18);

}



// ==============================
// FOOTER
// ==============================

doc.setDrawColor(200,200,200);
doc.line(10,260,pageWidth-10,260);

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



// ==============================
// SAVE
// ==============================

doc.save(`fiche-membre-${username}.pdf`);

}



// ==============================
// GET FIELD
// ==============================

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const value = field.querySelector(".value");

if(!value) return "";

return value.innerText;

}



// ==============================
// GENERATE QR
// ==============================

function generateQR(username){

const clean = username.replace("@","");

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${clean}`;

}



// ==============================
// LOAD IMAGE BASE64
// ==============================

async function loadImageBase64(url){

try{

const response = await fetch(url,{mode:"cors"});

const blob = await response.blob();

return await new Promise(resolve=>{

const reader = new FileReader();

reader.onloadend = () => resolve(reader.result);

reader.readAsDataURL(blob);

});

}catch(e){

return null;

}

}
