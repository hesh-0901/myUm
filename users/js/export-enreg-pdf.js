import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let userData = null;
let userId = null;

document.addEventListener("DOMContentLoaded", init);


// ===============================
// INIT
// ===============================

async function init(){

try{

const stored = localStorage.getItem("myum_user");
if(!stored) return;

const user = JSON.parse(stored);

userId = user.id;

const snap = await getDoc(doc(db,"users",userId));

if(!snap.exists()) return;

userData = snap.data();

const btn = document.getElementById("exportPdfBtn");

if(btn){
btn.addEventListener("click",generatePDF);
}

}catch(e){

console.error("Erreur init PDF :",e);

}

}


// ==========================================================
// ⚠️ SECTION CRITIQUE — GÉNÉRATION PDF
// ⚠️ NE PAS MODIFIER LA LOGIQUE PRINCIPALE
// Ce module génère le document officiel MyUm.
// Toute modification peut casser le système PDF.
// ==========================================================

async function generatePDF(){

try{

const { jsPDF } = window.jspdf;

const pdf = new jsPDF({
orientation:"portrait",
unit:"mm",
format:"a4"
});


// ======================================================
// ⚠️ SECTION CRITIQUE — NE PAS MODIFIER
// Génération du document officiel MyUm
// ======================================================


const pageWidth = 210;
const pageHeight = 297;

const sidebarWidth = 60;
const mainStart = sidebarWidth + 10;

let yMain = 40;


// ===============================
// HEADER NOM
// ===============================

const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;

pdf.setFontSize(26);
pdf.setFont(undefined,"bold");
pdf.text(fullName.toUpperCase(),mainStart,25);

pdf.setFontSize(12);
pdf.setFont(undefined,"normal");

pdf.text(
`${userData.username ? "@"+userData.username : ""}  ${userData.fonction || ""}`,
mainStart,
32
);


// ===============================
// SIDEBAR BACKGROUND
// ===============================

pdf.setFillColor(245,245,245);
pdf.rect(0,0,sidebarWidth,pageHeight,"F");


// ===============================
// PHOTO
// ===============================

const img = document.getElementById("profilePhoto");

if(img && img.complete){

const base64 = imageToBase64(img);

if(base64){
pdf.addImage(base64,"JPEG",10,20,40,40);
}

}

let ySide = 70;


// ===============================
// CONTACT
// ===============================

sidebarTitle(pdf,"CONTACT",ySide);
ySide += 10;

sideText(pdf,`ID MyUm`,ySide);
ySide += 5;

sideValue(pdf,userId,ySide);
ySide += 10;


// ===============================
// QR CODE
// ===============================

const verifyURL =
`${window.location.origin}/myUm/verify.html?uid=${userId}`;

const qr = await loadImage(
`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
);

if(qr){

pdf.addImage(qr,"PNG",10,ySide,40,40);

}

ySide += 50;


// ===============================
// DATE CREATION
// ===============================

const now = new Date();

sideText(pdf,"DOCUMENT",ySide);
ySide += 5;

sideValue(
pdf,
`${now.toLocaleDateString()}`,
ySide
);



// ===============================
// LIGNE SÉPARATION
// ===============================

pdf.setDrawColor(200,200,200);
pdf.line(mainStart,36,200,36);


// ===============================
// SECTION PROFIL
// ===============================

sectionTitle(pdf,"PROFIL",yMain);
yMain += 8;

paragraph(
pdf,
"Profil membre MyUm enregistré dans la base officielle. Document généré automatiquement contenant les informations personnelles, ecclésiastiques et musicales.",
mainStart,
yMain,
130
);

yMain += 18;


// ===============================
// INFORMATIONS PERSONNELLES
// ===============================

sectionTitle(pdf,"INFORMATIONS PERSONNELLES",yMain);
yMain += 8;

yMain = infoLine(pdf,"Genre",userData.genre,yMain);
yMain = infoLine(pdf,"Etat civil",userData.etatCivil,yMain);
yMain = infoLine(pdf,"Commune",userData.commune,yMain);
yMain = infoLine(pdf,"Avenue",userData.avenue,yMain);

yMain += 8;


// ===============================
// INFORMATIONS ECCLESIASTIQUES
// ===============================

sectionTitle(pdf,"INFORMATIONS ECCLÉSIASTIQUES",yMain);
yMain += 8;

yMain = infoLine(pdf,"Eglise",userData.egliseProvenance,yMain);
yMain = infoLine(pdf,"Année baptême",userData.anneeBapteme,yMain);

yMain += 8;


// ===============================
// MUSIQUE
// ===============================

sectionTitle(pdf,"COMPÉTENCES MUSICALES",yMain);
yMain += 8;

yMain = infoLine(pdf,"Registre vocal",userData.registreVoix,yMain);
yMain = infoLine(pdf,"Groupe",userData.groupeMusique,yMain);

yMain += 20;


// ===============================
// SIGNATURE
// ===============================

const signature = await createSignature();

pdf.setFontSize(9);

pdf.text(
`Signature numérique : ${signature}`,
mainStart,
yMain
);


// ===============================
// FOOTER
// ===============================

pdf.setFontSize(8);

pdf.text(
"Document officiel généré par MyUm",
105,
290,
{align:"center"}
);


// ===============================
// SAVE
// ===============================

pdf.save(`myum-${userData.username}.pdf`);

}catch(e){

console.error("Erreur génération PDF :",e);

}

}

// ======================================================
// ZONE IMAGES — MODIFIABLE
// Cette section gère la conversion et le chargement
// des images dans le PDF.
// ======================================================


// ===============================
// IMAGE → BASE64 (SANS CORS)
// ===============================

function imageToBase64(img){

try{

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.width = img.naturalWidth;
canvas.height = img.naturalHeight;

ctx.drawImage(img,0,0);

return canvas.toDataURL("image/jpeg");

}catch{

return null;

}

}



// ===============================
// LOAD IMAGE
// ===============================

async function loadImage(url){

try{

const res = await fetch(url);

const blob = await res.blob();

return await new Promise(resolve=>{

const reader = new FileReader();

reader.onloadend = ()=>resolve(reader.result);

reader.readAsDataURL(blob);

});

}catch{

return null;

}

}



// ===============================
// HELPERS UI PDF
// ===============================

function section(pdf,title,y){

pdf.setFontSize(13);
pdf.setFont(undefined,"bold");

pdf.text(title,20,y);

pdf.setFont(undefined,"normal");

}

function line(pdf,label,value,y){

pdf.setFontSize(11);

pdf.setTextColor(120,120,120);
pdf.text(`${label}`,20,y);

pdf.setTextColor(0,0,0);
pdf.text(value || "-",70,y);

return y+6;

}



// ===============================
// SIGNATURE
// ===============================

async function createSignature(){

const data = `${userData.username}-${userId}-${Date.now()}`;

const enc = new TextEncoder();

const buffer = await crypto.subtle.digest(
"SHA-256",
enc.encode(data)
);

const arr = Array.from(new Uint8Array(buffer));

return arr
.map(b=>b.toString(16).padStart(2,"0"))
.join("")
.substring(0,16);

}
