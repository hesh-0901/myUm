import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

export async function generateCV(user){

const doc = new jsPDF("p","mm","a4");

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

const sidebarWidth = 75;

/* COLORS */

const dark = [44,62,80];
const light = [240,242,245];
const accent = [52,152,219];

/* SIDEBAR BACKGROUND */

doc.setFillColor(...dark);
doc.rect(0,0,sidebarWidth,pageHeight,"F");

/* MAIN BACKGROUND */

doc.setFillColor(...light);
doc.rect(sidebarWidth,0,pageWidth-sidebarWidth,pageHeight,"F");

/* PHOTO */

const photo = await loadImageBase64(user.photoURL);

if(photo){
doc.addImage(photo,"JPEG",15,20,45,45);
}

/* NAME */

doc.setTextColor(44,62,80);
doc.setFont("helvetica","bold");
doc.setFontSize(26);

doc.text(
`${user.firstName} ${user.lastName}`,
sidebarWidth+15,
30
);

/* POSITION */

doc.setFillColor(...dark);
doc.roundedRect(sidebarWidth+15,35,60,10,3,3,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(11);

doc.text(
user.fonction || "Membre",
sidebarWidth+45,
42,
{align:"center"}
);

/* ======================
SIDEBAR CONTENT
====================== */

let y = 80;

sectionSidebar("Profil");

fieldSidebar("Genre",user.genre);
fieldSidebar("Etat civil",user.etatCivil);
fieldSidebar("Relation",user.statutRelationnel);

y += 8;

sectionSidebar("Infos Église");

fieldSidebar("Église",user.egliseProvenance);
fieldSidebar("Baptême",user.anneeBapteme);
fieldSidebar("Affermissement",user.statutAffermissement);

y += 8;

sectionSidebar("Contact");

fieldSidebar("Téléphone",user.phone);
fieldSidebar("Username",`@${user.username}`);


/* ======================
MAIN CONTENT
====================== */

let x = sidebarWidth + 15;
let yMain = 70;

sectionMain("Compétences musicales");

fieldMain("Registre voix",user.registreVoix);
fieldMain("Groupe musique",user.groupeMusique);

yMain += 10;

sectionMain("Responsabilités");

fieldMain("Fonction",user.fonction);
fieldMain("Responsable",user.responsableMinistere);

yMain += 10;

sectionMain("Informations supplémentaires");

fieldMain("Ancienne fonction",user.ancienneFonction);

/* ======================
QR
====================== */

const qr = await loadImageBase64(generateQR(user.username));

if(qr){

doc.addImage(qr,"PNG",pageWidth-40,pageHeight-40,25,25);

}

/* SAVE */

doc.save(`myum-${user.username}.pdf`);


/* FUNCTIONS */

function sectionSidebar(title){

doc.setTextColor(255,255,255);
doc.setFontSize(13);
doc.setFont("helvetica","bold");

doc.text(title,15,y);

y += 7;

}

function fieldSidebar(label,value){

doc.setFontSize(9);
doc.setTextColor(220,220,220);

doc.text(label,15,y);

doc.setFont("helvetica","bold");

doc.text(value || "—",15,y+4);

doc.setFont("helvetica","normal");

y += 10;

}

function sectionMain(title){

doc.setTextColor(44,62,80);
doc.setFont("helvetica","bold");
doc.setFontSize(14);

doc.text(title,x,yMain);

doc.setDrawColor(...accent);
doc.line(x,yMain+2,x+40,yMain+2);

yMain += 10;

}

function fieldMain(label,value){

doc.setFontSize(11);

doc.setTextColor(120,120,120);
doc.text(label,x,yMain);

doc.setFont("helvetica","bold");
doc.setTextColor(40,40,40);

doc.text(value || "—",x+60,yMain);

doc.setFont("helvetica","normal");

yMain += 10;

}

}

/* IMAGE LOADER */

async function loadImageBase64(url){

try{

const res = await fetch(url);

const blob = await res.blob();

return await new Promise(resolve=>{

const reader = new FileReader();
reader.onloadend = ()=> resolve(reader.result);
reader.readAsDataURL(blob);

});

}catch(e){

return null;

}

}

function generateQR(username){

return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myum.app/member/${username}`;

}
