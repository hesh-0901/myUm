// ==============================================
// EXPORT ENREG PDF — MYUM CV GENERATOR
// ==============================================

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

btn.addEventListener("click", async () => {

btn.disabled = true;

await generatePDF();

btn.disabled = false;

});

}

}catch(e){

console.error("Erreur init PDF :",e);

}

}



// ======================================================
// ⚠️ MOTEUR PRINCIPAL PDF
// ======================================================

async function generatePDF(){

const { jsPDF } = window.jspdf;

const pdf = new jsPDF({
orientation:"portrait",
unit:"mm",
format:"a4"
});



// ======================================================
// 🎨 STYLE — ZONE MODIFIABLE
// ======================================================

const STYLE = {

sidebarWidth:65,

colorSidebar:"#F7F7F7",
colorText:"#111111",
colorSoft:"#666666",
colorBorder:"#E6E6E6",

fontTitle:26,
fontSection:14,
fontText:10

};



// ======================================================
// LAYOUT ENGINE
// ======================================================

const layout = {

pageWidth:210,
pageHeight:297,

sidebarX:0,
sidebarWidth:STYLE.sidebarWidth,

mainX:STYLE.sidebarWidth + 10,

yMain:50,
ySide:105

};



// ======================================================
// SIDEBAR BACKGROUND
// ======================================================

pdf.setFillColor(247,247,247);
pdf.rect(0,0,layout.sidebarWidth,layout.pageHeight,"F");



// ======================================================
// HEADER
// ======================================================

renderHeader(pdf,layout,STYLE);



// ======================================================
// PHOTO PROFIL
// ======================================================

await renderPhoto(pdf);



// ======================================================
// SIDEBAR
// ======================================================

await renderSidebar(pdf,layout);



// ======================================================
// MAIN CONTENT
// ======================================================

renderMainContent(pdf,layout);



// ======================================================
// FOOTER
// ======================================================

pdf.setFontSize(8);

pdf.text(
"Document officiel MyUm",
layout.pageWidth/2,
285,
{align:"center"}
);



// ======================================================
// SAVE
// ======================================================

pdf.save(`myum-${userData.username}.pdf`);

}



// ======================================================
// HEADER
// ======================================================

function renderHeader(pdf,layout,STYLE){

const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`;

pdf.setFontSize(STYLE.fontTitle);
pdf.setFont(undefined,"bold");

pdf.text(fullName.toUpperCase(),layout.mainX,25);

pdf.setFontSize(12);
pdf.setFont(undefined,"normal");

pdf.text(
`${userData.fonction || ""} | @${userData.username || ""}`,
layout.mainX,
32
);

}



// ======================================================
// PHOTO PROFIL
// ======================================================

async function renderPhoto(pdf){

const img = document.getElementById("profilePhoto");

if(!img || !img.complete) return;

const base64 = imageToBase64(img);

if(!base64) return;


// cercle photo

pdf.setDrawColor(220,220,220);

pdf.circle(32,40,20);

pdf.addImage(base64,"JPEG",12,20,40,40);

}



// ======================================================
// SIDEBAR
// ======================================================

async function renderSidebar(pdf,layout){

let y = layout.ySide;

renderSidebarTitle(pdf,"CONTACT",y);

y += 10;

renderSidebarItem(pdf,"Téléphone",userData.phone,y);

y += 8;

renderSidebarItem(pdf,"Anniversaire",userData.birthday,y);

y += 8;

renderSidebarItem(pdf,"Age",userData.age,y);

y += 15;

await renderQRCode(pdf,y);

}



// ======================================================
// MAIN CONTENT
// ======================================================

function renderMainContent(pdf,layout){

let y = layout.yMain;


// ===============================
// BIO / PROFIL (centre visuel)
// ===============================

if(userData.bio){

pdf.setFontSize(14);
pdf.setFont(undefined,"bold");

pdf.text("PROFIL",layout.mainX,y);

y += 8;

pdf.setFontSize(10);
pdf.setFont(undefined,"normal");

const bioLines = pdf.splitTextToSize(userData.bio,110);

pdf.text(bioLines,layout.mainX,y);

y += bioLines.length * 6 + 10;

}


// ===============================
// GRILLE 2 COLONNES
// ===============================

let yLeft = y;
let yRight = y;


// -------- COLONNE GAUCHE --------

pdf.setFontSize(13);
pdf.setFont(undefined,"bold");

pdf.text("INFORMATIONS",layout.mainX,yLeft);

yLeft += 10;

yLeft = renderInfoLine(pdf,"Genre",userData.genre,layout.mainX,yLeft);
yLeft = renderInfoLine(pdf,"Etat civil",userData.etatCivil,layout.mainX,yLeft);
yLeft = renderInfoLine(pdf,"Commune",userData.commune,layout.mainX,yLeft);
yLeft = renderInfoLine(pdf,"Avenue",userData.avenue,layout.mainX,yLeft);


// -------- COLONNE DROITE --------

const column2 = layout.mainX + 65;

pdf.setFontSize(13);
pdf.setFont(undefined,"bold");

pdf.text("ÉGLISE",column2,yRight);

yRight += 10;

yRight = renderInfoLine(pdf,"Eglise",userData.egliseProvenance,column2,yRight);
yRight = renderInfoLine(pdf,"Baptême",userData.anneeBapteme,column2,yRight);

yRight += 8;

pdf.setFontSize(13);
pdf.setFont(undefined,"bold");

pdf.text("MUSIQUE",column2,yRight);

yRight += 10;

yRight = renderInfoLine(pdf,"Registre",userData.registreVoix,column2,yRight);
yRight = renderInfoLine(pdf,"Groupe",userData.groupeMusique,column2,yRight);

}
// ======================================================
// SECTION TEXTE
// ======================================================

function renderSection(pdf,title,text,y){

pdf.setFontSize(14);
pdf.setFont(undefined,"bold");

pdf.text(title,75,y);

y += 8;

pdf.setFont(undefined,"normal");

const lines = pdf.splitTextToSize(text,110);

pdf.text(lines,75,y);

return y + (lines.length * 6) + 5;

}



// ======================================================
// SECTION LISTE
// ======================================================

function renderListSection(pdf,title,items,y){

pdf.setFontSize(14);
pdf.setFont(undefined,"bold");

pdf.text(title,75,y);

y += 8;

pdf.setFontSize(10);
pdf.setFont(undefined,"normal");

items.forEach(([label,value])=>{

if(!value) return;

pdf.setTextColor(120,120,120);
pdf.text(label,75,y);

pdf.setTextColor(0,0,0);

const lines = pdf.splitTextToSize(String(value),60);

pdf.text(lines,120,y);

y += lines.length * 6;

});

return y + 6;

}



// ======================================================
// SIDEBAR UI
// ======================================================

function renderSidebarTitle(pdf,title,y){

pdf.setFontSize(11);
pdf.setFont(undefined,"bold");

pdf.text(title,10,y);

pdf.setDrawColor(200,200,200);

pdf.line(10,y+2,55,y+2);

}

function renderSidebarItem(pdf,label,value,y){

pdf.setFontSize(10);

pdf.setTextColor(120,120,120);
pdf.text(label,10,y);

pdf.setTextColor(0,0,0);

pdf.text(String(value || "-"),10,y+4);

}



// ======================================================
// QR CODE
// ======================================================

async function renderQRCode(pdf,y){

const verifyURL =
`${window.location.origin}/myUm/verify.html?uid=${userId}`;

const qr = await loadImage(
`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
);

if(qr){

pdf.addImage(qr,"PNG",15,y,35,35);

}

}



// ======================================================
// IMAGE HELPERS
// ======================================================

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

function renderInfoLine(pdf,label,value,x,y){

if(!value) return y;

pdf.setFontSize(10);

pdf.setTextColor(120,120,120);
pdf.text(label,x,y);

pdf.setTextColor(0,0,0);

const lines = pdf.splitTextToSize(String(value),50);

pdf.text(lines,x,y+4);

return y + (lines.length * 6);

}
