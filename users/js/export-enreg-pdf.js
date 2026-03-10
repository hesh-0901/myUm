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

let y = 20;


// ===============================
// HEADER BAR (STYLE CV)
// ===============================

pdf.setFillColor(26,54,104);
pdf.rect(0,0,210,22,"F");

pdf.setFontSize(16);
pdf.setTextColor(255,255,255);
pdf.text("MYUM PROFILE",105,13,{align:"center"});

pdf.setTextColor(0,0,0);


// ===============================
// LOGO
// ===============================

const logo = await loadImage("/myUm/assets/logo-myum.png");

if(logo){
pdf.addImage(logo,"PNG",160,25,30,12);
}


// ===============================
// PHOTO UTILISATEUR
// ===============================

const img = document.getElementById("profilePhoto");

if(img && img.complete){

const base64 = imageToBase64(img);

if(base64){
pdf.addImage(base64,"JPEG",20,30,35,35);
}

}


// ===============================
// NOM UTILISATEUR (STYLE CV)
// ===============================

const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;

pdf.setFontSize(20);
pdf.setFont(undefined,"bold");

pdf.text(fullName,70,35);

pdf.setFontSize(12);
pdf.setFont(undefined,"normal");

pdf.text(`@${userData.username || ""}`,70,42);

if(userData.fonction){

pdf.text(userData.fonction,70,48);

}

pdf.setFontSize(10);
pdf.text(`ID MyUm : ${userId}`,70,54);


// ===============================
// LIGNE SÉPARATION
// ===============================

pdf.setDrawColor(220,220,220);
pdf.line(20,60,190,60);

y = 70;


// ===============================
// INFOS PERSONNELLES
// ===============================

section(pdf,"Informations personnelles",y);

y += 8;

y = line(pdf,"Genre",userData.genre,y);
y = line(pdf,"Etat civil",userData.etatCivil,y);
y = line(pdf,"Commune",userData.commune,y);
y = line(pdf,"Avenue",userData.avenue,y);

y += 6;


// ===============================
// INFOS ECCLESIASTIQUES
// ===============================

section(pdf,"Informations ecclésiastiques",y);

y += 8;

y = line(pdf,"Eglise",userData.egliseProvenance,y);
y = line(pdf,"Année baptême",userData.anneeBapteme,y);

y += 6;


// ===============================
// MUSIQUE
// ===============================

section(pdf,"Compétences musicales",y);

y += 8;

y = line(pdf,"Registre",userData.registreVoix,y);
y = line(pdf,"Groupe",userData.groupeMusique,y);

y += 12;


// ===============================
// DATE CREATION
// ===============================

const now = new Date();

pdf.setFontSize(9);

pdf.text(
`Créé le ${now.toLocaleDateString()} à ${now.toLocaleTimeString()}`,
20,
y
);

y += 6;


// ===============================
// SIGNATURE NUMERIQUE
// ===============================

const signature = await createSignature();

pdf.text(
`Signature numérique : ${signature}`,
20,
y
);

y += 10;


// ===============================
// QR CODE
// ===============================

const verifyURL =
`${window.location.origin}/myUm/verify.html?uid=${userId}`;

const qr = await loadImage(
`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
);

if(qr){
pdf.addImage(qr,"PNG",150,y-5,35,35);
}

y += 30;


// ===============================
// FOOTER
// ===============================

pdf.setDrawColor(220,220,220);
pdf.line(20,270,190,270);

pdf.setFontSize(8);

pdf.text(
"Document officiel généré par MyUm",
105,
280,
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
