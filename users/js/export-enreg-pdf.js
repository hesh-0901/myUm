import { db } from "/myUm/mains.js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const { jsPDF } = window.jspdf;

let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {

  const storedUser = localStorage.getItem("myum_user");
  if (!storedUser) return;

  const sessionUser = JSON.parse(storedUser);
  currentUserId = sessionUser.id;

  const btn = document.getElementById("exportPdfBtn");
  if (btn) btn.addEventListener("click", generatePDF);

});

async function generatePDF(){

  const snap = await getDoc(doc(db,"users",currentUserId));
  if(!snap.exists()) return;

  const data = snap.data();

  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.width;

  let y = 30;

  const colors = {
    bg:[247,246,243],
    accent:[139,111,78],
    text:[30,30,30],
    muted:[120,120,120],
    line:[230,228,224]
  };

  /* BACKGROUND */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,297,"F");


  /* PHOTO CIRCULAIRE */

  try{

    const imgElement = document.getElementById("profilePhoto");

    if(imgElement && imgElement.src){

      const response = await fetch(imgElement.src);
      const blob = await response.blob();

      const reader = new FileReader();

      const base64 = await new Promise(resolve=>{
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      pdf.addImage(base64,"JPEG",15,20,32,32);

    }

  }catch(e){}


  /* NAME */

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...colors.text);

  pdf.text(fullName || "Membre MyUM",55,30);


  /* BADGE ROLE */

  if(data.fonction){

    pdf.setFillColor(...colors.accent);
    pdf.roundedRect(55,34,40,8,2,2,"F");

    pdf.setTextColor(255,255,255);
    pdf.setFontSize(10);

    pdf.text(data.fonction,58,39);

  }


  /* USERNAME */

  if(data.username){

    pdf.setTextColor(...colors.muted);
    pdf.setFontSize(11);

    pdf.text("@"+data.username,55,48);

  }

  y = 65;


  /* BIO */

  if(data.bio){

    y = drawSectionTitle(pdf,"Présentation",y,colors);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(11);

    const lines = pdf.splitTextToSize(data.bio,pageWidth-30);

    pdf.text(lines,15,y);

    y += lines.length * 6 + 10;

  }


  /* INFORMATIONS PERSONNELLES */

  y = drawFields(pdf,"Informations personnelles",[
    ["📞 Téléphone",data.phone],
    ["📍 Commune",data.commune],
    ["🏠 Avenue",data.avenue],
    ["💍 État civil",data.etatCivil],
    ["❤️ Relation",data.statutRelationnel],
    ["🎂 Naissance",data.birthday],
    ["⏳ Âge",data.age]
  ],y,pdf,colors,pageWidth);


  /* EGLISE */

  y = drawFields(pdf,"Église & Baptême",[
    ["⛪ Église",data.egliseProvenance],
    ["📅 Année baptême",data.anneeBapteme],
    ["💧 Type",data.typeBapteme]
  ],y,pdf,colors,pageWidth);


  /* MINISTERE */

  y = drawFields(pdf,"Ministère musical",[
    ["🎤 Voix",data.registreVoix],
    ["🎶 Groupe",data.groupeMusique],
    ["👤 Responsable",data.responsableMinistere]
  ],y,pdf,colors,pageWidth);


  /* FOOTER */

  const now = new Date();

  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  /* QR BLOCK (désactivé pour maintenant) */

  /*
  const qrText = `MyUM | ${fullName} | @${data.username}`;

  const qrCanvas = document.createElement("canvas");

  await QRCode.toCanvas(qrCanvas, qrText, { width:80 });

  const qrBase64 = qrCanvas.toDataURL("image/png");

  pdf.addImage(qrBase64,"PNG",15,260,25,25);
  */

  pdf.setFontSize(9);
  pdf.setTextColor(...colors.muted);

  pdf.text("Département de musique",45,268);
  pdf.text("UM Compassion",45,273);
  pdf.text("La Compassion Lubumbashi",45,278);

  pdf.text(
    `Téléchargé par : @${data.username}`,
    pageWidth-15,
    268,
    {align:"right"}
  );

  pdf.text(
    `Date : ${dateStr} • ${timeStr}`,
    pageWidth-15,
    274,
    {align:"right"}
  );

  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);

}



/* SECTION TITLE */

function drawSectionTitle(pdf,title,y,colors){

  pdf.setDrawColor(...colors.accent);
  pdf.setLineWidth(2);

  pdf.line(15,y-3,15,y+3);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...colors.text);

  pdf.text(title,18,y);

  return y + 8;

}



/* FIELDS */

function drawFields(pdf,title,fields,y,pdfObj,colors,pageWidth){

  y = drawSectionTitle(pdf,title,y,colors);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  fields.forEach(([label,value])=>{

    if(!value) return;

    if(y > 260){

      pdf.addPage();

      y = 20;

    }

    pdf.setTextColor(...colors.muted);
    pdf.text(label,18,y);

    pdf.setTextColor(...colors.text);
    pdf.text(String(value),70,y);

    y += 7;

  });

  return y + 6;

}
