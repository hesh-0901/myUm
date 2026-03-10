import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let userData = null;
let userId = null;

document.addEventListener("DOMContentLoaded", init);


// ======================================================
// INIT
// ======================================================

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



// ======================================================
// ⚠️ SECTION CRITIQUE — GÉNÉRATION PDF
// ⚠️ NE PAS MODIFIER
// Cette section génère le document officiel MyUm.
// Toute modification peut casser l'export PDF.
// ======================================================
async function generatePDF(){

try{

const { jsPDF } = window.jspdf;

const pdf = new jsPDF({
orientation:"portrait",
unit:"mm",
format:"a4"
});

const sidebarWidth = 70;
const mainStart = sidebarWidth + 10;

let yMain = 45;
let ySide = 110;


// ===============================
// SIDEBAR BACKGROUND
// ===============================

pdf.setFillColor(248,248,248);
pdf.rect(0,0,sidebarWidth,297,"F");


// ===============================
// PHOTO PROFIL (GRANDE)
// ===============================

const img = document.getElementById("profilePhoto");

if(img && img.complete){

const base64 = imageToBase64(img);

if(base64){

pdf.addImage(base64,"JPEG",15,20,40,40);

}

}


// ===============================
// NOM + USERNAME
// ===============================

const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;

pdf.setFontSize(26);
pdf.setFont(undefined,"bold");

pdf.text(fullName.toUpperCase(),mainStart,25);

pdf.setFontSize(12);
pdf.setFont(undefined,"normal");

pdf.text(
`${userData.fonction || ""}  |  @${userData.username || ""}`,
mainStart,
32
);


// ===============================
// BIO
// ===============================

if(userData.bio){

sectionTitle(pdf,"PROFIL",yMain);

yMain += 8;

paragraph(
pdf,
userData.bio,
mainStart,
yMain,
120
);

yMain += 18;

}


// ===============================
// INFOS PERSONNELLES
// ===============================

sectionTitle(pdf,"INFORMATIONS PERSONNELLES",yMain);

yMain += 8;

yMain = infoLine(pdf,"Genre",userData.genre,yMain);
yMain = infoLine(pdf,"Etat civil",userData.etatCivil,yMain);
yMain = infoLine(pdf,"Commune",userData.commune,yMain);
yMain = infoLine(pdf,"Avenue",userData.avenue,yMain);

yMain += 10;


// ===============================
// ECCLESIASTIQUE
// ===============================

sectionTitle(pdf,"INFORMATIONS ECCLÉSIASTIQUES",yMain);

yMain += 8;

yMain = infoLine(pdf,"Eglise",userData.egliseProvenance,yMain);
yMain = infoLine(pdf,"Année baptême",userData.anneeBapteme,yMain);

yMain += 10;


// ===============================
// MUSIQUE
// ===============================

sectionTitle(pdf,"COMPÉTENCES MUSICALES",yMain);

yMain += 8;

yMain = infoLine(pdf,"Registre vocal",userData.registreVoix,yMain);
yMain = infoLine(pdf,"Groupe",userData.groupeMusique,yMain);



// ===============================
// SIDEBAR CONTACT
// ===============================

sidebarTitle(pdf,"CONTACT",ySide);

ySide += 10;

sideIconLine(pdf,"📞 Téléphone",userData.phone,ySide);

ySide += 8;

sideIconLine(pdf,"🎂 Anniversaire",userData.birthday,ySide);

ySide += 8;

sideIconLine(pdf,"🎯 Age",userData.age,ySide);

ySide += 20;


// ===============================
// QR CODE VERIFICATION
// ===============================

const verifyURL =
`${window.location.origin}/myUm/verify.html?uid=${userId}`;

const qr = await loadImage(
`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
);

if(qr){

pdf.addImage(qr,"PNG",15,ySide,40,40);

}

ySide += 45;

pdf.setFontSize(9);

pdf.text(
"Scan pour vérifier ce profil",
35,
ySide,
{align:"center"}
);


// ===============================
// SIGNATURE NUMERIQUE
// ===============================

const signature = await createSignature();

pdf.setFontSize(8);

pdf.text(
`Signature sécurisée : ${signature}`,
mainStart,
280
);


// ===============================
// FOOTER
// ===============================

pdf.setFontSize(8);

pdf.text(
"Document officiel MyUm",
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
// HELPERS UI PDF
// ======================================================

function sidebarTitle(pdf,title,y){

pdf.setFontSize(11);
pdf.setFont(undefined,"bold");

pdf.text(title,10,y);

pdf.setDrawColor(180,180,180);
pdf.line(10,y+2,50,y+2);

}

function sideText(pdf,text,y){

pdf.setFontSize(9);
pdf.setTextColor(120,120,120);

pdf.text(text,10,y);

pdf.setTextColor(0,0,0);

}

function sideValue(pdf,value,y){

pdf.setFontSize(10);
pdf.text(value || "-",10,y);

}

function sectionTitle(pdf,title,y){

pdf.setFontSize(13);
pdf.setFont(undefined,"bold");

pdf.text(title,70,y);

pdf.setDrawColor(200,200,200);
pdf.line(70,y+2,200,y+2);

pdf.setFont(undefined,"normal");

}

function infoLine(pdf,label,value,y){

pdf.setFontSize(10);

pdf.setTextColor(120,120,120);
pdf.text(label,70,y);

pdf.setTextColor(0,0,0);
pdf.text(value || "-",120,y);

return y + 6;

}

function paragraph(pdf,text,x,y,width){

pdf.setFontSize(10);

const lines = pdf.splitTextToSize(text,width);

pdf.text(lines,x,y);

}



// ======================================================
// ⚙️ ZONE IMAGES — MODIFIABLE
// Cette section gère le chargement et la conversion
// des images pour le PDF.
// ======================================================


// IMAGE → BASE64

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



// LOAD IMAGE

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



// ======================================================
// SIGNATURE NUMERIQUE
// ======================================================

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
