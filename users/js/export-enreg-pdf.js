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
    muted:[120,120,120],
    line:[230,228,224]
  };

  /* BACKGROUND */

  pdf.setFillColor(...colors.bg);
  pdf.rect(0,0,pageWidth,297,"F");


  /* HEADER CARD */

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(12,15,pageWidth-24,55,5,5,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(12,15,pageWidth-24,55,5,5);


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

      pdf.addImage(base64,"JPEG",18,24,32,32);

    }

  }catch(e){}


  /* NAME */

  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();

  pdf.setTextColor(...colors.text);
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(22);

  pdf.text(fullName || "Membre MyUM",60,35);


  /* ROLE */

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(12);

  if(data.fonction)
    pdf.text(data.fonction,60,43);


  /* USERNAME */

  pdf.setTextColor(...colors.muted);

  if(data.username)
    pdf.text("@"+data.username,60,49);


  let y = 80;


  /* BIO */

  if(data.bio){

    y = drawCard(
      pdf,
      "Présentation",
      data.bio,
      12,
      y,
      pageWidth-24,
      colors
    );

  }


  /* INFORMATIONS PERSONNELLES */

  y = drawFieldsCard(
    pdf,
    "Informations personnelles",
    [
      ["Téléphone",data.phone],
      ["Commune",data.commune],
      ["Avenue",data.avenue],
      ["État civil",data.etatCivil],
      ["Statut relationnel",data.statutRelationnel],
      ["Date naissance",data.birthday],
      ["Âge",data.age]
    ],
    12,
    y+6,
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
    y+6,
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
    y+6,
    pageWidth-24,
    colors
  );


  /* FOOTER */

  pdf.setFontSize(9);
  pdf.setTextColor(...colors.muted);

  pdf.text(
    "MyUM • Département musique",
    pageWidth/2,
    285,
    {align:"center"}
  );


  pdf.save(`${data.firstName || "profil"}-${data.lastName || ""}.pdf`);

}



/* CARD TEXTE */

function drawCard(pdf,title,text,x,y,width,colors){

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(text,width-16);

  const height = lines.length * 6 + 22;

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(x,y,width,height,5,5,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(x,y,width,height,5,5);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...colors.primary);

  pdf.text(title,x+8,y+9);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);
  pdf.setTextColor(...colors.text);

  pdf.text(lines,x+8,y+18);

  return y + height + 6;

}



/* CARD CHAMPS DYNAMIQUES */

function drawFieldsCard(pdf,title,fields,x,y,width,colors){

  const validFields = fields.filter(([label,value])=>{
    return value !== undefined && value !== null && value !== "";
  });

  if(validFields.length === 0){
    return y;
  }

  const height = validFields.length * 8 + 20;

  pdf.setFillColor(...colors.card);
  pdf.roundedRect(x,y,width,height,5,5,"F");

  pdf.setDrawColor(...colors.line);
  pdf.roundedRect(x,y,width,height,5,5);

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...colors.primary);

  pdf.text(title,x+8,y+9);

  pdf.setFont("helvetica","normal");
  pdf.setFontSize(11);

  let yy = y + 18;

  validFields.forEach(([label,value])=>{

    pdf.setTextColor(...colors.muted);
    pdf.text(label,x+8,yy);

    pdf.setTextColor(...colors.text);
    pdf.text(String(value),x+70,yy);

    yy += 8;

  });

  return y + height + 6;

}
