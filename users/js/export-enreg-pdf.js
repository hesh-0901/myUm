import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

/* ================================
EXPORT CV
================================ */

export async function generateMemberCV(user){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

const sidebarWidth = 65;

let yLeft = 85;
let yRight = 85;

/* ================================
LOAD IMAGES
================================ */

const logo = await loadImageBase64("/myUm/assets/logo-myum.png");
const photo = await loadImageBase64(user.photoURL);
const qr = await loadImageBase64(generateQR(user.username));

/* ================================
HEADER
================================ */

doc.setFillColor(26,54,104);
doc.rect(0,0,pageWidth,60,"F");

doc.setFillColor(52,152,219);
doc.roundedRect(45,22,pageWidth-55,25,12,12,"F");

if(logo){
doc.addImage(logo,"PNG",15,15,35,12);
}

/* ================================
PHOTO CIRCLE
================================ */

if(photo){

doc.setFillColor(255,255,255);
doc.circle(30,35,18,"F");

doc.addImage(photo,"JPEG",12,17,36,36);

}

/* ================================
TEXT HEADER
================================ */

doc.setTextColor(255,255,255);

doc.setFont("helvetica","bold");
doc.setFontSize(24);

doc.text(`${user.firstName} ${user.lastName}`,60,35);

doc.setFontSize(12);
doc.text(`@${user.username}`,60,43);

doc.setFontSize(11);
doc.text(user.fonction || "Membre",60,50);

/* ================================
SIDEBAR
================================ */

doc.setFillColor(245,247,250);
doc.rect(0,60,sidebarWidth,pageHeight,"F");

/* ================================
PERSONAL INFO
================================ */

sectionLeft("Profil");

fieldLeft("Genre",user.genre);
fieldLeft("Etat civil",user.etatCivil);
fieldLeft("Relation",user.statutRelationnel);
fieldLeft("Vie séculière",user.vieSeculiere);
fieldLeft("Commune",user.commune);
fieldLeft("Avenue",user.avenue);

yLeft += 5;

sectionLeft("Infos église");

fieldLeft("Eglise",user.egliseProvenance);
fieldLeft("Année baptême",user.anneeBapteme);
fieldLeft("Type baptême",user.typeBapteme);
fieldLeft("Affermissement",user.statutAffermissement);
fieldLeft("Ancienne fonction",user.ancienneFonction);
fieldLeft("Responsable",user.responsableMinistere);

/* ================================
RIGHT COLUMN
================================ */

sectionRight("Compétences musicales");

fieldRight("Registre voix",user.registreVoix);
fieldRight("Groupe musique",user.groupeMusique);

/* ================================
QR CODE
================================ */

if(qr){

doc.addImage(qr,"PNG",pageWidth-35,265,20,20);

}

/* ================================
FOOTER
================================ */

doc.setDrawColor(220,220,220);
doc.line(15,260,pageWidth-15,260);

doc.setFontSize(9);
doc.setTextColor(120,120,120);

doc.text("Document officiel MyUm",pageWidth/2,268,{align:"center"});

doc.text(`Créé par @${user.username}`,pageWidth/2,273,{align:"center"});

doc.text("https://myum.app",pageWidth/2,278,{align:"center"});

/* ================================
SAVE
================================ */

doc.save(`myum-${user.username}.pdf`);


/* ================================
LEFT SECTION
================================ */

function sectionLeft(title){

doc.setFont("helvetica","bold");
doc.setFontSize(12);
doc.setTextColor(26,54,104);

doc.text(title,10,yLeft);

doc.setDrawColor(52,152,219);
doc.line(10,yLeft+2,60,yLeft+2);

yLeft += 8;

}

function fieldLeft(label,value){

doc.setFontSize(9);
doc.setTextColor(90,90,90);

doc.text(label,10,yLeft);

doc.setFont("helvetica","bold");

doc.text(value || "—",10,yLeft+4);

doc.setFont("helvetica","normal");

yLeft += 10;

}

/* ================================
RIGHT SECTION
================================ */

function sectionRight(title){

doc.setFont("helvetica","bold");
doc.setFontSize(14);
doc.setTextColor(26,54,104);

doc.text(title,sidebarWidth+15,yRight);

doc.setDrawColor(52,152,219);
doc.line(sidebarWidth+15,yRight+2,pageWidth-20,yRight+2);

yRight += 12;

}

function fieldRight(label,value){

doc.setFontSize(11);

doc.setTextColor(120,120,120);

doc.text(label,sidebarWidth+15,yRight);

doc.setFont("helvetica","bold");
doc.setTextColor(40,40,40);

doc.text(value || "—",sidebarWidth+70,yRight);

doc.setFont("helvetica","normal");

yRight += 10;

}

}

/* ================================
QR
================================ */

function generateQR(username){

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${username}`;

}

/* ================================
LOAD IMAGE
================================ */

async function loadImageBase64(url){

try{

const response = await fetch(url);

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
