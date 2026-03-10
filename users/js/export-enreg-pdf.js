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

  const colors = {
    bg:[248,247,244],
    card:[255,255,255],
    primary:[92,72,55],
    text:[25,25,25],
    muted:[110,110,110],
    line:[230,228,224]
  };

  /* BACKGROUND */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,297,"F");


  /* HEADER */

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(12,15,pageWidth-24,46,4,4,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(12,15,pageWidth-24,46,4,4);


  /* PHOTO */

  try{

    const imgElement = document.getElementById("profilePhoto");

    if(imgElement && imgElement.src){

      const img = new Image();
      img.crossOrigin="anonymous";
      img.src = imgElement.src;

      await new Promise((res,rej)=>{
        img.onload=res;
        img.onerror=rej;
      });

      const canvas=document.createElement("canvas");
      const ctx=canvas.getContext("2d");

      canvas.width=img.width;
      canvas.height=img.height;

      ctx.drawImage(img,0,0);

      const base64=canvas.toDataURL("image/jpeg");

      pdf.addImage(base64,"JPEG",18,22,28,28);

    }

  }catch(e){}


  /* NAME */

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...colors.text);

  pdf.text(fullName || "Membre MyUM",55,32);


  /* ROLE */

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  if(data.fonction)
  pdf.text(data.fonction,55,39);


  /* USERNAME */

  pdf.setTextColor(...colors.muted);

  if(data.username)
  pdf.text("@"+data.username,55,45);


  let y = 70;


  /* BIO */

  if(data.bio){
    y = drawCard(pdf,"Présentation",data.bio,12,y,pageWidth-24,colors);
  }


  /* INFOS */

  y = drawFieldsCard(
    pdf,
    "Informations personnelles",
    [
      ["Téléphone",data.phone],
      ["Commune",data.commune],
      ["Avenue",data.avenue],
      ["État civil",data.etatCivil],
      ["Relation",data.statutRelationnel],
      ["Naissance",data.birthday],
      ["Âge",data.age]
    ],
    12,
    y,
    pageWidth-24,
    colors
  );


  /* EGLISE */

  y = drawFieldsCard(
    pdf,
    "Église & Baptême",
    [
      ["Église",data.egliseProvenance],
      ["Année baptême",data.anneeBapteme],
      ["Type baptême",data.typeBapteme]
    ],
    12,
    y,
    pageWidth-24,
    colors
  );


  /* MINISTERE */

  y = drawFieldsCard(
    pdf,
    "Ministère musical",
    [
      ["Voix",data.registreVoix],
      ["Groupe",data.groupeMusique],
      ["Responsable",data.responsableMinistere]
    ],
    12,
    y,
    pageWidth-24,
    colors
  );


  /* FOOTER */

  const now = new Date();

  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  const qrText = `MyUM | ${fullName} | @${data.username}`;

  const qrCanvas = document.createElement("canvas");

  await QRCode.toCanvas(qrCanvas, qrText, { width:80 });

  const qrBase64 = qrCanvas.toDataURL("image/png");

  pdf.addImage(qrBase64,"PNG",14,262,22,22);


  pdf.setFontSize(9);
  pdf.setTextColor(...colors.muted);

  pdf.text("Département de musique",40,268);
  pdf.text("UM Compassion",40,273);
  pdf.text("La Compassion Lubumbashi",40,278);

  pdf.text(
    `Téléchargé par : @${data.username}`,
    pageWidth-14,
    268,
    {align:"right"}
  );

  pdf.text(
    `Date : ${dateStr} • ${timeStr}`,
    pageWidth-14,
    274,
    {align:"right"}
  );


  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);

}



/* CARD TEXTE */

function drawCard(pdf,title,text,x,y,width,colors){

  const lines = pdf.splitTextToSize(text,width-16);

  const height = lines.length*5 + 18;

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(x,y,width,height,4,4,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(x,y,width,height,4,4);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.primary);

  pdf.text(title,x+7,y+8);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.text);

  pdf.text(lines,x+7,y+15);

  return y + height + 4;

}



/* CARD FIELDS */

function drawFieldsCard(pdf,title,fields,x,y,width,colors){

  const validFields = fields.filter(([label,value])=>value);

  if(validFields.length===0) return y;

  const height = validFields.length*7 + 18;

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(x,y,width,height,4,4,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(x,y,width,height,4,4);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.primary);

  pdf.text(title,x+7,y+8);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(10);

  let yy = y+16;

  validFields.forEach(([label,value])=>{

    pdf.setTextColor(...colors.muted);
    pdf.text(label,x+7,yy);

    pdf.setTextColor(...colors.text);
    pdf.text(String(value),x+60,yy);

    yy += 7;

  });

  return y + height + 4;

}
