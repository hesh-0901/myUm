import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

document.addEventListener("DOMContentLoaded", initPdfExport);

function initPdfExport(){

const headerActions = document.getElementById("header-actions");

if(!headerActions) return;

const btn = document.createElement("button");

btn.className = `
w-9 h-9 flex items-center justify-center
rounded-full
text-gray-600
hover:bg-gray-100
transition
`;

btn.innerHTML = `<i class="bi bi-file-earmark-pdf text-lg"></i>`;

btn.addEventListener("click",generatePDF);

headerActions.appendChild(btn);

}



function generatePDF(){

const doc = new jsPDF();

const fullName = document.getElementById("fullName").innerText;
const username = document.getElementById("username").innerText;
const fonction = document.getElementById("userFunction").innerText;

const photo = document.getElementById("profilePhoto");

let y = 20;



// HEADER BACKGROUND

doc.setFillColor(215,200,180);
doc.roundedRect(10,10,190,40,8,8,"F");



// PHOTO

try{

doc.addImage(photo.src,"JPEG",15,12,35,35);

}catch(e){}



// NAME

doc.setTextColor(40,40,40);
doc.setFontSize(22);
doc.text(fullName,60,25);

doc.setFontSize(12);
doc.text(username,60,33);
doc.text(fonction,60,40);



y = 60;



// SECTION FUNCTION

function section(title){

doc.setFontSize(14);
doc.setTextColor(26,54,104);
doc.text(title,10,y);

y += 8;

}



function field(label,value){

doc.setFontSize(11);
doc.setTextColor(0,0,0);

doc.text(label + " :",10,y);
doc.text(value || "—",70,y);

y += 7;

}



// PERSONAL

section("Informations personnelles");

field("Genre",getField("genre"));
field("Etat civil",getField("etatCivil"));
field("Statut relationnel",getField("statutRelationnel"));
field("Vie séculière",getField("vieSeculiere"));
field("Commune",getField("commune"));
field("Avenue",getField("avenue"));

y += 5;



// ECCLESIASTIQUE

section("Informations ecclésiastiques");

field("Eglise provenance",getField("egliseProvenance"));
field("Année baptême",getField("anneeBapteme"));
field("Type baptême",getField("typeBapteme"));
field("Affermissement",getField("statutAffermissement"));
field("Ancienne fonction",getField("ancienneFonction"));
field("Responsable ministère",getField("responsableMinistere"));

y += 5;



// MUSIQUE

section("Compétences musicales");

field("Registre voix",getField("registreVoix"));
field("Groupe musique",getField("groupeMusique"));



doc.save("fiche-membre-myum.pdf");

}



// GET FIELD FROM PAGE

function getField(name){

const field = document.querySelector(`.field[data-field="${name}"]`);

if(!field) return "";

const val = field.querySelector(".value");

if(!val) return "";

return val.innerText;

}
