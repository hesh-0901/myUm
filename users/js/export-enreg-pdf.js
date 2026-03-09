import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);


// =======================================
// INIT PDF BUTTON
// =======================================

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



// =======================================
// GENERATE PDF
// =======================================

async function generatePDF(){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();

let y = 20;


// ============================
// USER DATA
// ============================

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;

const photoEl = document.getElementById("profilePhoto");


// ============================
// LOAD IMAGES
// ============================

const logo = await loadImageBase64("/myUm/assets/logo-myum.png");

let photo = null;

try{
photo = await loadImageBase64(photoEl.src);
}catch(e){
console.warn("Photo non chargée");
}


// ============================
// HEADER
// ============================

// logo
if(logo){
doc.addImage(logo,"PNG",15,10,40,12);
}


// header background
doc.setFillColor(230,220,210);
doc.roundedRect(10,20,pageWidth-20,40,10,10,"F");


// photo
if(photo){
doc.addImage(photo,"JPEG",15,24,30,30);
}


// name
doc.setFont("helvetica","bold");
doc.setFontSize(22);
doc.setTextColor(40,40,40);

doc.text(fullName,55,35);


// username
doc.setFont("helvetica","normal");
doc.setFontSize(12);

doc.text(username,55,43);


// fonction
doc.setFontSize(11);
doc.setTextColor(80,80,80);

doc.text(fonction,55,50);


// decorative line
doc.setFillColor(26,54,104);
doc.rect(10,65,pageWidth-20,1,"F");


y = 80;


// =======================================
// SECTION FUNCTION
// =======================================

function section(title){

doc.setFillColor(245,245,245);
doc.roundedRect(10,y-6,pageWidth-20,10,4,4,"F");

doc.setFont("helvetica","bold");
doc.setFontSize(14);
doc.setTextColor(26,54,104);

doc.text(title,15,y);

y += 10;

}



function field(label,value){

doc.setFont("helvetica","normal");
doc.setFontSize(11);
doc.setTextColor(40,40,40);

doc.text(label + " :",15,y);

doc.setFont("helvetica","bold");

doc.text(value || "—",75,y);

y += 7;

}



// =======================================
// PERSONAL INFO
// =======================================

section("Informations personnelles");

field("Genre",getField("genre"));
field("Etat civil",getField("etatCivil"));
field("Statut relationnel",getField("statutRelationnel"));
field("Vie séculière",getField("vieSeculiere"));
field("Commune",getField("commune"));
field("Avenue",getField("avenue"));

y += 3;


// =======================================
// ECCLESIASTIQUE
// =======================================

section("Informations ecclésiastiques");

field("Eglise provenance",getField("egliseProvenance"));
field("Année baptême",getField("anneeBapteme"));
field("Type baptême",getField("typeBapteme"));
field("Statut affermissement",getField("statutAffermissement"));
field("Ancienne fonction",getField("ancienneFonction"));
field("Responsable ministère",getField("responsableMinistere"));

y += 3;


// =======================================
// MUSICAL
// =======================================

section("Compétences musicales");

field("Registre voix",getField("registreVoix"));
field("Groupe musique",getField("groupeMusique"));



// =======================================
// QR CODE
// =======================================

const qrUrl = generateQR(username);

const qr = await loadImageBase64(qrUrl);

if(qr){
doc.addImage(qr,"PNG",15,270,18,18);
}



// =======================================
// FOOTER
// =======================================

doc.setDrawColor(200,200,200);
doc.line(10,268,pageWidth-10,268);

doc.setFontSize(9);
doc.setTextColor(120,120,120);

doc.text(
"Fiche membre officielle générée par MyUm",
pageWidth/2,
285,
{align:"center"}
);


// save
doc.save("fiche-membre-myum.pdf");

}



// =======================================
// GET FIELD VALUE
// =======================================

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const value = field.querySelector(".value");

if(!value) return "";

return value.innerText;

}



// =======================================
// GENERATE QR
// =======================================

function generateQR(username){

const clean = username.replace("@","");

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${clean}`;

}



// =======================================
// LOAD IMAGE BASE64 (CORS SAFE)
// =======================================

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

console.warn("Image non chargée :",url);

return null;

}

}
