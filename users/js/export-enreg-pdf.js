import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let userData = null;
let userId = null;

document.addEventListener("DOMContentLoaded", init);

async function init(){

const stored = localStorage.getItem("myum_user");
if(!stored) return;

const user = JSON.parse(stored);

userId = user.id;

const snap = await getDoc(doc(db,"users",userId));

if(!snap.exists()) return;

userData = snap.data();

const btn = document.getElementById("exportPdfBtn");

if(btn) btn.addEventListener("click",generatePDF);

}

async function generatePDF(){

const { jsPDF } = window.jspdf;

const pdf = new jsPDF({
orientation:"portrait",
unit:"mm",
format:"a4"
});

let y = 25;


// HEADER BAR

pdf.setFillColor(26,54,104);
pdf.rect(0,0,210,15,"F");


// LOGO

const logo = await loadImage("/myUm/assets/logo-myum.png");

pdf.addImage(logo,"PNG",85,18,40,15);

y = 40;


// PHOTO

const img = document.getElementById("profilePhoto");

if(img){

const base64 = imageToBase64(img);

pdf.addImage(base64,"JPEG",85,y,40,40);

}

y += 50;


// NAME

const fullName = `${userData.firstName} ${userData.lastName}`;

pdf.setFontSize(18);
pdf.text(fullName,105,y,{align:"center"});

y += 7;

pdf.setFontSize(12);
pdf.text(`@${userData.username}`,105,y,{align:"center"});

y += 6;

if(userData.fonction){

pdf.text(userData.fonction,105,y,{align:"center"});

y += 8;

}


// USER ID

pdf.setFontSize(10);

pdf.text(`ID MyUm : ${userId}`,105,y,{align:"center"});

y += 12;


// SECTION

section(pdf,"Informations personnelles",y);

y += 7;

y = line(pdf,"Genre",userData.genre,y);
y = line(pdf,"Etat civil",userData.etatCivil,y);
y = line(pdf,"Commune",userData.commune,y);
y = line(pdf,"Avenue",userData.avenue,y);

y += 6;

section(pdf,"Informations ecclésiastiques",y);

y += 7;

y = line(pdf,"Eglise",userData.egliseProvenance,y);
y = line(pdf,"Année baptême",userData.anneeBapteme,y);

y += 6;

section(pdf,"Compétences musicales",y);

y += 7;

y = line(pdf,"Registre",userData.registreVoix,y);
y = line(pdf,"Groupe",userData.groupeMusique,y);

y += 15;


// DATE

const now = new Date();

pdf.setFontSize(10);

pdf.text(
`Créé le ${now.toLocaleDateString()} à ${now.toLocaleTimeString()}`,
105,
y,
{align:"center"}
);

y += 10;


// SIGNATURE

const signature = await createSignature();

pdf.setFontSize(9);

pdf.text(
`Signature numérique : ${signature}`,
105,
y,
{align:"center"}
);

y += 10;


// QR CODE

const verifyURL =
`${window.location.origin}/verify.html?uid=${userId}`;

const qr = await loadImage(
`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyURL)}`
);

pdf.addImage(qr,"PNG",90,y,30,30);

y += 35;


// FOOTER

pdf.setFontSize(8);

pdf.text(
"Document officiel généré par MyUm",
105,
285,
{align:"center"}
);


// SAVE

pdf.save(`myum-${userData.username}.pdf`);

}



// HELPERS

function section(pdf,title,y){

pdf.setFontSize(14);
pdf.text(title,20,y);

}

function line(pdf,label,value,y){

pdf.setFontSize(11);

pdf.text(`${label}:`,20,y);
pdf.text(value || "-",70,y);

return y+6;

}

function imageToBase64(img){

const canvas = document.createElement("canvas");

canvas.width = img.naturalWidth;
canvas.height = img.naturalHeight;

const ctx = canvas.getContext("2d");

ctx.drawImage(img,0,0);

return canvas.toDataURL("image/jpeg");

}

async function loadImage(url){

const res = await fetch(url);
const blob = await res.blob();

return new Promise(resolve=>{

const reader = new FileReader();

reader.onloadend=()=>resolve(reader.result);

reader.readAsDataURL(blob);

});

}

async function createSignature(){

const data = `${userData.username}-${userId}-${Date.now()}`;

const enc = new TextEncoder();

const buffer = await crypto.subtle.digest(
"SHA-256",
enc.encode(data)
);

const arr = Array.from(new Uint8Array(buffer));

return arr.map(b=>b.toString(16).padStart(2,"0")).join("").substring(0,16);

}
