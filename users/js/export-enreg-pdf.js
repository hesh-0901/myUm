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

let y = 20;



// ======================
// LOGO
// ======================

try{

doc.addImage("/myUm/assets/logo-myum.png","PNG",15,10,25,10);

}catch(e){}



// ======================
// USER INFO
// ======================

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;
const photo = document.getElementById("profilePhoto");



// HEADER BACKGROUND

doc.setFillColor(230,220,210);
doc.roundedRect(10,15,pageWidth-20,35,8,8,"F");



// PHOTO

try{

doc.addImage(photo.src,"JPEG",15,18,30,30);

}catch(e){}



// NAME

doc.setFontSize(22);
doc.setTextColor(40,40,40);

doc.text(fullName,55,28);

doc.setFontSize(12);
doc.text(username,55,36);
doc.text(fonction,55,43);

y = 65;



// ======================
// SECTION FUNCTION
// ======================

function section(title){

doc.setFillColor(240,240,240);
doc.roundedRect(10,y-5,pageWidth-20,10,4,4,"F");

doc.setFontSize(14);
doc.setTextColor(26,54,104);

doc.text(title,15,y+1);

y += 12;

}



function field(label,value){

doc.setFontSize(11);
doc.setTextColor(0,0,0);

doc.text(label + " :",15,y);

doc.text(value || "—",80,y);

y += 7;

}



// ======================
// PERSONAL
// ======================

section("Informations personnelles");

field("Genre",getField("genre"));
field("Etat civil",getField("etatCivil"));
field("Statut relationnel",getField("statutRelationnel"));
field("Vie séculière",getField("vieSeculiere"));
field("Commune",getField("commune"));
field("Avenue",getField("avenue"));

y += 4;



// ======================
// ECCLESIASTIQUE
// ======================

section("Informations ecclésiastiques");

field("Eglise provenance",getField("egliseProvenance"));
field("Année baptême",getField("anneeBapteme"));
field("Type baptême",getField("typeBapteme"));
field("Affermissement",getField("statutAffermissement"));
field("Fonction ancienne église",getField("ancienneFonction"));
field("Responsable ministère",getField("responsableMinistere"));

y += 4;



// ======================
// MUSIQUE
// ======================

section("Compétences musicales");

field("Registre voix",getField("registreVoix"));
field("Groupe musique",getField("groupeMusique"));



// ======================
// FOOTER
// ======================

doc.setDrawColor(200,200,200);
doc.line(10,280,pageWidth-10,280);

doc.setFontSize(9);
doc.setTextColor(120,120,120);

doc.text(
"Fiche membre officielle générée par MyUm",
pageWidth/2,
286,
{align:"center"}
);



doc.save("fiche-membre-myum.pdf");

}



// ======================
// GET FIELD
// ======================

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const value = field.querySelector(".value");

if(!value) return "";

return value.innerText;

}
